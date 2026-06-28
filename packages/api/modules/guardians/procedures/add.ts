import { ORPCError } from "@orpc/client";
import { addGuardian, getPersonById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const addGuardianProcedure = protectedProcedure
  .route({ method: "POST", path: "/guardians", tags: ["Guardians"] })
  .input(z.object({ personId: z.string(), kidId: z.string(), relation: z.string().optional() }))
  .handler(async ({ input, context }) => {
    const guardian = await getPersonById(input.personId);
    if (!guardian) throw new ORPCError("NOT_FOUND", { message: "Guardian person not found" });
    if (guardian.personType !== "PARENT") {
      throw new ORPCError("BAD_REQUEST", { message: "Guardian must have personType PARENT" });
    }

    const kid = await getPersonById(input.kidId);
    if (!kid) throw new ORPCError("NOT_FOUND", { message: "Child person not found" });
    if (kid.personType !== "STUDENT") {
      throw new ORPCError("BAD_REQUEST", { message: "Child must have personType STUDENT" });
    }

    // Both must be in the same org, and the caller must be a member of it.
    if (guardian.organizationId !== kid.organizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Guardian and child must be in the same organization" });
    }
    await verifyOrganizationMembership(guardian.organizationId, context.user.id);

    return addGuardian(input.personId, input.kidId, input.relation);
  });
