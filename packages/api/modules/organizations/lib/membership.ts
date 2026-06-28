import { ORPCError } from "@orpc/client";
import { getOrganizationMembership } from "@repo/database";

/**
 * Verifies the user belongs to the organization and returns their membership.
 *
 * Throws FORBIDDEN when the user is not a member, so the check is safe even at
 * call sites that don't inspect the return value — a non-member can never
 * proceed past this call. Call sites that capture the result still get the
 * membership object (e.g. for `.role`).
 */
export async function verifyOrganizationMembership(
	organizationId: string,
	userId: string,
) {
	const membership = await getOrganizationMembership(organizationId, userId);

	if (!membership) {
		throw new ORPCError("FORBIDDEN");
	}

	return {
		organization: membership.organization,
		role: membership.role,
	};
}
