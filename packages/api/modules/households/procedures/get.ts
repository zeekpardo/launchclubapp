import { ORPCError } from "@orpc/client";
import { getHouseholdById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const getHousehold = protectedProcedure
  .route({ method: "GET", path: "/households/{id}", tags: ["Households"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const household = await getHouseholdById(input.id);
    if (!household) throw new ORPCError("NOT_FOUND");
    await verifyOrganizationMembership(household.organizationId, context.user.id);
    return household;
  });
