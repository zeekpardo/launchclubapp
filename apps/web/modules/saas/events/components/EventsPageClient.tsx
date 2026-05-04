"use client";

import { Skeleton } from "@repo/ui/components/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Button } from "@repo/ui/components/button";
import { SearchInput } from "@shared/components/SearchInput";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useGroups } from "@saas/groups/hooks/use-groups";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, LayoutGridIcon, PlusCircleIcon, TableIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
import { EventCard } from "./EventCard";
import { EventDialog } from "./EventDialog";
import { EventsTable } from "./EventsTable";

const ALL = "__all__";
type ViewMode = "grid" | "table";

export function EventsPageClient() {
	const t = useTranslations();
	const { activeOrganization, activeOrganizationUserRole } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	// Both site leaders and group leaders have member.role="member" in Better Auth.
	// We distinguish them by whether sites.list returns data (site leaders have UserSite records).
	const isRestrictedMember = activeOrganizationUserRole === "member";

	const [selectedAreaId, setSelectedAreaId] = useState<string>(ALL);
	const [selectedSiteId, setSelectedSiteId] = useState<string>(ALL);
	const [search, setSearch] = useState("");
	const [viewMode, setViewMode] = useState<ViewMode>("table");
	const [createOpen, setCreateOpen] = useState(false);

	// ── Filters data ──────────────────────────────────────────────────────────

	const { data: allAreas } = useQuery(
		orpc.areas.list.queryOptions({
			input: { organizationId },
			enabled: !!organizationId && !isRestrictedMember,
		}),
	);

	const { data: allSites, isLoading: sitesLoading } = useQuery(
		orpc.sites.list.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);

	// Distinguish site leader vs group leader: site leaders have UserSite records returned by sites.list
	const isSiteLeader = isRestrictedMember && !sitesLoading && (allSites?.length ?? 0) > 0;
	const isGroupLeader = isRestrictedMember && !sitesLoading && (allSites?.length ?? 0) === 0;

	// Group leaders: derive available areas/sites from their scoped groups
	const { data: groups } = useGroups();

	const scopedAreas = useMemo(() => {
		if (!isGroupLeader || !groups) return undefined;
		const seen = new Set<string>();
		return groups
			.filter((g) => g.site?.area && !seen.has(g.site.area.id) && seen.add(g.site.area.id))
			.map((g) => g.site.area);
	}, [isGroupLeader, groups]);

	const scopedSites = useMemo(() => {
		if (!isGroupLeader || !groups) return undefined;
		const seen = new Set<string>();
		return groups
			.filter((g) => g.site && !seen.has(g.site.id) && seen.add(g.site.id))
			.map((g) => g.site);
	}, [isGroupLeader, groups]);

	// Site leaders: derive areas from their scoped sites (allSites is already server-scoped)
	const siteLeaderAreas = useMemo(() => {
		if (!isSiteLeader || !allSites) return undefined;
		const seen = new Set<string>();
		return (allSites as Array<{ area?: { id: string; name: string } }>)
			.filter((s) => s.area && !seen.has(s.area.id) && seen.add(s.area.id))
			.map((s) => s.area as { id: string; name: string });
	}, [isSiteLeader, allSites]);

	const areas = isGroupLeader ? scopedAreas : isSiteLeader ? siteLeaderAreas : allAreas;
	const sites = isGroupLeader ? scopedSites : allSites;

	const visibleSites = useMemo(
		() =>
			selectedAreaId === ALL
				? (sites ?? [])
				: (sites ?? []).filter((s) => s.areaId === selectedAreaId),
		[sites, selectedAreaId],
	);

	// ── Events ────────────────────────────────────────────────────────────────

	const { data: events, isLoading } = useQuery(
		orpc.events.listByOrg.queryOptions({
			input: {
				organizationId,
				areaId: selectedAreaId !== ALL ? selectedAreaId : undefined,
				siteId: selectedSiteId !== ALL ? selectedSiteId : undefined,
			},
			enabled: !!organizationId,
		}),
	);

	const filteredEvents = useMemo(() => {
		if (!search.trim()) return events ?? [];
		const q = search.toLowerCase();
		return (events ?? []).filter((e) => e.name.toLowerCase().includes(q));
	}, [events, search]);

	// ── Handlers ──────────────────────────────────────────────────────────────

	const handleAreaChange = (value: string) => {
		setSelectedAreaId(value);
		setSelectedSiteId(ALL);
	};

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="space-y-6">
			{/* Filter bar */}
			<div className="flex flex-wrap items-center gap-3">
				<Select value={selectedAreaId} onValueChange={handleAreaChange}>
					<SelectTrigger className="w-44">
						<SelectValue placeholder={t("launchclub.events.allAreas")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>{t("launchclub.events.allAreas")}</SelectItem>
						{(areas ?? []).map((area) => (
							<SelectItem key={area.id} value={area.id}>
								{area.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
					<SelectTrigger className="w-44">
						<SelectValue placeholder={t("launchclub.events.allSites")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>{t("launchclub.events.allSites")}</SelectItem>
						{visibleSites.map((site) => (
							<SelectItem key={site.id} value={site.id}>
								{site.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder={t("launchclub.events.searchPlaceholder")}
					className="w-64"
				/>

				<Button variant="primary" className="gap-2" onClick={() => setCreateOpen(true)}>
					<PlusCircleIcon className="size-4" />
					{t("launchclub.events.new")}
				</Button>

				{/* View toggle */}
				<div className="ml-auto flex items-center gap-1 rounded-lg border p-1">
					<Button
						variant={viewMode === "grid" ? "secondary" : "ghost"}
						size="icon"
						className="size-7"
						onClick={() => setViewMode("grid")}
						aria-label={t("launchclub.events.gridView")}
					>
						<LayoutGridIcon className="size-3.5" />
					</Button>
					<Button
						variant={viewMode === "table" ? "secondary" : "ghost"}
						size="icon"
						className="size-7"
						onClick={() => setViewMode("table")}
						aria-label={t("launchclub.events.tableView")}
					>
						<TableIcon className="size-3.5" />
					</Button>
				</div>
			</div>

			{/* Content */}
			{isLoading ? (
				viewMode === "grid" ? (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<Skeleton key={i} className="h-40 w-full rounded-xl" />
						))}
					</div>
				) : (
					<div className="space-y-2">
						{Array.from({ length: 6 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
							<Skeleton key={i} className="h-12 w-full rounded-lg" />
						))}
					</div>
				)
			) : filteredEvents.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
					<CalendarIcon className="mb-3 size-10 opacity-40" />
					<p className="text-sm">{t("launchclub.events.noResults")}</p>
				</div>
			) : viewMode === "grid" ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filteredEvents.map((event) => (
						<EventCard
							key={event.id}
							event={event}
							organizationId={organizationId}
						/>
					))}
				</div>
			) : (
				<EventsTable events={filteredEvents} organizationId={organizationId} />
			)}
			<EventDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				organizationId={organizationId}
			/>
		</div>
	);
}
