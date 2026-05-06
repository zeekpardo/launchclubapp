"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAcademicRecords(personId: string) {
	return useQuery(
		orpc.academicRecords.list.queryOptions({
			input: { personId },
			enabled: !!personId,
		}),
	);
}

export function useUpsertAcademicRecord() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.academicRecords.upsert.mutationOptions({
			onSuccess: (_data, variables) => {
				queryClient.invalidateQueries(
					orpc.academicRecords.list.queryOptions({
						input: { personId: variables.personId },
					}),
				);
			},
		}),
	);
}

export function useDeleteAcademicRecord() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.academicRecords.delete.mutationOptions({
			onSuccess: (_data, variables) => {
				queryClient.invalidateQueries(
					orpc.academicRecords.list.queryOptions({
						input: { personId: variables.personId },
					}),
				);
			},
		}),
	);
}

export function useAcademicYears(organizationId: string) {
	return useQuery(
		orpc.academicYears.list.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);
}
