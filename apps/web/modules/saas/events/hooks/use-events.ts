"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

export function useEvents(groupId: string) {
	return useQuery(
		orpc.events.list.queryOptions({
			input: { groupId },
			enabled: !!groupId,
		}),
	);
}

export function useEvent(id: string) {
	return useQuery(
		orpc.events.get.queryOptions({
			input: { id },
			enabled: !!id,
		}),
	);
}

export function useCreateEvent() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.events.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["events"] });
			},
		}),
	);
}

export function useUpdateEvent() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.events.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["events"] });
			},
		}),
	);
}

export function useDeleteEvent() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.events.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["events"] });
			},
		}),
	);
}
