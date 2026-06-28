import { ORPCError } from "@orpc/client";
import {
	getGroupsByOrganization,
	getSitesByOrganization,
} from "@repo/database";

/**
 * Ensure every site id belongs to the organization. Prevents an admin of one
 * org from granting a user access to another org's sites by passing foreign ids.
 */
export async function assertSitesInOrg(
	siteIds: string[],
	organizationId: string,
) {
	if (siteIds.length === 0) {
		return;
	}
	const sites = await getSitesByOrganization(organizationId);
	const valid = new Set(sites.map((s) => s.id));
	if (siteIds.some((id) => !valid.has(id))) {
		throw new ORPCError("BAD_REQUEST", {
			message: "One or more sites do not belong to this organization",
		});
	}
}

/** Ensure every group id belongs to the organization. */
export async function assertGroupsInOrg(
	groupIds: string[],
	organizationId: string,
) {
	if (groupIds.length === 0) {
		return;
	}
	const groups = await getGroupsByOrganization(organizationId);
	const valid = new Set(groups.map((g) => g.id));
	if (groupIds.some((id) => !valid.has(id))) {
		throw new ORPCError("BAD_REQUEST", {
			message: "One or more groups do not belong to this organization",
		});
	}
}
