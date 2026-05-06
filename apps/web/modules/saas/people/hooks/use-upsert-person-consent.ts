"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpsertPersonConsent() {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.personConsents.upsert.mutationOptions({
			onSuccess: (_data, variables) => {
				queryClient.invalidateQueries(
					orpc.personConsents.list.queryOptions({
						input: {
							personId: variables.personId,
							academicYearId: variables.academicYearId,
						},
					}),
				);
			},
		}),
	);
}
