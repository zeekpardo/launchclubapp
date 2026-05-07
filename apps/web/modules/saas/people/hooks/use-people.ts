"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePeople(opts?: { personType?: "STUDENT" | "PARENT" | "MENTOR"; isActive?: boolean; query?: string; areaId?: string; siteId?: string }) {
	const { activeOrganization } = useActiveOrganization();
	return useQuery(
		orpc.people.list.queryOptions({
			input: {
				organizationId: activeOrganization?.id ?? "",
				personType: opts?.personType,
				isActive: opts?.isActive,
				query: opts?.query,
				areaId: opts?.areaId,
				siteId: opts?.siteId,
			},
			enabled: !!activeOrganization?.id,
		}),
	);
}

export function usePerson(id: string) {
	const { activeOrganization } = useActiveOrganization();
	return useQuery(
		orpc.people.get.queryOptions({
			input: { id, organizationId: activeOrganization?.id ?? "" },
			enabled: !!activeOrganization?.id,
		}),
	);
}

export function useCreatePerson() {
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	return useMutation(
		orpc.people.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.people.list.queryOptions({
						input: { organizationId: activeOrganization?.id ?? "" },
					}),
				);
			},
		}),
	);
}

export function useUpdatePerson() {
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	return useMutation(
		orpc.people.update.mutationOptions({
			onSuccess: (_data, variables) => {
				queryClient.invalidateQueries(
					orpc.people.list.queryOptions({
						input: { organizationId: activeOrganization?.id ?? "" },
					}),
				);
				queryClient.invalidateQueries(
					orpc.people.get.queryOptions({
						input: { id: variables.id, organizationId: activeOrganization?.id ?? "" },
					}),
				);
			},
		}),
	);
}

export function useDeletePerson() {
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	return useMutation(
		orpc.people.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.people.list.queryOptions({
						input: { organizationId: activeOrganization?.id ?? "" },
					}),
				);
			},
		}),
	);
}
