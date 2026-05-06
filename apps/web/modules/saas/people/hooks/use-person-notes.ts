"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function usePersonNotes(personId: string) {
	return useQuery(
		orpc.personNotes.list.queryOptions({
			input: { personId },
			enabled: !!personId,
		}),
	);
}

export function useCreatePersonNote() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.personNotes.create.mutationOptions({
			onSuccess: (_data, variables) => {
				queryClient.invalidateQueries(
					orpc.personNotes.list.queryOptions({
						input: { personId: variables.personId },
					}),
				);
			},
		}),
	);
}

export function useUpdatePersonNote() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.personNotes.update.mutationOptions({
			onSuccess: (_data, variables) => {
				queryClient.invalidateQueries(
					orpc.personNotes.list.queryOptions({
						input: { personId: variables.personId },
					}),
				);
			},
		}),
	);
}

export function useDeletePersonNote() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.personNotes.delete.mutationOptions({
			onSuccess: (_data, variables) => {
				queryClient.invalidateQueries(
					orpc.personNotes.list.queryOptions({
						input: { personId: variables.personId },
					}),
				);
			},
		}),
	);
}

export function useMentionableUsers(organizationId: string) {
	return useQuery(
		orpc.personNotes.mentionableUsers.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);
}
