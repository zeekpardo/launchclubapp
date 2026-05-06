import { createPerson, createHousehold, getOrgApplicationSettings, db } from "@repo/database";
import { ORPCError } from "@orpc/client";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createPersonSchema } from "../types";

export const createPersonProcedure = protectedProcedure
  .route({ method: "POST", path: "/people", tags: ["People"] })
  .input(createPersonSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const { organizationId, dateOfBirth, ...data } = input;

    if (data.isChild && !data.studentId) {
      try {
        const settings = await getOrgApplicationSettings(organizationId);
        if (settings?.studentIdMode === "auto") {
          let studentId: string | null = null;
          for (let i = 0; i < 10; i++) {
            const candidate = String(Math.floor(100000 + Math.random() * 900000));
            const exists = await db.person.findFirst({
              where: { organizationId, studentId: candidate },
              select: { id: true },
            });
            if (!exists) { studentId = candidate; break; }
          }
          if (studentId) data.studentId = studentId;
        }
      } catch { /* non-critical */ }
    }

    let householdId = data.householdId;
    if (!householdId) {
      const household = await createHousehold({
        organizationId,
        name: `${data.lastName} Family`,
      });
      householdId = household.id;
    }

    return createPerson({
      ...data,
      organizationId,
      householdId,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    });
  });
