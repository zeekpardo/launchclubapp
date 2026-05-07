"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useForms() {
	const { activeOrganization } = useActiveOrganization();
	return useQuery(
		orpc.forms.list.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
			enabled: !!activeOrganization?.id,
		}),
	);
}

export function useFormData(formId: string) {
	return useQuery(
		orpc.forms.get.queryOptions({
			input: { formId },
			enabled: !!formId,
		}),
	);
}

export function useCreateForm() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.forms.create.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.forms.list.queryOptions({
					input: { organizationId: "" },
				}).queryKey.slice(0, 1),
			});
		},
	});
}

export function useUpdateForm(formId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.forms.update.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				orpc.forms.get.queryOptions({ input: { formId } }),
			);
			queryClient.invalidateQueries({
				queryKey: orpc.forms.list.queryOptions({
					input: { organizationId: "" },
				}).queryKey.slice(0, 1),
			});
		},
	});
}

export function useAssignSites(formId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.forms.assignSites.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				orpc.forms.get.queryOptions({ input: { formId } }),
			);
		},
	});
}

export function useSoftDeleteForm() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.forms.softDelete.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.forms.list.queryOptions({
					input: { organizationId: "" },
				}).queryKey.slice(0, 1),
			});
		},
	});
}
