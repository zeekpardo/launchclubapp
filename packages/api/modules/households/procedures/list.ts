import { getHouseholdsByOrganization } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const listHouseholds = protectedProcedure
  .route({ method: "GET", path: "/households", tags: ["Households"] })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input, context }) => {
    await verifyOrganizationMembership(input.organizationId, context.user.id);
    return getHouseholdsByOrganization(input.organizationId);
  });
