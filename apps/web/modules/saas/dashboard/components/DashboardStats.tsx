"use client";

import { Skeleton } from "@repo/ui/components/skeleton";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	CalendarIcon,
	ClipboardListIcon,
	SmileIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { StatCard } from "./StatCard";

export function DashboardStats() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const enabled = !!activeOrganization?.id;

	const { data: groups, isLoading: groupsLoading } = useQuery(
		orpc.groups.list.queryOptions({
			input: { organizationId },
			enabled,
		}),
	);

	const { data: members, isLoading: membersLoading } = useQuery(
		orpc.people.list.queryOptions({
			input: { organizationId, isChild: false },
			enabled,
		}),
	);

	const { data: kids, isLoading: kidsLoading } = useQuery(
		orpc.people.list.queryOptions({
			input: { organizationId, isChild: true },
			enabled,
		}),
	);

	const { data: pendingApps, isLoading: appsLoading } = useQuery(
		orpc.applications.list.queryOptions({
			input: { organizationId, status: "PENDING" },
			enabled,
		}),
	);

	const { data: events, isLoading: eventsLoading } = useQuery(
		orpc.events.listByOrg.queryOptions({
			input: { organizationId },
			enabled,
		}),
	);

	const isLoading =
		groupsLoading ||
		membersLoading ||
		kidsLoading ||
		appsLoading ||
		eventsLoading;

	const stats = [
		{
			title: t("launchclub.dashboard.stats.groups"),
			value: groups?.length ?? 0,
			icon: <UsersIcon className="size-5" />,
		},
		{
			title: t("launchclub.dashboard.stats.members"),
			value: members?.length ?? 0,
			icon: <UserIcon className="size-5" />,
		},
		{
			title: t("launchclub.dashboard.stats.kids"),
			value: kids?.length ?? 0,
			icon: <SmileIcon className="size-5" />,
		},
		{
			title: t("launchclub.dashboard.stats.events"),
			value: events?.length ?? 0,
			icon: <CalendarIcon className="size-5" />,
		},
		{
			title: t("launchclub.dashboard.stats.pendingApplications"),
			value: pendingApps?.length ?? 0,
			icon: <ClipboardListIcon className="size-5" />,
		},
	];

	return (
		<div className="@container">
			<div className="grid grid-cols-2 gap-4 @lg:grid-cols-5">
				{isLoading
					? Array.from({ length: 5 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
							<Skeleton key={i} className="h-[116px] w-full rounded-xl" />
						))
					: stats.map((stat) => (
							<StatCard
								key={stat.title}
								title={stat.title}
								value={stat.value}
								icon={stat.icon}
							/>
						))}
			</div>
		</div>
	);
}
