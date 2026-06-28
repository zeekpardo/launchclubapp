"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useActiveOrganization } from "./use-active-organization";

export function useMyLcRole() {
	const { activeOrganization } = useActiveOrganization();
	const { data } = useQuery({
		...orpc.organizations.getMyLcRole.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
		}),
		enabled: !!activeOrganization?.id,
	});
	return data?.lcRole ?? null;
}
