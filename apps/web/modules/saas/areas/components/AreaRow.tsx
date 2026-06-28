"use client";

import { Button } from "@repo/ui/components/button";
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SiteRow } from "./SiteRow";

interface Area {
	id: string;
	name: string;
	description: string | null;
}

interface Site {
	id: string;
	name: string;
	slug: string;
	areaId: string;
	addressLine1: string | null;
	city: string | null;
	stateProvince: string | null;
	postalCode: string | null;
	country: string | null;
	phone: string | null;
	email: string | null;
	acceptApplications: boolean | null;
	applicationDeadline: Date | null;
}

interface Group {
	id: string;
	name: string;
	siteId: string;
	description: string | null;
	gradeLevel: string | null;
	meetingDay: string | null;
	meetingTime: string | null;
	meetingRecurrence: string | null;
	_count?: { personGroups: number };
}

interface AreaRowProps {
	area: Area;
	sites: Site[];
	groups: Group[];
	onEditArea: (area: Area) => void;
	onAddSite: (areaId: string) => void;
	onEditSite: (site: Site) => void;
	onAddGroup: (siteId: string) => void;
	onEditGroup: (group: Group) => void;
	onAppSettings: (site: Site) => void;
}

export function AreaRow({
	area,
	sites,
	groups,
	onEditArea,
	onAddSite,
	onEditSite,
	onAddGroup,
	onEditGroup,
	onAppSettings,
}: AreaRowProps) {
	const router = useRouter();
	const params = useParams<{ organizationSlug: string }>();
	const t = useTranslations();
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div className="rounded-xl border bg-card">
			{/* Area row */}
			<div className="flex items-center gap-3 px-4 py-3">
				<button
					type="button"
					onClick={() => setCollapsed((c) => !c)}
					className="text-muted-foreground hover:text-foreground transition-colors"
				>
					{collapsed ? (
						<ChevronRightIcon className="size-4" />
					) : (
						<ChevronDownIcon className="size-4" />
					)}
				</button>

				<button
					type="button"
					className="flex-1 min-w-0 text-left group"
					onClick={() =>
						router.push(
							`/app/${params.organizationSlug}/settings/areas/${area.id}`,
						)
					}
				>
					<p className="font-semibold text-sm group-hover:text-primary transition-colors">
						{area.name}
					</p>
					<p className="text-xs text-muted-foreground mt-0.5">
						{t("launchclub.areas.sitesCount", {
							count: sites.length,
						})}
					</p>
				</button>

				<Button
					variant="ghost"
					size="sm"
					className="gap-1.5 text-xs h-7"
					onClick={() => onAddSite(area.id)}
				>
					<PlusIcon className="size-3" />
					{t("launchclub.sites.addSite")}
				</Button>
			</div>

			{/* Sites */}
			{!collapsed && (
				<div className="border-t divide-y">
					{sites.length === 0 ? (
						<p className="px-10 py-3 text-xs text-muted-foreground">
							{t("launchclub.areas.noSites")}
						</p>
					) : (
						sites.map((site) => (
							<SiteRow
								key={site.id}
								site={site}
								groups={groups.filter(
									(g) => g.siteId === site.id,
								)}
								onEditSite={onEditSite}
								onAddGroup={onAddGroup}
								onEditGroup={onEditGroup}
								onAppSettings={onAppSettings}
							/>
						))
					)}
				</div>
			)}
		</div>
	);
}
