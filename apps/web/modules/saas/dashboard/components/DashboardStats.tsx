"use client";

import { Skeleton } from "@repo/ui/components/skeleton";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	CalendarIcon,
	ClipboardListIcon,
	SmileIcon,
	StarIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { StatCard } from "./StatCard";

interface DashboardStatsProps {
	areaId?: string;
	siteId?: string;
}

export function DashboardStats({ areaId, siteId }: DashboardStatsProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const enabled = !!activeOrganization?.id;

	const { data: groups, isLoading: groupsLoading } = useQuery(
		orpc.groups.list.queryOptions({ input: { organizationId }, enabled }),
	);

	const { data: sites, isLoading: sitesLoading } = useQuery(
		orpc.sites.list.queryOptions({ input: { organizationId }, enabled }),
	);

	const peopleFilter = siteId ? { siteId } : areaId ? { areaId } : {};

	const { data: members, isLoading: membersLoading } = useQuery(
		orpc.people.list.queryOptions({
			input: { organizationId, isChild: false, ...peopleFilter },
			enabled,
		}),
	);

	const { data: kids, isLoading: kidsLoading } = useQuery(
		orpc.people.list.queryOptions({
			input: { organizationId, isChild: true, ...peopleFilter },
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
			input: { organizationId, ...peopleFilter },
			enabled,
		}),
	);

	const filteredGroups = useMemo(() => {
		if (!groups) return [];
		if (siteId) return groups.filter((g) => g.siteId === siteId);
		if (areaId) return groups.filter((g) => g.site.areaId === areaId);
		return groups;
	}, [groups, areaId, siteId]);

	const leaderCount = useMemo(() => {
		if (!members) return 0;
		if (siteId) {
			return members.filter((m) =>
				m.personGroups.some(
					(pg) => pg.role === "LEADER" && pg.group.siteId === siteId,
				),
			).length;
		}
		if (areaId) {
			const areaSiteIds = new Set(
				(sites ?? [])
					.filter((s) => s.areaId === areaId)
					.map((s) => s.id),
			);
			return members.filter((m) =>
				m.personGroups.some(
					(pg) =>
						pg.role === "LEADER" &&
						areaSiteIds.has(pg.group.siteId),
				),
			).length;
		}
		return members.filter((m) =>
			m.personGroups.some((pg) => pg.role === "LEADER"),
		).length;
	}, [members, areaId, siteId, sites]);

	const isLoading =
		groupsLoading ||
		sitesLoading ||
		membersLoading ||
		kidsLoading ||
		appsLoading ||
		eventsLoading;

	const stats = [
		{
			title: t("launchclub.dashboard.stats.groups"),
			value: filteredGroups.length,
			icon: <UsersIcon className="size-5" />,
		},
		{
			title: t("launchclub.dashboard.stats.leaders"),
			value: leaderCount,
			icon: <StarIcon className="size-5" />,
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
			<div className="grid grid-cols-2 gap-4 @lg:grid-cols-3 @2xl:grid-cols-6">
				{isLoading
					? Array.from({ length: 6 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: <Skeleton>
							<Skeleton
								key={i}
								className="h-[116px] w-full rounded-xl"
							/>
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
