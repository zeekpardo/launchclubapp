import { ORPCError } from "@orpc/client";
import { getAreaById, getSiteById, createFormField } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { addFieldSchema } from "../types";

export const addField = protectedProcedure
  .route({ method: "POST", path: "/form-builder/fields", tags: ["FormBuilder"] })
  .input(addFieldSchema)
  .handler(async ({ input, context }) => {
    if (!input.areaId && !input.siteId) {
      throw new ORPCError("BAD_REQUEST", { message: "Either areaId or siteId is required." });
    }

    let organizationId: string;

    if (input.areaId) {
      const area = await getAreaById(input.areaId);
      if (!area) throw new ORPCError("NOT_FOUND");
      organizationId = area.organizationId;
    } else {
      const site = await getSiteById(input.siteId!);
      if (!site) throw new ORPCError("NOT_FOUND");
      organizationId = site.area.organizationId;
    }

    const membership = await verifyOrganizationMembership(organizationId, context.user.id);
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new ORPCError("FORBIDDEN");
    }

    return createFormField(input);
  });
