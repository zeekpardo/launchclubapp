"use client";

import { config as storageConfig } from "@repo/storage/config";
import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useGroup } from "@saas/groups/hooks/use-groups";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	BookOpenIcon,
	CalendarIcon,
	ChartColumnIcon,
	CheckIcon,
	ClipboardListIcon,
	DollarSignIcon,
	SettingsIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { GroupOverview } from "./GroupOverview";
import { GroupAttendanceTab } from "./tabs/GroupAttendanceTab";
import { GroupEventsTab } from "./tabs/GroupEventsTab";
import { GroupMembersTab } from "./tabs/GroupMembersTab";
import { GroupPurchaseRequestsTab } from "./tabs/GroupPurchaseRequestsTab";
import { GroupResourcesTab } from "./tabs/GroupResourcesTab";
import { GroupSettingsTab } from "./tabs/GroupSettingsTab";

type NavSection =
	| "members"
	| "events"
	| "resources"
	| "purchase-requests"
	| "settings"
	| "overview"
	| "attendance";

interface GroupDetailProps {
	groupId: string;
}

export function GroupDetail({ groupId }: GroupDetailProps) {
	const t = useTranslations();
	const { data: group, isLoading } = useGroup(groupId);
	const [activeSection, setActiveSection] = useState<NavSection>("members");

	const { data: events } = useQuery(
		orpc.events.list.queryOptions({ input: { groupId } }),
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-start gap-6">
					<Skeleton className="h-32 w-48 rounded-lg" />
					<div className="space-y-3">
						<Skeleton className="h-10 w-48" />
						<Skeleton className="h-5 w-32" />
					</div>
				</div>
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (!group) return null;

	const memberCount = group.personGroups.length;
	const eventCount = events?.length ?? 0;
	const areaName = group.site?.area?.name;
	const siteName = group.site?.name;

	const navItems = [
		{
			key: "members" as NavSection,
			label: t("launchclub.groups.tabs.members"),
			icon: UsersIcon,
			count: memberCount,
		},
		{
			key: "events" as NavSection,
			label: t("launchclub.groups.tabs.events"),
			icon: CalendarIcon,
			count: eventCount,
		},
		{
			key: "resources" as NavSection,
			label: t("launchclub.groups.tabs.resources"),
			icon: BookOpenIcon,
		},
		{
			key: "purchase-requests" as NavSection,
			label: t("launchclub.groups.tabs.purchaseRequests"),
			icon: DollarSignIcon,
		},
		{
			key: "settings" as NavSection,
			label: t("launchclub.groups.tabs.settings"),
			icon: SettingsIcon,
		},
	];

	const reportItems = [
		{
			key: "overview" as NavSection,
			label: t("launchclub.groups.tabs.overview"),
			icon: ChartColumnIcon,
		},
		{
			key: "attendance" as NavSection,
			label: t("launchclub.groups.tabs.attendance"),
			icon: ClipboardListIcon,
		},
	];

	const allItems = [...navItems, ...reportItems];
	const activeItem = allItems.find((item) => item.key === activeSection);

	return (
		<div className="flex flex-col flex-1 min-h-0 gap-4 md:gap-6">
			{/* Compact header */}
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3 min-w-0">
					{group.image ? (
						<div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border bg-muted">
							<img
								src={`/image-proxy/${storageConfig.bucketNames.avatars}/${group.image}`}
								alt={group.name}
								className="h-full w-full object-cover"
							/>
						</div>
					) : (
						<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
							<span className="text-sm font-bold text-muted-foreground/50">
								{group.name.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
					<div className="flex flex-wrap items-center gap-2 min-w-0">
						<h1 className="text-xl font-bold text-foreground sm:text-2xl truncate">
							{group.name}
						</h1>
						{areaName && (
							<Badge className="bg-secondary text-secondary-foreground normal-case shrink-0">
								{areaName}
							</Badge>
						)}
						{siteName && (
							<Badge className="bg-secondary text-secondary-foreground normal-case shrink-0">
								{siteName}
							</Badge>
						)}
						<div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
							<CheckIcon className="h-3.5 w-3.5 text-green-500" />
							<span>
								{t("launchclub.groups.acceptingMembers")}
							</span>
						</div>
					</div>
				</div>
				<Button variant="outline" size="sm" className="shrink-0">
					{t("launchclub.groups.tabs.notes")}
				</Button>
			</div>

			{/* Body: sidebar + content */}
			<div className="flex flex-col flex-1 min-h-0 gap-4 md:flex-row md:gap-6 md:items-stretch">
				{/* Mobile dropdown nav */}
				<div className="md:hidden">
					<Select
						value={activeSection}
						onValueChange={(val) =>
							setActiveSection(val as NavSection)
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue>
								{activeItem && (
									<span className="flex items-center gap-2">
										<activeItem.icon className="h-4 w-4" />
										{activeItem.label}
									</span>
								)}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{navItems.map(
									({ key, label, icon: Icon, count }) => (
										<SelectItem key={key} value={key}>
											<span className="flex items-center gap-2">
												<Icon className="h-4 w-4" />
												{label}
												{count !== undefined && (
													<span className="ml-auto text-xs text-muted-foreground">
														{count}
													</span>
												)}
											</span>
										</SelectItem>
									),
								)}
							</SelectGroup>
							<SelectGroup>
								<SelectLabel>
									{t("launchclub.groups.tabs.reports")}
								</SelectLabel>
								{reportItems.map(
									({ key, label, icon: Icon }) => (
										<SelectItem key={key} value={key}>
											<span className="flex items-center gap-2">
												<Icon className="h-4 w-4" />
												{label}
											</span>
										</SelectItem>
									),
								)}
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>

				{/* Desktop sidebar nav */}
				<div className="hidden w-48 shrink-0 space-y-1 md:block self-start sticky top-0">
					{navItems.map(({ key, label, icon: Icon, count }) => (
						<button
							key={key}
							type="button"
							onClick={() => setActiveSection(key)}
							className={cn(
								"flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
								activeSection === key
									? "bg-primary/10 text-primary"
									: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
							)}
						>
							<div className="flex items-center gap-2">
								<Icon className="h-4 w-4" />
								<span>{label}</span>
							</div>
							{count !== undefined && (
								<span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
									{count}
								</span>
							)}
						</button>
					))}

					<div className="pt-4">
						<p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
							{t("launchclub.groups.tabs.reports")}
						</p>
						{reportItems.map(({ key, label, icon: Icon }) => (
							<button
								key={key}
								type="button"
								onClick={() => setActiveSection(key)}
								className={cn(
									"flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
									activeSection === key
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
								)}
							>
								<Icon className="h-4 w-4" />
								<span>{label}</span>
							</button>
						))}
					</div>
				</div>

				{/* Content panel */}
				<div className="min-w-0 flex-1 rounded-lg border bg-card p-4 md:p-6 overflow-y-auto">
					{activeSection === "members" && (
						<GroupMembersTab groupId={groupId} group={group} />
					)}

					{activeSection === "events" && (
						<GroupEventsTab groupId={groupId} group={group} />
					)}

					{activeSection === "resources" && (
						<GroupResourcesTab groupId={groupId} />
					)}

					{activeSection === "purchase-requests" && (
						<GroupPurchaseRequestsTab groupId={groupId} />
					)}

					{activeSection === "settings" && (
						<GroupSettingsTab groupId={groupId} group={group} />
					)}

					{activeSection === "overview" && (
						<GroupOverview group={group} events={events} />
					)}

					{activeSection === "attendance" && (
						<GroupAttendanceTab groupId={groupId} group={group} />
					)}
				</div>
			</div>
		</div>
	);
}
