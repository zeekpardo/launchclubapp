"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useConsentItems(organizationId: string) {
	return useQuery(
		orpc.consentItems.list.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);
}

function useInvalidateConsentItems(organizationId: string) {
	const queryClient = useQueryClient();
	return () =>
		queryClient.invalidateQueries({
			queryKey: orpc.consentItems.list.queryOptions({
				input: { organizationId },
			}).queryKey,
		});
}

export function useCreateConsentItem(organizationId: string) {
	const invalidate = useInvalidateConsentItems(organizationId);
	return useMutation({
		...orpc.consentItems.create.mutationOptions(),
		onSuccess: invalidate,
	});
}

export function useUpdateConsentItem(organizationId: string) {
	const invalidate = useInvalidateConsentItems(organizationId);
	return useMutation({
		...orpc.consentItems.update.mutationOptions(),
		onSuccess: invalidate,
	});
}

export function useDeleteConsentItem(organizationId: string) {
	const invalidate = useInvalidateConsentItems(organizationId);
	return useMutation({
		...orpc.consentItems.delete.mutationOptions(),
		onSuccess: invalidate,
	});
}

export function useReorderConsentItems(organizationId: string) {
	const invalidate = useInvalidateConsentItems(organizationId);
	return useMutation({
		...orpc.consentItems.reorder.mutationOptions(),
		onSuccess: invalidate,
	});
}

export function usePdfUploadUrl() {
	return useMutation(orpc.consentItems.pdfUploadUrl.mutationOptions());
}

export function usePdfDownloadUrl() {
	return useMutation(orpc.consentItems.pdfDownloadUrl.mutationOptions());
}
