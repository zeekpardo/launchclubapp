import { ORPCError } from "@orpc/client";
import { getPersonById, removeGuardian } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const removeGuardianProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/guardians", tags: ["Guardians"] })
  .input(z.object({ personId: z.string(), kidId: z.string() }))
  .handler(async ({ input, context }) => {
    // Verify the guardian person exists and the caller belongs to its org
    // before severing any guardian link.
    const guardian = await getPersonById(input.personId);
    if (!guardian) throw new ORPCError("NOT_FOUND");
    await verifyOrganizationMembership(guardian.organizationId, context.user.id);

    await removeGuardian(input.personId, input.kidId);
    return { success: true };
  });
