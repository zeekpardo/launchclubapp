"use client";

import { config as storageConfig } from "@repo/storage/config";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { AreaDialog } from "@saas/areas/components/AreaDialog";
import { formatMeetingDays } from "@saas/groups/lib/day-utils";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { SiteDialog } from "@saas/sites/components/SiteDialog";
import { SearchInput } from "@shared/components/SearchInput";
import {
	ExternalLinkIcon,
	MapPinIcon,
	PlusIcon,
	Settings2Icon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useGroups } from "../hooks/use-groups";
import { GroupDialog } from "./GroupDialog";
import { formatGradeDisplay } from "./GroupFormFields";

const ALL = "__ALL__";

export function GroupList() {
	const t = useTranslations();
	const locale = useLocale();
	const { activeOrganization, activeOrganizationUserRole } =
		useActiveOrganization();
	const isGroupLeader = activeOrganizationUserRole === "member";
	const params = useParams();
	const organizationSlug = params.organizationSlug as string;
	const [dialogOpen, setDialogOpen] = useState(false);
	const [areaDialogOpen, setAreaDialogOpen] = useState(false);
	const [siteDialogOpen, setSiteDialogOpen] = useState(false);

	const [selectedAreaId, setSelectedAreaId] = useState<string>(ALL);
	const [selectedSiteId, setSelectedSiteId] = useState<string>(ALL);
	const [search, setSearch] = useState("");

	const router = useRouter();
	const { data: groups, isLoading } = useGroups();

	// Derive unique areas from groups data
	const areas = useMemo(() => {
		const map = new Map<string, { id: string; name: string }>();
		for (const g of groups ?? []) {
			const area = g.site?.area;
			if (area && !map.has(area.id)) map.set(area.id, area);
		}
		return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
	}, [groups]);

	// Derive unique sites, optionally filtered by selected area
	const visibleSites = useMemo(() => {
		const map = new Map<
			string,
			{ id: string; name: string; areaId: string }
		>();
		for (const g of groups ?? []) {
			const site = g.site;
			if (!site) continue;
			if (selectedAreaId !== ALL && site.area?.id !== selectedAreaId)
				continue;
			if (!map.has(site.id))
				map.set(site.id, {
					id: site.id,
					name: site.name,
					areaId: site.area?.id ?? "",
				});
		}
		return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
	}, [groups, selectedAreaId]);

	const handleAreaChange = (value: string) => {
		setSelectedAreaId(value);
		setSelectedSiteId(ALL);
	};

	// Apply filters
	const filteredGroups = useMemo(() => {
		let list = groups ?? [];
		if (selectedAreaId !== ALL) {
			list = list.filter((g) => g.site?.area?.id === selectedAreaId);
		}
		if (selectedSiteId !== ALL) {
			list = list.filter((g) => g.site?.id === selectedSiteId);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter((g) => g.name.toLowerCase().includes(q));
		}
		return list;
	}, [groups, selectedAreaId, selectedSiteId, search]);

	if (!activeOrganization) {
		return null;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-foreground">
					{t("launchclub.groups.title")}
				</h1>
				<div className="flex items-center gap-2">
					{!isGroupLeader && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									aria-label="Location settings"
								>
									<Settings2Icon className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => setAreaDialogOpen(true)}
								>
									<MapPinIcon className="mr-2 h-4 w-4" />
									New Area
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => setSiteDialogOpen(true)}
								>
									<MapPinIcon className="mr-2 h-4 w-4" />
									New Site
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										href={`/app/${organizationSlug}/settings/areas`}
									>
										<ExternalLinkIcon className="mr-2 h-4 w-4" />
										Advanced Settings
									</Link>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
					<Button onClick={() => setDialogOpen(true)}>
						<PlusIcon className="mr-2 h-4 w-4" />
						{t("launchclub.groups.new")}
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{t("launchclub.groups.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Filters */}
					<div className="flex flex-wrap items-center gap-3">
						<Select
							value={selectedAreaId}
							onValueChange={handleAreaChange}
						>
							<SelectTrigger className="w-44">
								<SelectValue placeholder="All Areas" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>All Areas</SelectItem>
								{areas.map((area) => (
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
								<SelectValue placeholder="All Sites" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>All Sites</SelectItem>
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
							placeholder="Search groups…"
							className="w-64"
						/>
					</div>

					{isLoading ? (
						<div className="space-y-3">
							{Array.from({ length: 4 }).map((_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
								<Skeleton key={i} className="h-14 w-full" />
							))}
						</div>
					) : filteredGroups.length > 0 ? (
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="hidden md:table-cell w-16" />
									<TableHead>
										{t("launchclub.groups.columns.name")}
									</TableHead>
									<TableHead>
										{t("launchclub.groups.columns.site")}
									</TableHead>
									<TableHead className="hidden md:table-cell">
										{t(
											"launchclub.groups.columns.gradeLevel",
										)}
									</TableHead>
									<TableHead className="hidden md:table-cell">
										{t(
											"launchclub.groups.columns.meetingDays",
										)}
									</TableHead>
									<TableHead className="hidden md:table-cell">
										{t("launchclub.groups.columns.mentor")}
									</TableHead>
									<TableHead className="hidden md:table-cell text-right">
										{t(
											"launchclub.groups.columns.students",
										)}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredGroups.map((group) => {
									const leader =
										group.personGroups?.[0]?.person;
									const mentorName = leader
										? `${leader.firstName} ${leader.lastName}`.trim()
										: "-";
									const gradeLevel = formatGradeDisplay(
										group.gradeLevel,
									);
									const meetingDays = formatMeetingDays(
										group.meetingDay,
										locale,
										t("launchclub.groups.tbd"),
									);

									return (
										<TableRow
											key={group.id}
											className="cursor-pointer"
											onClick={() =>
												router.push(
													`/app/${organizationSlug}/groups/${group.id}`,
												)
											}
										>
											<TableCell className="hidden md:table-cell">
												<div className="h-8 w-12 overflow-hidden rounded border bg-muted">
													{group.image ? (
														<img
															src={`/image-proxy/${storageConfig.bucketNames.avatars}/${group.image}`}
															alt={group.name}
															className="h-full w-full object-cover"
														/>
													) : (
														<div className="flex h-full w-full items-center justify-center">
															<span className="text-xs font-semibold text-muted-foreground/70">
																{group.name
																	.charAt(0)
																	.toUpperCase()}
															</span>
														</div>
													)}
												</div>
											</TableCell>
											<TableCell className="font-medium">
												{group.name}
											</TableCell>
											<TableCell>
												{group.site?.name ?? "-"}
											</TableCell>
											<TableCell className="hidden md:table-cell">
												{gradeLevel}
											</TableCell>
											<TableCell className="hidden md:table-cell">
												{meetingDays}
											</TableCell>
											<TableCell className="hidden md:table-cell">
												{mentorName}
											</TableCell>
											<TableCell className="hidden md:table-cell text-right">
												{group._count.personGroups}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					) : (
						<div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
							<PlusIcon className="size-10 opacity-40" />
							<p className="text-sm">
								{search ||
								selectedAreaId !== ALL ||
								selectedSiteId !== ALL
									? "No groups match your filters."
									: t("launchclub.groups.empty")}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			<GroupDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				organizationId={activeOrganization.id}
			/>

			<AreaDialog
				open={areaDialogOpen}
				onOpenChange={setAreaDialogOpen}
				organizationId={activeOrganization.id}
			/>

			<SiteDialog
				open={siteDialogOpen}
				onOpenChange={setSiteDialogOpen}
				organizationId={activeOrganization.id}
			/>
		</div>
	);
}
