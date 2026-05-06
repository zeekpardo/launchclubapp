"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import type { ChartConfig } from "@repo/ui/components/chart";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@repo/ui/components/chart";
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
import { useQuery } from "@tanstack/react-query";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";
import { useEffect, useState } from "react";

const TERM_LABELS: Record<string, string> = {
	Q1: "Q1",
	Q2: "Q2",
	Q3: "Q3",
	Q4: "Q4",
	SEMESTER_1: "Sem 1",
	SEMESTER_2: "Sem 2",
	TRIMESTER_1: "Tri 1",
	TRIMESTER_2: "Tri 2",
	TRIMESTER_3: "Tri 3",
	ANNUAL: "Annual",
};

const chartConfig = {
	avgGpa: { label: "Avg GPA", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

type ScopeType = "org" | "site" | "group";

interface GpaWidgetProps {
	areaId?: string;
	siteId?: string;
}

export function GpaWidget({ areaId, siteId }: GpaWidgetProps) {
	const { activeOrganization } = useActiveOrganization();
	const orgId = activeOrganization?.id ?? "";

	const [scopeType, setScopeType] = useState<ScopeType>("org");
	const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(
		undefined,
	);
	const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(
		undefined,
	);
	const [selectedYear, setSelectedYear] = useState<string | undefined>(
		undefined,
	);

	// Academic years
	const { data: academicYears = [] } = useQuery(
		orpc.academicYears.list.queryOptions({
			input: { organizationId: orgId },
			enabled: !!orgId,
		}),
	);

	// Set default year to active year (or first) when years load
	useEffect(() => {
		if (!selectedYear && academicYears.length > 0) {
			const active =
				academicYears.find((y) => y.isActive) ?? academicYears[0];
			setSelectedYear(active.label);
		}
	}, [academicYears, selectedYear]);

	// Sites — for site selector
	const { data: sitesData } = useQuery({
		...orpc.sites.list.queryOptions({ input: { organizationId: orgId } }),
		enabled: !!orgId && scopeType !== "org",
	});
	const sites = sitesData ?? [];

	// Groups — for group selector
	const { data: groupsData } = useQuery({
		...orpc.groups.list.queryOptions({ input: { organizationId: orgId, siteId: selectedSiteId ?? "" } }),
		enabled: !!orgId && scopeType === "group" && !!selectedSiteId,
	});
	const groups = groupsData ?? [];

	// GPA trend data
	const { data: trendData = [], isLoading: trendLoading } = useQuery({
		...orpc.academicRecords.gpaTrend.queryOptions({
			input: {
				organizationId: orgId,
				siteId: scopeType !== "org" ? selectedSiteId : undefined,
				groupId: scopeType === "group" ? selectedGroupId : undefined,
				schoolYear: selectedYear ?? "",
			},
		}),
		enabled: !!orgId && !!selectedYear,
	});

	function handleScopeChange(val: ScopeType) {
		setScopeType(val);
		setSelectedSiteId(undefined);
		setSelectedGroupId(undefined);
	}

	function handleSiteChange(val: string) {
		setSelectedSiteId(val);
		setSelectedGroupId(undefined);
	}

	const avgGpa =
		trendData.length > 0
			? (
					trendData.reduce((sum, d) => sum + d.avgGpa, 0) / trendData.length
				).toFixed(2)
			: null;

	const totalStudents =
		trendData.length > 0
			? Math.max(...trendData.map((d) => d.studentCount))
			: 0;

	const hasEnoughData = trendData.length >= 2;

	return (
		<Card>
			<CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
				<CardTitle className="text-base font-semibold">GPA Trend</CardTitle>
				<div className="flex flex-wrap gap-2">
					<Select
						value={scopeType}
						onValueChange={(v) => handleScopeChange(v as ScopeType)}
					>
						<SelectTrigger className="w-36">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="org">Overall</SelectItem>
							<SelectItem value="site">By Site</SelectItem>
							<SelectItem value="group">By Group</SelectItem>
						</SelectContent>
					</Select>

					{scopeType !== "org" && (
						<Select
							value={selectedSiteId ?? ""}
							onValueChange={handleSiteChange}
						>
							<SelectTrigger className="w-36">
								<SelectValue placeholder="Select site" />
							</SelectTrigger>
							<SelectContent>
								{sites.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}

					{scopeType === "group" && (
						<Select
							value={selectedGroupId ?? ""}
							onValueChange={setSelectedGroupId}
							disabled={!selectedSiteId}
						>
							<SelectTrigger className="w-36">
								<SelectValue placeholder="Select group" />
							</SelectTrigger>
							<SelectContent>
								{groups.map((g) => (
									<SelectItem key={g.id} value={g.id}>
										{g.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}

					<Select
						value={selectedYear ?? ""}
						onValueChange={setSelectedYear}
						disabled={academicYears.length === 0}
					>
						<SelectTrigger className="w-36">
							<SelectValue placeholder="Select year" />
						</SelectTrigger>
						<SelectContent>
							{academicYears.map((y) => (
								<SelectItem key={y.id} value={y.label}>
									{y.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>

			<CardContent>
				{trendLoading ? (
					<>
						<Skeleton className="mb-4 h-4 w-40" />
						<Skeleton className="h-48 w-full" />
					</>
				) : academicYears.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Configure academic years in Settings to enable GPA tracking.
					</p>
				) : !trendLoading && trendData.length === 0 && selectedYear ? (
					<p className="text-sm text-muted-foreground">
						No GPA records for this period. Add academic records on a
						child&apos;s profile to see trends here.
					</p>
				) : !trendLoading && trendData.length === 1 ? (
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">
							Avg GPA: {avgGpa} across {totalStudents} students
						</p>
						<p className="text-xs text-muted-foreground">
							Add more terms to see a trend.
						</p>
					</div>
				) : hasEnoughData ? (
					<>
						<p className="mb-4 text-sm text-muted-foreground">
							Avg GPA: {avgGpa} across {totalStudents} students
						</p>
						<ChartContainer config={chartConfig} className="h-48 w-full">
							<LineChart
								data={trendData.map((d) => ({
									...d,
									label: TERM_LABELS[d.term] ?? d.term,
								}))}
							>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis dataKey="label" tick={{ fontSize: 12 }} />
								<YAxis
									domain={[0, 4]}
									ticks={[0, 1, 2, 3, 4]}
									tick={{ fontSize: 12 }}
								/>
								<ChartTooltip
									content={
										<ChartTooltipContent
											formatter={(value, _name, props) => [
												`${Number(value).toFixed(2)} (${props.payload?.studentCount ?? 0} students)`,
												"Avg GPA",
											]}
										/>
									}
								/>
								<Line
									type="monotone"
									dataKey="avgGpa"
									stroke="var(--color-avgGpa)"
									strokeWidth={2}
									dot={{ r: 4 }}
									activeDot={{ r: 6 }}
								/>
							</LineChart>
						</ChartContainer>
					</>
				) : null}
			</CardContent>
		</Card>
	);
}
