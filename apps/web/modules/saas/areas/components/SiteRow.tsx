"use client";

import { Button } from "@repo/ui/components/button";
import {
	ChevronDownIcon,
	ChevronRightIcon,
	ClipboardListIcon,
	PlusIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

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

interface SiteRowProps {
	site: Site;
	groups: Group[];
	onEditSite: (site: Site) => void;
	onAddGroup: (siteId: string) => void;
	onEditGroup: (group: Group) => void;
	onAppSettings: (site: Site) => void;
}

export function SiteRow({
	site,
	groups,
	onEditSite,
	onAddGroup,
	onEditGroup,
	onAppSettings,
}: SiteRowProps) {
	const t = useTranslations();
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div>
			{/* Site row */}
			<div className="flex items-center gap-3 px-4 py-2.5 pl-10">
				<button
					type="button"
					onClick={() => setCollapsed((c) => !c)}
					className="text-muted-foreground hover:text-foreground transition-colors"
				>
					{collapsed
						? <ChevronRightIcon className="size-3.5" />
						: <ChevronDownIcon className="size-3.5" />}
				</button>

				<button
					type="button"
					className="flex-1 min-w-0 text-left hover:opacity-70 transition-opacity"
					onClick={() => onEditSite(site)}
				>
					<p className="text-sm font-medium">{site.name}</p>
					<div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
						<UsersIcon className="size-3" />
						<span>{t("launchclub.sites.groupsCount", { count: groups.length })}</span>
					</div>
				</button>

				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						className="gap-1.5 text-xs h-7"
						onClick={() => onAddGroup(site.id)}
					>
						<PlusIcon className="size-3" />
						{t("launchclub.groups.addGroup")}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						title={t("launchclub.sites.appSettings")}
						onClick={() => onAppSettings(site)}
					>
						<ClipboardListIcon className="size-3.5" />
					</Button>
				</div>
			</div>

			{/* Groups */}
			{!collapsed && (
				<div className="divide-y border-t bg-muted/30">
					{groups.length === 0 ? (
						<p className="px-16 py-2.5 text-xs text-muted-foreground">
							{t("launchclub.sites.noGroups")}
						</p>
					) : (
						groups.map((group) => (
							<div key={group.id} className="flex items-center gap-3 px-16 py-2.5">
								<button
									type="button"
									className="flex-1 min-w-0 text-left hover:opacity-70 transition-opacity"
									onClick={() => onEditGroup(group)}
								>
									<p className="text-sm">{group.name}</p>
									{(group.meetingDay || group.meetingTime) && (
										<p className="text-xs text-muted-foreground mt-0.5">
											{[group.meetingDay, group.meetingTime].filter(Boolean).join(" · ")}
										</p>
									)}
								</button>
								<div className="flex items-center gap-1 text-xs text-muted-foreground">
									<UsersIcon className="size-3" />
									<span>{group._count?.personGroups ?? 0}</span>
								</div>
							</div>
						))
					)}
				</div>
			)}
		</div>
	);
}
