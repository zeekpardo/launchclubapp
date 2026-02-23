"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAreaFormFields(areaId: string) {
	return useQuery(
		orpc.formBuilder.listAreaFields.queryOptions({
			input: { areaId },
			enabled: !!areaId,
		}),
	);
}

export function useSiteFormFields(siteId: string) {
	return useQuery(
		orpc.formBuilder.listSiteFields.queryOptions({
			input: { siteId },
			enabled: !!siteId,
		}),
	);
}

export function useAddFormField(areaId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.addField.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listAreaFields.queryOptions({ input: { areaId } }),
				);
			},
		}),
	);
}

export function useUpdateFormField(areaId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.updateField.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listAreaFields.queryOptions({ input: { areaId } }),
				);
			},
		}),
	);
}

export function useDeleteFormField(areaId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.deleteField.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listAreaFields.queryOptions({ input: { areaId } }),
				);
			},
		}),
	);
}

export function useReorderFormFields(areaId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.reorderFields.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listAreaFields.queryOptions({ input: { areaId } }),
				);
			},
		}),
	);
}
