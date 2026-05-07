import { ORPCError } from "@orpc/client";
import {
  getFormById,
  assignSitesToForm,
  createFormField,
  deleteFormField,
} from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { assignSitesSchema } from "../types";

export const assignSitesProcedure = protectedProcedure
  .route({ method: "PUT", path: "/forms/{formId}/sites", tags: ["Forms"], summary: "Assign sites to a form" })
  .input(assignSitesSchema)
  .handler(async ({ input, context }) => {
    const form = await getFormById(input.formId);
    if (!form) throw new ORPCError("NOT_FOUND");

    const membership = await verifyOrganizationMembership(form.organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }

    await assignSitesToForm(input.formId, input.siteIds);

    // Auto-manage SITE_SELECTOR field
    const existingSiteSelector = form.fields.find((f) => f.type === "SITE_SELECTOR");

    if (input.siteIds.length >= 2 && !existingSiteSelector) {
      // Ensure a SITE_SELECTOR field exists
      await createFormField({
        formId: input.formId,
        label: "Site",
        fieldKey: "siteSelector",
        type: "SITE_SELECTOR",
        required: true,
      });
    } else if (input.siteIds.length <= 1 && existingSiteSelector) {
      // Remove the SITE_SELECTOR field when only 0-1 sites
      await deleteFormField(existingSiteSelector.id);
    }

    return getFormById(input.formId);
  });
