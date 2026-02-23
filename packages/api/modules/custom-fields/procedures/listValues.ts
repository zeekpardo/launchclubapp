import { ORPCError } from "@orpc/client";
import { getCustomFieldValues } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const listCustomFieldValuesProcedure = protectedProcedure
  .route({ method: "GET", path: "/custom-fields/values", tags: ["CustomFields"] })
  .input(z.object({ organizationId: z.string(), personId: z.string() }))
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    return getCustomFieldValues(input.personId);
  });
