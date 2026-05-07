import { ORPCError } from "@orpc/client";
import {
  getMentorApplicationById,
  reviewMentorApplication,
  db,
  getUserByEmail,
  addUserToGroup,
  createPerson,
} from "@repo/database";
import { auth } from "@repo/auth";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { reviewMentorApplicationSchema } from "../types";

export const reviewMentorApplicationProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/mentor-applications/{id}/review", tags: ["MentorApplications"] })
  .input(reviewMentorApplicationSchema)
  .handler(async ({ input, context }) => {
    const application = await getMentorApplicationById(input.id);
    if (!application) throw new ORPCError("NOT_FOUND");
    const { organizationId } = application;
    const membership = await verifyOrganizationMembership(organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      if (context.user.role !== "admin") throw new ORPCError("FORBIDDEN");
    }

    const reviewed = await reviewMentorApplication(
      input.id,
      input.status,
      context.user.id,
      input.assignedGroupId,
    );

    // On first approval: provision the mentor as an org member + optional group leader
    if (input.status === "APPROVED" && application.status !== "APPROVED") {
      const groupId = input.assignedGroupId ?? application.assignedGroupId ?? undefined;

      let user = await getUserByEmail(application.email);
      const isNewUser = !user;

      if (!user) {
        const now = new Date();
        user = await db.user.create({
          data: {
            name: `${application.firstName} ${application.lastName}`,
            email: application.email,
            emailVerified: true,
            createdAt: now,
            updatedAt: now,
          },
        });
      }

      const existingMember = await db.member.findUnique({
        where: { organizationId_userId: { organizationId, userId: user.id } },
      });

      if (!existingMember) {
        await db.member.create({
          data: { organizationId, userId: user.id, role: "member", createdAt: new Date() },
        });
      }

      if (groupId) {
        await addUserToGroup(user.id, groupId).catch(() => null);
      }

      // Create a Person record for the mentor if one doesn't already exist
      const existingPerson = await db.person.findFirst({
        where: { organizationId, email: application.email },
      });
      if (!existingPerson) {
        await createPerson({
          organizationId,
          firstName: application.firstName,
          lastName: application.lastName,
          email: application.email,
          phone: application.phone ?? undefined,
          personType: "MENTOR",
        });
      }

      if (isNewUser) {
        void auth.api.signInMagicLink({
          body: { email: application.email, callbackURL: "/app" },
          headers: new Headers(),
        });
      }
    }

    return reviewed;
  });
