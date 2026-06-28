"use client";

import { cn } from "@repo/ui/lib";
import { useMemo, useState } from "react";

export interface GroupPickerGroup {
	id: string;
	name: string;
	siteId: string;
	site?: {
		id: string;
		name: string;
		area?: { id: string; name: string } | null;
	} | null;
}

interface GroupPickerProps {
	groups: GroupPickerGroup[];
	selectedGroupIds: string[];
	onToggle: (groupId: string) => void;
	error?: string;
}

export function GroupPicker({
	groups,
	selectedGroupIds,
	onToggle,
	error,
}: GroupPickerProps) {
	const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
	const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);

	const areas = useMemo(() => {
		const map = new Map<string, string>();
		for (const g of groups) {
			if (g.site?.area) map.set(g.site.area.id, g.site.area.name);
		}
		return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
	}, [groups]);

	const visibleSites = useMemo(() => {
		const map = new Map<
			string,
			{ id: string; name: string; areaId: string }
		>();
		for (const g of groups) {
			if (!g.site) continue;
			if (
				selectedAreaIds.length > 0 &&
				(!g.site.area || !selectedAreaIds.includes(g.site.area.id))
			)
				continue;
			if (!map.has(g.site.id)) {
				map.set(g.site.id, {
					id: g.site.id,
					name: g.site.name,
					areaId: g.site.area?.id ?? "",
				});
			}
		}
		return Array.from(map.values());
	}, [groups, selectedAreaIds]);

	const visibleGroups = useMemo(() => {
		return groups.filter((g) => {
			if (
				selectedAreaIds.length > 0 &&
				(!g.site?.area || !selectedAreaIds.includes(g.site.area.id))
			)
				return false;
			if (
				selectedSiteIds.length > 0 &&
				!selectedSiteIds.includes(g.siteId)
			)
				return false;
			return true;
		});
	}, [groups, selectedAreaIds, selectedSiteIds]);

	const groupsBySite = useMemo(() => {
		const map = new Map<
			string,
			{ siteName: string; groups: typeof visibleGroups }
		>();
		for (const g of visibleGroups) {
			const key = g.siteId;
			if (!map.has(key)) {
				map.set(key, {
					siteName: g.site?.name ?? "Unknown Site",
					groups: [],
				});
			}
			map.get(key)!.groups.push(g);
		}
		return Array.from(map.values());
	}, [visibleGroups]);

	const toggleArea = (areaId: string) => {
		const removing = selectedAreaIds.includes(areaId);
		const newAreaIds = removing
			? selectedAreaIds.filter((x) => x !== areaId)
			: [...selectedAreaIds, areaId];
		setSelectedAreaIds(newAreaIds);

		if (removing) {
			const sitesInArea = groups
				.filter((g) => g.site?.area?.id === areaId)
				.map((g) => g.siteId);
			setSelectedSiteIds((prev) =>
				prev.filter((s) => !sitesInArea.includes(s)),
			);
			for (const g of groups.filter((g) => g.site?.area?.id === areaId)) {
				if (selectedGroupIds.includes(g.id)) onToggle(g.id);
			}
		}
	};

	const toggleSite = (siteId: string) => {
		const removing = selectedSiteIds.includes(siteId);
		setSelectedSiteIds((prev) =>
			removing ? prev.filter((x) => x !== siteId) : [...prev, siteId],
		);
		if (removing) {
			for (const g of groups.filter((g) => g.siteId === siteId)) {
				if (selectedGroupIds.includes(g.id)) onToggle(g.id);
			}
		}
	};

	return (
		<div className="space-y-3">
			{areas.length > 1 && (
				<div>
					<p className="mb-1.5 font-medium text-foreground/60 text-xs uppercase tracking-wide">
						Filter by Area
					</p>
					<div className="flex flex-wrap gap-2">
						{areas.map((area) => {
							const checked = selectedAreaIds.includes(area.id);
							return (
								<label
									key={area.id}
									className={cn(
										"flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
										checked
											? "border-primary bg-primary/10 text-primary"
											: "hover:bg-muted/50",
									)}
								>
									<input
										type="checkbox"
										className="sr-only"
										checked={checked}
										onChange={() => toggleArea(area.id)}
									/>
									{area.name}
								</label>
							);
						})}
					</div>
				</div>
			)}

			{visibleSites.length > 1 && (
				<div>
					<p className="mb-1.5 font-medium text-foreground/60 text-xs uppercase tracking-wide">
						Filter by Site
					</p>
					<div className="flex flex-wrap gap-2">
						{visibleSites.map((site) => {
							const checked = selectedSiteIds.includes(site.id);
							return (
								<label
									key={site.id}
									className={cn(
										"flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
										checked
											? "border-primary bg-primary/10 text-primary"
											: "hover:bg-muted/50",
									)}
								>
									<input
										type="checkbox"
										className="sr-only"
										checked={checked}
										onChange={() => toggleSite(site.id)}
									/>
									{site.name}
								</label>
							);
						})}
					</div>
				</div>
			)}

			<div className="space-y-4">
				{groupsBySite.map(({ siteName, groups: siteGroups }) => (
					<div key={siteName}>
						<p className="mb-1.5 font-medium text-foreground/70 text-xs uppercase tracking-wide">
							{siteName}
						</p>
						<div className="grid gap-2 sm:grid-cols-2">
							{siteGroups.map((group) => (
								<label
									key={group.id}
									className={cn(
										"flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
										selectedGroupIds.includes(group.id)
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50",
									)}
								>
									<input
										type="checkbox"
										className="accent-primary"
										checked={selectedGroupIds.includes(
											group.id,
										)}
										onChange={() => onToggle(group.id)}
									/>
									<span className="text-sm">
										{group.name}
									</span>
								</label>
							))}
						</div>
					</div>
				))}
			</div>

			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	);
}
