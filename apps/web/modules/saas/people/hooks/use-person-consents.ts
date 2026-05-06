"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

export function usePersonConsents(personId: string, academicYearId: string | undefined) {
	return useQuery(
		orpc.personConsents.list.queryOptions({
			input: { personId, academicYearId: academicYearId ?? "" },
			enabled: !!personId && !!academicYearId,
		}),
	);
}

export function usePreviousYearConsents(personId: string, organizationId: string) {
	return useQuery(
		orpc.personConsents.listPrevious.queryOptions({
			input: { personId, organizationId },
			enabled: !!personId && !!organizationId,
		}),
	);
}
