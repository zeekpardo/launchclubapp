import { ORPCError } from "@orpc/client";
import { getCustomFieldById } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const getCustomFieldUploadUrlProcedure = protectedProcedure
  .route({ method: "POST", path: "/custom-fields/upload-url", tags: ["CustomFields"] })
  .input(z.object({ customFieldId: z.string(), personId: z.string() }))
  .handler(async ({ input, context }) => {
    const field = await getCustomFieldById(input.customFieldId);
    if (!field) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(field.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const path = `custom-fields/${field.organizationId}/${input.personId}/${input.customFieldId}`;
    const signedUploadUrl = await getSignedUploadUrl(path, { bucket: "customFields" });
    return { signedUploadUrl, path };
  });
