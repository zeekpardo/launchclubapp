import { ORPCError } from "@orpc/client";
import { getSitesByOrganization, getSitesByUser } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const listSites = protectedProcedure
  .route({ method: "GET", path: "/sites", tags: ["Sites"] })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    // owner, LC admin (member.role="admin"), or platform admin: see all sites
    const isOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (isOwner) return getSitesByOrganization(input.organizationId);
    // site leader (member.role="member" + UserSite): scoped to assigned sites
    // group leader (member.role="member" + UserGroup): returns empty (no UserSite records)
    return getSitesByUser(context.user.id);
  });
