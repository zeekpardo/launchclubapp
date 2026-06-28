"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useSites(organizationId?: string) {
	const { activeOrganization } = useActiveOrganization();
	const resolvedOrgId = organizationId ?? activeOrganization?.id ?? "";
	return useQuery(
		orpc.sites.list.queryOptions({
			input: { organizationId: resolvedOrgId },
		}),
	);
}

export function useCreateSite() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.sites.create.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.sites.list
					.queryOptions({
						input: { organizationId: "" },
					})
					.queryKey.slice(0, 1),
			});
		},
	});
}

export function useUpdateSite() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.sites.update.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sites"] });
		},
	});
}

export function useDeleteSite() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.sites.delete.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["sites"] });
		},
	});
}
