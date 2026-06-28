"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useApplications(status?: "PENDING" | "APPROVED" | "REJECTED") {
	const { activeOrganization } = useActiveOrganization();
	return useQuery(
		orpc.applications.list.queryOptions({
			input: {
				organizationId: activeOrganization?.id ?? "",
				status,
			},
			enabled: !!activeOrganization?.id,
		}),
	);
}

export function usePendingApplicationCount() {
	const { activeOrganization } = useActiveOrganization();
	return useQuery(
		orpc.applications.list.queryOptions({
			input: {
				organizationId: activeOrganization?.id ?? "",
				status: "PENDING",
			},
			enabled: !!activeOrganization?.id,
			select: (data) => data.length,
		}),
	);
}

export function useApplication(id: string) {
	return useQuery(
		orpc.applications.get.queryOptions({
			input: { id },
		}),
	);
}

export function useReviewApplication() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.applications.review.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.applications.list
					.queryOptions({
						input: { organizationId: "" },
					})
					.queryKey.slice(0, 1),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.applications.get
					.queryOptions({
						input: { id: "" },
					})
					.queryKey.slice(0, 1),
			});
		},
	});
}
