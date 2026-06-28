"use client";

import { Card, CardContent } from "@repo/ui/components/card";
import { CalendarIcon, TrendingUpIcon, UsersIcon } from "lucide-react";

interface GroupStatCardsProps {
	memberCount: number;
	avgMeetingsPerMonth: number;
	turnoverPct: number;
}

export function GroupStatCards({
	memberCount,
	avgMeetingsPerMonth,
	turnoverPct,
}: GroupStatCardsProps) {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			<Card>
				<div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
					<h3 className="font-medium text-muted-foreground text-sm tracking-tight">
						Members
					</h3>
					<UsersIcon className="h-4 w-4 text-muted-foreground" />
				</div>
				<CardContent className="pt-0">
					<div className="font-bold text-2xl">{memberCount}</div>
					<p className="mt-1 text-muted-foreground text-xs">
						Active group members
					</p>
				</CardContent>
			</Card>

			<Card>
				<div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
					<h3 className="font-medium text-muted-foreground text-sm tracking-tight">
						Average meetings per month
					</h3>
					<CalendarIcon className="h-4 w-4 text-muted-foreground" />
				</div>
				<CardContent className="pt-0">
					<div className="font-bold text-2xl">
						{avgMeetingsPerMonth}
					</div>
					<p className="mt-1 text-muted-foreground text-xs">
						Last 30 days
					</p>
				</CardContent>
			</Card>

			<Card>
				<div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
					<h3 className="font-medium text-muted-foreground text-sm tracking-tight">
						90 day turnover
					</h3>
					<TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
				</div>
				<CardContent className="pt-0">
					<div className="font-bold text-2xl">{turnoverPct}%</div>
					<p className="mt-1 text-muted-foreground text-xs">
						New members vs total
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
