"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Progress } from "@repo/ui/components/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { skipToken, useQueries, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { DateRange } from "./DashboardClient";

const ALL_GROUPS = "__ALL__";

interface AttendanceWidgetProps {
	areaId?: string;
	siteId?: string;
	dateRange: DateRange;
}

export function AttendanceWidget({
	areaId,
	siteId,
	dateRange,
}: AttendanceWidgetProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();

	const [selectedGroupId, setSelectedGroupId] = useState<string>(ALL_GROUPS);

	const { data: groups, isLoading: groupsLoading } = useQuery(
		orpc.groups.list.queryOptions({
			input: activeOrganization?.id
				? { organizationId: activeOrganization.id }
				: skipToken,
		}),
	);

	// Filter groups by area/site
	const filteredGroups = useMemo(() => {
		if (!groups) return [];
		if (siteId) return groups.filter((g) => g.siteId === siteId);
		if (areaId) return groups.filter((g) => g.site.areaId === areaId);
		return groups;
	}, [groups, areaId, siteId]);

	// If current selection is not in filtered list, fall back to ALL_GROUPS
	const effectiveGroupId = useMemo(() => {
		if (selectedGroupId === ALL_GROUPS) return ALL_GROUPS;
		return filteredGroups.some((g) => g.id === selectedGroupId)
			? selectedGroupId
			: ALL_GROUPS;
	}, [selectedGroupId, filteredGroups]);

	const activeGroupId =
		effectiveGroupId === ALL_GROUPS ? null : effectiveGroupId;

	const since = useMemo(() => {
		if (dateRange === "all") return undefined;
		return new Date(
			Date.now() - Number.parseInt(dateRange, 10) * 24 * 60 * 60 * 1000,
		).toISOString();
	}, [dateRange]);

	const sinceDate = useMemo(() => {
		if (dateRange === "all") return null;
		return new Date(
			Date.now() - Number.parseInt(dateRange, 10) * 24 * 60 * 60 * 1000,
		);
	}, [dateRange]);

	// Single-group queries
	const { data: events, isLoading: eventsLoading } = useQuery(
		orpc.events.list.queryOptions({
			input: activeGroupId ? { groupId: activeGroupId } : skipToken,
		}),
	);

	const { data: attendanceRecords, isLoading: attendanceLoading } = useQuery(
		orpc.attendance.byGroup.queryOptions({
			input: activeGroupId
				? { groupId: activeGroupId, ...(since ? { since } : {}) }
				: skipToken,
		}),
	);

	const { data: groupDetail, isLoading: groupDetailLoading } = useQuery(
		orpc.groups.get.queryOptions({
			input: activeGroupId ? { id: activeGroupId } : skipToken,
		}),
	);

	const { ratePercent, filteredEventCount, memberCount } = useMemo(() => {
		if (!activeGroupId)
			return { ratePercent: 0, filteredEventCount: 0, memberCount: 0 };
		const filteredEvents = (events ?? []).filter((e) =>
			sinceDate ? new Date(e.startsAt) >= sinceDate : true,
		);
		const groupMembers = groupDetail?.personGroups ?? [];

		const attendanceMap = new Map<string, string>();
		for (const record of attendanceRecords ?? []) {
			attendanceMap.set(
				`${record.eventId}:${record.personId}`,
				record.status,
			);
		}

		const totalPossible = filteredEvents.length * groupMembers.length;
		if (totalPossible === 0) {
			return {
				ratePercent: 0,
				filteredEventCount: filteredEvents.length,
				memberCount: groupMembers.length,
			};
		}

		const totalPresent = groupMembers.reduce((sum, { person }) => {
			const present = filteredEvents.filter(
				(e) => attendanceMap.get(`${e.id}:${person.id}`) === "PRESENT",
			).length;
			return sum + present;
		}, 0);

		return {
			ratePercent: Math.round((totalPresent / totalPossible) * 100),
			filteredEventCount: filteredEvents.length,
			memberCount: groupMembers.length,
		};
	}, [events, attendanceRecords, groupDetail, sinceDate, activeGroupId]);

	// All-groups aggregate: one attendance report per filtered group
	const reportQueries = useQueries({
		queries: filteredGroups.map((g) => ({
			...orpc.attendance.report.queryOptions({
				input: { groupId: g.id, ...(since ? { since } : {}) },
			}),
			enabled: effectiveGroupId === ALL_GROUPS,
		})),
	});

	const aggregateRate = useMemo(() => {
		if (effectiveGroupId !== ALL_GROUPS) return null;
		const rates = reportQueries
			.filter((q) => q.data !== undefined)
			.map((q) => (q.data as { rate: number }).rate);
		if (rates.length === 0) return 0;
		return Math.round(
			(rates.reduce((a, b) => a + b, 0) / rates.length) * 100,
		);
	}, [reportQueries, effectiveGroupId]);

	const dataLoading =
		effectiveGroupId === ALL_GROUPS
			? reportQueries.some((q) => q.isLoading && !q.data)
			: !!activeGroupId &&
				(eventsLoading || attendanceLoading || groupDetailLoading);

	const displayRate =
		effectiveGroupId === ALL_GROUPS ? (aggregateRate ?? 0) : ratePercent;

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base font-semibold">
					{t("launchclub.dashboard.attendanceRate")}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{groupsLoading ? (
					<>
						<Skeleton className="h-9 w-full" />
						<Skeleton className="h-12 w-24" />
						<Skeleton className="h-3 w-full" />
					</>
				) : !filteredGroups || filteredGroups.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{t("launchclub.dashboard.noData")}
					</p>
				) : (
					<>
						<Select
							value={effectiveGroupId}
							onValueChange={setSelectedGroupId}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_GROUPS}>
									{t("launchclub.dashboard.allGroups")}
								</SelectItem>
								{filteredGroups.map((g) => (
									<SelectItem key={g.id} value={g.id}>
										{g.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{dataLoading ? (
							<>
								<Skeleton className="h-12 w-24" />
								<Skeleton className="h-3 w-full" />
							</>
						) : (
							<div className="space-y-2">
								<div className="flex items-end justify-between">
									<span className="text-4xl font-bold">
										{displayRate}%
									</span>
									<span className="text-sm text-muted-foreground">
										{effectiveGroupId === ALL_GROUPS
											? `${filteredGroups.length} ${filteredGroups.length === 1 ? "group" : "groups"}`
											: `${filteredEventCount} events · ${memberCount} members`}
									</span>
								</div>
								<Progress value={displayRate} className="h-3" />
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
