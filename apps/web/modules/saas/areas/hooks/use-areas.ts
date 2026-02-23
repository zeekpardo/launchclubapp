"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

export function useArea(id: string) {
	return useQuery(
		orpc.areas.get.queryOptions({
			input: { id },
		}),
	);
}

export function useAreas() {
	const { activeOrganization } = useActiveOrganization();
	return useQuery(
		orpc.areas.list.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
		}),
	);
}

export function useCreateArea() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.areas.create.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.areas.list.queryOptions({
					input: { organizationId: "" },
				}).queryKey.slice(0, 1),
			});
		},
	});
}

export function useUpdateArea() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.areas.update.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["areas"] });
		},
	});
}

export function useDeleteArea() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.areas.delete.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["areas"] });
		},
	});
}
