"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAddGuardian() {
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	return useMutation(
		orpc.guardians.add.mutationOptions({
			onSuccess: (_, { kidId }) => {
				queryClient.invalidateQueries(
					orpc.people.get.queryOptions({ input: { id: kidId, organizationId: activeOrganization?.id ?? "" } }),
				);
				queryClient.invalidateQueries(
					orpc.people.list.queryOptions({
						input: {
							organizationId: activeOrganization?.id ?? "",
							personType: "STUDENT" as const,
						},
					}),
				);
			},
		}),
	);
}

export function useRemoveGuardian() {
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	return useMutation(
		orpc.guardians.remove.mutationOptions({
			onSuccess: (_, { kidId }) => {
				queryClient.invalidateQueries(
					orpc.people.get.queryOptions({ input: { id: kidId, organizationId: activeOrganization?.id ?? "" } }),
				);
				queryClient.invalidateQueries(
					orpc.people.list.queryOptions({
						input: {
							organizationId: activeOrganization?.id ?? "",
							personType: "STUDENT" as const,
						},
					}),
				);
			},
		}),
	);
}
