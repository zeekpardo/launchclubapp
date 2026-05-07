"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Form-scoped hooks (new architecture) ────────────────────────────────────

export function useFormFields(formId: string) {
	return useQuery(
		orpc.formBuilder.listFormFields.queryOptions({
			input: { formId },
			enabled: !!formId,
		}),
	);
}

export function useAddFormField(formId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.addField.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listFormFields.queryOptions({ input: { formId } }),
				);
			},
		}),
	);
}

export function useUpdateFormField(formId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.updateField.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listFormFields.queryOptions({ input: { formId } }),
				);
			},
		}),
	);
}

export function useDeleteFormField(formId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.deleteField.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listFormFields.queryOptions({ input: { formId } }),
				);
			},
		}),
	);
}

export function useReorderFormFields(formId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.reorderFields.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listFormFields.queryOptions({ input: { formId } }),
				);
			},
		}),
	);
}

// ─── Legacy area/org-scoped hooks (deprecated, kept for backward compat) ─────

/** @deprecated Use useFormFields(formId) instead */
export function useAreaFormFields(areaId: string) {
	return useQuery(
		orpc.formBuilder.listAreaFields.queryOptions({
			input: { areaId },
			enabled: !!areaId,
		}),
	);
}

/** @deprecated Use useFormFields(formId) instead */
export function useSiteFormFields(siteId: string) {
	return useQuery(
		orpc.formBuilder.listSiteFields.queryOptions({
			input: { siteId },
			enabled: !!siteId,
		}),
	);
}

/** @deprecated Use useFormFields(formId) instead */
export function useOrgFormFields(organizationId: string) {
	return useQuery(
		orpc.formBuilder.listOrgFields.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);
}

/** @deprecated Use useAddFormField(formId) instead */
export function useAddOrgFormField(organizationId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.addField.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listOrgFields.queryOptions({ input: { organizationId } }),
				);
			},
		}),
	);
}

/** @deprecated Use useUpdateFormField(formId) instead */
export function useUpdateOrgFormField(organizationId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.updateField.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listOrgFields.queryOptions({ input: { organizationId } }),
				);
			},
		}),
	);
}

/** @deprecated Use useDeleteFormField(formId) instead */
export function useDeleteOrgFormField(organizationId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.deleteField.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listOrgFields.queryOptions({ input: { organizationId } }),
				);
			},
		}),
	);
}

/** @deprecated Use useReorderFormFields(formId) instead */
export function useReorderOrgFormFields(organizationId: string) {
	const queryClient = useQueryClient();
	return useMutation(
		orpc.formBuilder.reorderFields.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(
					orpc.formBuilder.listOrgFields.queryOptions({ input: { organizationId } }),
				);
			},
		}),
	);
}
