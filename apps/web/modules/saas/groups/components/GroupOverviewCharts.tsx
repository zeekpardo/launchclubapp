"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ChartColumnIcon, TrendingUpIcon, UserCheckIcon } from "lucide-react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

type TimePeriod = "month" | "week" | "day";

interface ChartEntry {
	name?: string;
	month?: string;
	count: number;
}

interface GroupOverviewChartsProps {
	timePeriod: TimePeriod;
	onTimePeriodChange: (p: TimePeriod) => void;
	attendanceData: ChartEntry[];
	membershipData: ChartEntry[];
}

const TIME_PERIODS: { key: TimePeriod; label: string }[] = [
	{ key: "month", label: "Month" },
	{ key: "week", label: "Week" },
	{ key: "day", label: "Day" },
];

export function GroupOverviewCharts({
	timePeriod,
	onTimePeriodChange,
	attendanceData,
	membershipData,
}: GroupOverviewChartsProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-4 text-sm text-muted-foreground">
				<p className="font-semibold text-muted-foreground text-xs uppercase">Stats over time</p>
				{TIME_PERIODS.map(({ key, label }) => (
					<button
						key={key}
						type="button"
						onClick={() => onTimePeriodChange(key)}
						className={timePeriod === key ? "font-semibold text-foreground" : "hover:text-foreground"}
					>
						{label}
					</button>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<UserCheckIcon className="h-4 w-4" />
							Event Attendance
						</CardTitle>
					</CardHeader>
					<CardContent>
						{attendanceData.length > 0 ? (
							<ResponsiveContainer width="100%" height={200}>
								<LineChart data={attendanceData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" tick={{ fontSize: 12 }} />
									<YAxis tick={{ fontSize: 12 }} />
									<Tooltip />
									<Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
								</LineChart>
							</ResponsiveContainer>
						) : (
							<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
								<ChartColumnIcon className="mx-auto mb-2 h-8 w-8 opacity-50" />
								<p className="text-sm">No attendance data available</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<TrendingUpIcon className="h-4 w-4" />
							Group Membership
						</CardTitle>
					</CardHeader>
					<CardContent>
						{membershipData.length > 0 ? (
							<ResponsiveContainer width="100%" height={200}>
								<LineChart data={membershipData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="month" tick={{ fontSize: 12 }} />
									<YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
									<Tooltip />
									<Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
								</LineChart>
							</ResponsiveContainer>
						) : (
							<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
								<TrendingUpIcon className="mx-auto mb-2 h-8 w-8 opacity-50" />
								<p className="text-sm">No membership data</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
