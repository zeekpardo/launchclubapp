"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ApplicationsWidget } from "./ApplicationsWidget";
import { AttendanceWidget } from "./AttendanceWidget";
import { DashboardStats } from "./DashboardStats";

export type DateRange = "7" | "30" | "90" | "180" | "all";

const ALL = "__ALL__";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
	{ value: "7", label: "Last 7 days" },
	{ value: "30", label: "Last 30 days" },
	{ value: "90", label: "Last 3 months" },
	{ value: "180", label: "Last 6 months" },
	{ value: "all", label: "All time" },
];

export function DashboardClient() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const enabled = !!activeOrganization?.id;

	const [selectedAreaId, setSelectedAreaId] = useState<string>(ALL);
	const [selectedSiteId, setSelectedSiteId] = useState<string>(ALL);
	const [dateRange, setDateRange] = useState<DateRange>("30");

	const { data: areas } = useQuery(
		orpc.areas.list.queryOptions({ input: { organizationId }, enabled }),
	);

	const { data: sites } = useQuery(
		orpc.sites.list.queryOptions({ input: { organizationId }, enabled }),
	);

	const filteredSites =
		selectedAreaId === ALL
			? (sites ?? [])
			: (sites ?? []).filter((s) => s.areaId === selectedAreaId);

	const areaId = selectedAreaId === ALL ? undefined : selectedAreaId;
	const siteId = selectedSiteId === ALL ? undefined : selectedSiteId;
	const hasAreaFilters = (areas?.length ?? 0) > 0;

	const handleAreaChange = (value: string) => {
		setSelectedAreaId(value);
		setSelectedSiteId(ALL);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap gap-3">
				{hasAreaFilters && (
					<>
						<Select
							value={selectedAreaId}
							onValueChange={handleAreaChange}
						>
							<SelectTrigger className="w-44">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>
									{t("launchclub.dashboard.allAreas")}
								</SelectItem>
								{areas?.map((area) => (
									<SelectItem key={area.id} value={area.id}>
										{area.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={selectedSiteId}
							onValueChange={setSelectedSiteId}
						>
							<SelectTrigger className="w-44">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>
									{t("launchclub.dashboard.allSites")}
								</SelectItem>
								{filteredSites.map((site) => (
									<SelectItem key={site.id} value={site.id}>
										{site.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</>
				)}
				<Select
					value={dateRange}
					onValueChange={(v) => setDateRange(v as DateRange)}
				>
					<SelectTrigger className="w-44">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{DATE_RANGE_OPTIONS.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<DashboardStats areaId={areaId} siteId={siteId} />
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<AttendanceWidget
					areaId={areaId}
					siteId={siteId}
					dateRange={dateRange}
				/>
				<ApplicationsWidget />
			</div>
		</div>
	);
}
