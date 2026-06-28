"use client";

import { useState } from "react";
import { GroupDemographicsCard } from "./GroupDemographicsCard";
import { GroupOverviewCharts } from "./GroupOverviewCharts";
import { GroupStatCards } from "./GroupStatCards";

type TimePeriod = "month" | "week" | "day";

interface GroupOverviewProps {
	group: {
		personGroups: Array<{
			joinedAt: Date | string;
			person: { gender?: string | null };
		}>;
	};
	events:
		| Array<{
				id: string;
				name: string;
				startsAt: string | Date;
				_count: { attendance: number };
		  }>
		| undefined;
}

function formatMonthLabel(date: Date): string {
	return date.toLocaleDateString("en-US", {
		month: "short",
		year: "numeric",
	});
}

function getMembershipTimeline(
	personGroups: GroupOverviewProps["group"]["personGroups"],
) {
	if (personGroups.length === 0) return [];
	const sorted = [...personGroups].sort(
		(a, b) =>
			new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
	);
	const monthMap = new Map<string, number>();
	for (const pg of sorted) {
		const key = formatMonthLabel(new Date(pg.joinedAt));
		monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
	}
	let cumulative = 0;
	return Array.from(monthMap.entries()).map(([month, newCount]) => {
		cumulative += newCount;
		return { month, count: cumulative };
	});
}

export function GroupOverview({ group, events }: GroupOverviewProps) {
	const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");

	const memberCount = group.personGroups.length;

	const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
	const avgMeetingsPerMonth =
		events?.filter((e) => new Date(e.startsAt) >= thirtyDaysAgo).length ??
		0;

	const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
	const newMemberCount = group.personGroups.filter(
		(pg) => new Date(pg.joinedAt) >= ninetyDaysAgo,
	).length;
	const turnoverPct =
		memberCount > 0 ? Math.round((newMemberCount / memberCount) * 100) : 0;

	const genderCounts = group.personGroups.reduce(
		(acc, { person }) => {
			const g = person.gender
				? person.gender.charAt(0).toUpperCase() +
					person.gender.slice(1).toLowerCase()
				: "Unknown";
			acc[g] = (acc[g] ?? 0) + 1;
			return acc;
		},
		{} as Record<string, number>,
	);
	const demographicsData = Object.entries(genderCounts).map(
		([name, value]) => ({ name, value }),
	);

	const membershipData = getMembershipTimeline(group.personGroups);

	const attendanceData =
		events
			?.filter((e) => e._count.attendance > 0)
			.map((e) => ({
				name: e.name.length > 10 ? `${e.name.slice(0, 10)}…` : e.name,
				count: e._count.attendance,
			})) ?? [];

	return (
		<div className="space-y-6">
			<GroupStatCards
				memberCount={memberCount}
				avgMeetingsPerMonth={avgMeetingsPerMonth}
				turnoverPct={turnoverPct}
			/>

			<GroupDemographicsCard data={demographicsData} />

			<GroupOverviewCharts
				timePeriod={timePeriod}
				onTimePeriodChange={setTimePeriod}
				attendanceData={attendanceData}
				membershipData={membershipData}
			/>
		</div>
	);
}
