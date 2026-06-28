"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useMentorApplications(
	status?: "PENDING" | "APPROVED" | "REJECTED",
) {
	const { activeOrganization } = useActiveOrganization();
	return useQuery(
		orpc.mentorApplications.list.queryOptions({
			input: {
				organizationId: activeOrganization?.id ?? "",
				status,
			},
			enabled: !!activeOrganization?.id,
		}),
	);
}

export function useMentorApplication(id: string) {
	return useQuery(
		orpc.mentorApplications.get.queryOptions({
			input: { id },
		}),
	);
}

export function useReviewMentorApplication() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.mentorApplications.review.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.mentorApplications.list
					.queryOptions({
						input: { organizationId: "" },
					})
					.queryKey.slice(0, 1),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.mentorApplications.get
					.queryOptions({
						input: { id: "" },
					})
					.queryKey.slice(0, 1),
			});
		},
	});
}
