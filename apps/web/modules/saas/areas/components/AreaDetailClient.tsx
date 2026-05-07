"use client";

import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useArea } from "@saas/areas/hooks/use-areas";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { BuildingIcon, InboxIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";
import { AreaDialog } from "./AreaDialog";
import { AreaSettingsTab } from "./tabs/AreaSettingsTab";
import { AreaSitesTab } from "./tabs/AreaSitesTab";
import { AreaSubmissionsTab } from "./tabs/AreaSubmissionsTab";

type NavSection = "sites" | "submissions" | "settings";

interface AreaDetailClientProps {
	areaId: string;
}

export function AreaDetailClient({ areaId }: AreaDetailClientProps) {
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const { data: area, isLoading } = useArea(areaId);
	const [activeSection, setActiveSection] = useState<NavSection>("sites");
	const [editOpen, setEditOpen] = useState(false);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="space-y-3">
					<Skeleton className="h-10 w-64" />
					<Skeleton className="h-5 w-48" />
				</div>
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!area) return null;

	const navItems = [
		{ key: "sites" as NavSection, label: "Sites", icon: BuildingIcon, count: area.sites.length },
		{ key: "submissions" as NavSection, label: "Submissions", icon: InboxIcon },
		{ key: "settings" as NavSection, label: "Settings", icon: SettingsIcon },
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-3xl font-bold">{area.name}</h1>
					{area.description && (
						<p className="mt-1 text-sm text-muted-foreground">{area.description}</p>
					)}
				</div>
				<Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
					Edit
				</Button>
			</div>

			{/* Body: tab bar (mobile) / sidebar + content (desktop) */}
			<div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
				{/* Nav */}
				<div className="flex overflow-x-auto gap-1 sm:flex-col sm:w-44 sm:shrink-0 sm:overflow-visible sm:space-y-1">
					{navItems.map(({ key, label, icon: Icon, count }) => (
						<button
							key={key}
							type="button"
							onClick={() => setActiveSection(key)}
							className={cn(
								"flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
								"sm:w-full sm:justify-between",
								activeSection === key
									? "bg-primary/10 text-primary"
									: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
							)}
						>
							<div className="flex items-center gap-2">
								<Icon className="h-4 w-4" />
								<span className="whitespace-nowrap">{label}</span>
							</div>
							{count !== undefined && (
								<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-semibold px-1">
									{count}
								</span>
							)}
						</button>
					))}
				</div>

				{/* Content panel */}
				<div className="min-w-0 flex-1 rounded-lg border bg-card p-6">
					{activeSection === "sites" && (
						<AreaSitesTab areaId={areaId} organizationId={organizationId} />
					)}
					{activeSection === "submissions" && (
						<AreaSubmissionsTab areaId={areaId} />
					)}
					{activeSection === "settings" && (
						<AreaSettingsTab area={area} organizationId={organizationId} />
					)}
				</div>
			</div>

			<AreaDialog
				open={editOpen}
				onOpenChange={setEditOpen}
				area={{ id: area.id, name: area.name, description: area.description }}
				organizationId={organizationId}
			/>
		</div>
	);
}
