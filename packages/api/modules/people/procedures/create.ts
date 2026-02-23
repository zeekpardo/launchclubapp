import { createPerson, createHousehold } from "@repo/database";
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
