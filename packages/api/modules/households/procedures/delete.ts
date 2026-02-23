import { ORPCError } from "@orpc/client";
import { deleteHousehold, getHouseholdById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const deleteHouseholdProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/households/{id}", tags: ["Households"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const household = await getHouseholdById(input.id);
    if (!household) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(household.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) throw new ORPCError("FORBIDDEN");
    await deleteHousehold(input.id);
    return { success: true };
  });
