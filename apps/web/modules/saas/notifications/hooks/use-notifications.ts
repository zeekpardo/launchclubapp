"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useUnreadNotificationCount() {
	const { activeOrganization } = useActiveOrganization();
	return useQuery(
		orpc.notifications.unreadCount.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
			enabled: !!activeOrganization?.id,
			refetchInterval: 30_000,
		}),
	);
}

export function useNotifications() {
	const { activeOrganization } = useActiveOrganization();
	return useQuery(
		orpc.notifications.list.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
			enabled: !!activeOrganization?.id,
		}),
	);
}

export function useMarkNotificationAsRead() {
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.notifications.markAsRead.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.notifications.list
					.queryOptions({
						input: { organizationId: "" },
					})
					.queryKey.slice(0, 1),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.notifications.unreadCount
					.queryOptions({
						input: { organizationId: "" },
					})
					.queryKey.slice(0, 1),
			});
		},
	});
}

export function useMarkAllNotificationsAsRead() {
	const { activeOrganization } = useActiveOrganization();
	const queryClient = useQueryClient();
	return useMutation({
		...orpc.notifications.markAllAsRead.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orpc.notifications.list
					.queryOptions({
						input: { organizationId: "" },
					})
					.queryKey.slice(0, 1),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.notifications.unreadCount
					.queryOptions({
						input: { organizationId: "" },
					})
					.queryKey.slice(0, 1),
			});
		},
		onMutate: () => ({ organizationId: activeOrganization?.id ?? "" }),
	});
}
