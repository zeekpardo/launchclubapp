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
import { skipToken, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type DateRange = "7" | "30" | "90" | "180" | "all";

export function AttendanceWidget() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();

	const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
		undefined,
	);
	const [dateRange, setDateRange] = useState<DateRange>("30");

	const { data: groups, isLoading: groupsLoading } = useQuery(
		orpc.groups.list.queryOptions({
			input: activeOrganization?.id
				? { organizationId: activeOrganization.id }
				: skipToken,
		}),
	);

	const activeGroupId = selectedGroupId ?? groups?.[0]?.id;

	// Compute since values the same way GroupAttendanceTab does
	const since = useMemo(() => {
		if (dateRange === "all") return undefined;
		return new Date(
			Date.now() - Number.parseInt(dateRange) * 24 * 60 * 60 * 1000,
		).toISOString();
	}, [dateRange]);

	const sinceDate = useMemo(() => {
		if (dateRange === "all") return null;
		return new Date(
			Date.now() - Number.parseInt(dateRange) * 24 * 60 * 60 * 1000,
		);
	}, [dateRange]);

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

	// Compute rate client-side — same logic as GroupAttendanceTab
	const { ratePercent, filteredEventCount, memberCount } = useMemo(() => {
		const filteredEvents = (events ?? []).filter((e) =>
			sinceDate ? new Date(e.startsAt) >= sinceDate : true,
		);
		const members = groupDetail?.personGroups ?? [];

		const attendanceMap = new Map<string, string>();
		for (const record of attendanceRecords ?? []) {
			attendanceMap.set(`${record.eventId}:${record.personId}`, record.status);
		}

		const totalPossible = filteredEvents.length * members.length;
		if (totalPossible === 0) {
			return {
				ratePercent: 0,
				filteredEventCount: filteredEvents.length,
				memberCount: members.length,
			};
		}

		const totalPresent = members.reduce((sum, { person }) => {
			const present = filteredEvents.filter(
				(e) => attendanceMap.get(`${e.id}:${person.id}`) === "PRESENT",
			).length;
			return sum + present;
		}, 0);

		return {
			ratePercent: Math.round((totalPresent / totalPossible) * 100),
			filteredEventCount: filteredEvents.length,
			memberCount: members.length,
		};
	}, [events, attendanceRecords, groupDetail, sinceDate]);

	const dataLoading =
		!!activeGroupId &&
		(eventsLoading || attendanceLoading || groupDetailLoading);

	const dateRangeOptions: { value: DateRange; label: string }[] = [
		{ value: "7", label: "Last 7 days" },
		{ value: "30", label: "Last 30 days" },
		{ value: "90", label: "Last 3 months" },
		{ value: "180", label: "Last 6 months" },
		{ value: "all", label: "All time" },
	];

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
						<div className="flex gap-2">
							<Skeleton className="h-9 flex-1" />
							<Skeleton className="h-9 w-36" />
						</div>
						<Skeleton className="h-12 w-24" />
						<Skeleton className="h-3 w-full" />
					</>
				) : !groups || groups.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{t("launchclub.dashboard.noData")}
					</p>
				) : (
					<>
						<div className="flex gap-2">
							{groups.length > 1 ? (
								<Select
									value={activeGroupId}
									onValueChange={setSelectedGroupId}
								>
									<SelectTrigger className="flex-1">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{groups.map((g) => (
											<SelectItem key={g.id} value={g.id}>
												{g.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<p className="flex-1 text-sm font-medium leading-9">
									{groups[0].name}
								</p>
							)}
							<Select
								value={dateRange}
								onValueChange={(v) => setDateRange(v as DateRange)}
							>
								<SelectTrigger className="w-36">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{dateRangeOptions.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{dataLoading ? (
							<>
								<Skeleton className="h-12 w-24" />
								<Skeleton className="h-3 w-full" />
							</>
						) : (
							<div className="space-y-2">
								<div className="flex items-end justify-between">
									<span className="text-4xl font-bold">{ratePercent}%</span>
									<span className="text-sm text-muted-foreground">
										{filteredEventCount} events · {memberCount} members
									</span>
								</div>
								<Progress value={ratePercent} className="h-3" />
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
