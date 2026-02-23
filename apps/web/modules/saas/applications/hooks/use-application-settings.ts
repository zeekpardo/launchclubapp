"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

export function useOrgApplicationSettings() {
	const { activeOrganization } = useActiveOrganization();
	return useQuery(
		orpc.applications.getOrgSettings.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
		}),
	);
}

export function useUpdateOrgApplicationSettings() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.applications.updateOrgSettings.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.applications.getOrgSettings.queryOptions({
					input: { organizationId: "" },
				}).queryKey.slice(0, 1),
			});
		},
	});
}

export function useUpdateSiteApplicationSettings() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.sites.update.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.sites.list.queryOptions({
					input: { organizationId: "" },
				}).queryKey.slice(0, 1),
			});
		},
	});
}
