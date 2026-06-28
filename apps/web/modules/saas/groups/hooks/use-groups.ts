"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type GroupDetail = NonNullable<ReturnType<typeof useGroup>["data"]>;

export function useGroups() {
	const { activeOrganization } = useActiveOrganization();
	return useQuery(
		orpc.groups.list.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
			enabled: !!activeOrganization?.id,
		}),
	);
}

export function useGroup(id: string) {
	return useQuery(
		orpc.groups.get.queryOptions({
			input: { id },
		}),
	);
}

export function useCreateGroup() {
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	return useMutation(
		orpc.groups.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.groups.list.queryOptions({
						input: { organizationId: activeOrganization?.id ?? "" },
					}),
				);
			},
		}),
	);
}

export function useUpdateGroup() {
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	return useMutation(
		orpc.groups.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.groups.list.queryOptions({
						input: { organizationId: activeOrganization?.id ?? "" },
					}),
				);
			},
		}),
	);
}

export function useDeleteGroup() {
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	return useMutation(
		orpc.groups.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.groups.list.queryOptions({
						input: { organizationId: activeOrganization?.id ?? "" },
					}),
				);
			},
		}),
	);
}

export function useAddMember() {
	return useMutation(orpc.groups.addMember.mutationOptions());
}

export function useRemoveMember() {
	return useMutation(orpc.groups.removeMember.mutationOptions());
}
