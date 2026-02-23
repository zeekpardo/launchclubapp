import { ORPCError } from "@orpc/client";
import { deleteSite, getSiteById, getAreaById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const deleteSiteProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/sites/{id}", tags: ["Sites"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const site = await getSiteById(input.id);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership || membership.role !== "owner") throw new ORPCError("FORBIDDEN");
    await deleteSite(input.id);
    return { success: true };
  });
