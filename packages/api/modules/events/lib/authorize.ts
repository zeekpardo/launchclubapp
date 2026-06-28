import { ORPCError } from "@orpc/client";
import {
  getAreaById,
  getGroupById,
  getSiteById,
  getUserSiteIds,
} from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite, canManageGroup } from "../../organizations/lib/site-access";

/**
 * Authorize attaching/moving an event to EVERY group in `groupIds`.
 *
 * Previously only the first group was checked while the event was attached to
 * all of them, letting a site/group leader attach events to groups outside
 * their scope. This verifies the caller is a member of the org and that all
 * groups belong to that same org and are within the caller's scope.
 *
 * Returns the organization id derived from the first group.
 */
export async function authorizeEventGroups(
  userId: string,
  userRole: string | null | undefined,
  groupIds: string[],
): Promise<string> {
  if (groupIds.length === 0) {
    throw new ORPCError("BAD_REQUEST", { message: "At least one group is required" });
  }

  const firstGroup = await getGroupById(groupIds[0]);
  if (!firstGroup) throw new ORPCError("NOT_FOUND");
  const firstSite = await getSiteById(firstGroup.siteId);
  if (!firstSite) throw new ORPCError("NOT_FOUND");
  const firstArea = await getAreaById(firstSite.areaId);
  if (!firstArea) throw new ORPCError("NOT_FOUND");
  const organizationId = firstArea.organizationId;

  const membership = await verifyOrganizationMembership(organizationId, userId);
  const isOwner =
    membership.role === "owner" || membership.role === "admin" || userRole === "admin";
  const userSiteIds = isOwner ? [] : await getUserSiteIds(userId);

  for (const groupId of groupIds) {
    const group = groupId === groupIds[0] ? firstGroup : await getGroupById(groupId);
    if (!group) throw new ORPCError("NOT_FOUND");
    const site = groupId === groupIds[0] ? firstSite : await getSiteById(group.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = groupId === groupIds[0] ? firstArea : await getAreaById(site.areaId);
    // All groups must belong to the same org as the first.
    if (!area || area.organizationId !== organizationId) {
      throw new ORPCError("FORBIDDEN");
    }
    if (!isOwner) {
      if (userSiteIds.length > 0) {
        if (!(await canAccessSite(userId, group.siteId))) throw new ORPCError("FORBIDDEN");
      } else if (!(await canManageGroup(userId, groupId))) {
        throw new ORPCError("FORBIDDEN");
      }
    }
  }

  return organizationId;
}
