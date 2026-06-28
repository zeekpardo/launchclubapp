"use client";

import { config as storageConfig } from "@repo/storage/config";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@repo/ui/components/sheet";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	PencilIcon,
	PlusIcon,
	Settings2Icon,
	TrashIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useDeletePerson, usePeople, usePerson } from "../hooks/use-people";
import { GuardianManager } from "./GuardianManager";

type FilterTab = "all" | "parents" | "students" | "mentors";

const ALL = "__all__";

function PersonAvatar({
	firstName,
	lastName,
	personType,
	avatarUrl,
}: {
	firstName: string;
	lastName: string;
	personType: string;
	avatarUrl?: string | null;
}) {
	const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

	if (avatarUrl) {
		return (
			<img
				src={`/image-proxy/${storageConfig.bucketNames.avatars}/${avatarUrl}`}
				alt={`${firstName} ${lastName}`}
				className="size-9 rounded-full object-cover"
			/>
		);
	}

	return (
		<div
			className={`flex size-9 items-center justify-center rounded-full text-xs font-semibold ${
				personType === "STUDENT"
					? "bg-cyan-500 text-white"
					: "bg-muted text-muted-foreground"
			}`}
		>
			{initials}
		</div>
	);
}

function TypeBadge({
	personType,
	studentLabel,
	parentLabel,
	mentorLabel,
}: {
	personType: string;
	studentLabel: string;
	parentLabel: string;
	mentorLabel: string;
}) {
	if (personType === "STUDENT") {
		return (
			<span className="inline-flex items-center rounded-full bg-cyan-500 px-2.5 py-0.5 text-xs font-medium text-white">
				{studentLabel}
			</span>
		);
	}
	if (personType === "MENTOR") {
		return (
			<span className="inline-flex items-center rounded-full bg-violet-500 px-2.5 py-0.5 text-xs font-medium text-white">
				{mentorLabel}
			</span>
		);
	}
	return (
		<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
			{parentLabel}
		</span>
	);
}

function GroupPills({ groups }: { groups: { name: string }[] }) {
	if (!groups.length) return <span className="text-muted-foreground">—</span>;
	return (
		<div className="flex flex-wrap gap-1">
			{groups.map((g) => (
				<span
					key={g.name}
					className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
				>
					{g.name}
				</span>
			))}
		</div>
	);
}

function GuardianSheet({
	kidId,
	onClose,
	sheetTitle,
	sheetFallback,
}: {
	kidId: string;
	onClose: () => void;
	sheetTitle: (name: string) => string;
	sheetFallback: string;
}) {
	const { data: kid, isLoading } = usePerson(kidId);
	return (
		<Sheet open onOpenChange={(open) => !open && onClose()}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>
						{kid
							? sheetTitle(`${kid.firstName} ${kid.lastName}`)
							: sheetFallback}
					</SheetTitle>
				</SheetHeader>
				<div className="mt-6">
					{isLoading ? (
						<div className="space-y-2">
							{Array.from({ length: 3 }).map((_, i) => (
								<Skeleton key={i} className="h-14 w-full" />
							))}
						</div>
					) : kid ? (
						<GuardianManager
							kid={{
								id: kid.id,
								firstName: kid.firstName,
								lastName: kid.lastName,
								guardians: (kid.guardians ?? []).map((g) => ({
									person: {
										id: g.person.id,
										firstName: g.person.firstName,
										lastName: g.person.lastName,
									},
									relation: g.relation,
								})),
							}}
						/>
					) : null}
				</div>
			</SheetContent>
		</Sheet>
	);
}

export function PeopleTable() {
	const t = useTranslations();
	const params = useParams<{ organizationSlug: string }>();
	const router = useRouter();
	const { activeOrganization, activeOrganizationUserRole } =
		useActiveOrganization();
	// Both site leaders and group leaders have member.role="member" in Better Auth.
	// We distinguish them by whether sites.list returns data (site leaders have UserSite records).
	const isRestrictedMember = activeOrganizationUserRole === "member";
	const [search, setSearch] = useState("");
	const [tab, setTab] = useState<FilterTab>("all");
	const [selectedAreaId, setSelectedAreaId] = useState<string>(ALL);
	const [selectedSiteId, setSelectedSiteId] = useState<string>(ALL);
	const [showInactive, setShowInactive] = useState(false);
	const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
	const [guardianKidId, setGuardianKidId] = useState<string | null>(null);

	const areaId = selectedAreaId !== ALL ? selectedAreaId : undefined;
	const siteId = selectedSiteId !== ALL ? selectedSiteId : undefined;

	const { data: allAreas } = useQuery(
		orpc.areas.list.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
			enabled: !!activeOrganization?.id && !isRestrictedMember,
		}),
	);

	const { data: sites, isLoading: sitesLoading } = useQuery(
		orpc.sites.list.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
			enabled: !!activeOrganization?.id,
		}),
	);

	// Distinguish site leader vs group leader: site leaders have UserSite records returned by sites.list
	const isSiteLeader =
		isRestrictedMember && !sitesLoading && (sites?.length ?? 0) > 0;

	// Site leaders: derive areas from their scoped sites (sites.list is already server-scoped)
	const siteLeaderAreas = useMemo(() => {
		if (!isSiteLeader || !sites) return undefined;
		const seen = new Set<string>();
		return (sites as Array<{ area?: { id: string; name: string } }>)
			.filter(
				(s) => s.area && !seen.has(s.area.id) && seen.add(s.area.id),
			)
			.map((s) => s.area as { id: string; name: string });
	}, [isSiteLeader, sites]);

	const areas = isSiteLeader ? siteLeaderAreas : allAreas;

	const visibleSites = useMemo(
		() =>
			selectedAreaId === ALL
				? (sites ?? [])
				: (sites ?? []).filter((s) => s.areaId === selectedAreaId),
		[sites, selectedAreaId],
	);

	const activeFilter = showInactive ? undefined : true;
	const { data: allPeople, isLoading: allLoading } = usePeople({
		query: search,
		isActive: activeFilter,
		areaId,
		siteId,
	});
	const { data: parents, isLoading: parentsLoading } = usePeople({
		query: search,
		personType: "PARENT",
		isActive: activeFilter,
		areaId,
		siteId,
	});
	const { data: students, isLoading: studentsLoading } = usePeople({
		query: search,
		personType: "STUDENT",
		isActive: activeFilter,
		areaId,
		siteId,
	});
	const { data: mentors, isLoading: mentorsLoading } = usePeople({
		query: search,
		personType: "MENTOR",
		isActive: activeFilter,
		areaId,
		siteId,
	});

	const handleAreaChange = (value: string) => {
		setSelectedAreaId(value);
		setSelectedSiteId(ALL);
	};

	const people =
		tab === "parents"
			? parents
			: tab === "students"
				? students
				: tab === "mentors"
					? mentors
					: allPeople;
	const isLoading =
		tab === "parents"
			? parentsLoading
			: tab === "students"
				? studentsLoading
				: tab === "mentors"
					? mentorsLoading
					: allLoading;
	const deletePerson = useDeletePerson();

	const basePath = `/app/${params.organizationSlug}/people`;

	const handleDelete = async () => {
		if (!deletePersonId) return;
		try {
			await deletePerson.mutateAsync({ id: deletePersonId });
			toastSuccess(t("launchclub.people.form.notifications.deleted"));
		} catch {
			toastError(t("launchclub.people.form.notifications.error"));
		} finally {
			setDeletePersonId(null);
		}
	};

	return (
		<div className="space-y-4">
			{/* Filter bar */}
			<div className="flex flex-col gap-3">
				{/* Row 1: Search + New Person button */}
				<div className="flex items-center gap-2">
					<Input
						type="search"
						placeholder={t("launchclub.people.search")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="flex-1"
					/>
					{!isRestrictedMember && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="shrink-0"
									aria-label="Settings"
								>
									<Settings2Icon className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link
										href={`/app/${params.organizationSlug}/settings/academic-years`}
									>
										Academic Years
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link
										href={`/app/${params.organizationSlug}/settings/custom-fields`}
									>
										Custom Fields
									</Link>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
					<Button asChild className="shrink-0">
						<Link href={`${basePath}/new`}>
							<PlusIcon className="size-4 md:mr-2" />
							<span className="hidden md:inline">
								{t("launchclub.people.new")}
							</span>
						</Link>
					</Button>
				</div>

				{/* Row 2: Area + Site selects */}
				<div className="flex items-center gap-2">
					<Select
						value={selectedAreaId}
						onValueChange={handleAreaChange}
					>
						<SelectTrigger className="flex-1">
							<SelectValue
								placeholder={t("launchclub.people.allAreas")}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>
								{t("launchclub.people.allAreas")}
							</SelectItem>
							{(areas ?? []).map((area) => (
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
						<SelectTrigger className="flex-1">
							<SelectValue
								placeholder={t("launchclub.people.allSites")}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>
								{t("launchclub.people.allSites")}
							</SelectItem>
							{visibleSites.map((site) => (
								<SelectItem key={site.id} value={site.id}>
									{site.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Row 3: Type tabs + inactive toggle */}
				<div className="flex items-center gap-3">
					<div className="inline-flex rounded-lg border bg-muted p-1 self-start">
						{(
							[
								"all",
								"parents",
								"students",
								"mentors",
							] as FilterTab[]
						).map((filterTab) => (
							<button
								key={filterTab}
								type="button"
								onClick={() => setTab(filterTab)}
								className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
									tab === filterTab
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{filterTab === "all"
									? t("launchclub.people.tabs.all")
									: filterTab === "parents"
										? t("launchclub.people.tabs.parents")
										: filterTab === "students"
											? t(
													"launchclub.people.tabs.students",
												)
											: t(
													"launchclub.people.tabs.mentors",
												)}
							</button>
						))}
					</div>
					<label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground select-none">
						<input
							type="checkbox"
							checked={showInactive}
							onChange={(e) => setShowInactive(e.target.checked)}
							className="rounded"
						/>
						{t("launchclub.people.showInactive")}
					</label>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-xl border bg-card">
				<Table>
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="w-10" />
							<TableHead>
								{t("launchclub.people.columns.name")}
							</TableHead>
							<TableHead>
								{t("launchclub.people.columns.type")}
							</TableHead>
							<TableHead>
								{t("launchclub.people.columns.gender")}
							</TableHead>
							<TableHead>
								{t("launchclub.people.columns.phone")}
							</TableHead>
							<TableHead>
								{t("launchclub.people.columns.email")}
							</TableHead>
							<TableHead>
								{t("launchclub.people.columns.groups")}
							</TableHead>
							<TableHead>
								{t("launchclub.people.columns.status")}
							</TableHead>
							<TableHead className="w-32">
								{t("launchclub.people.columns.actions")}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell>
										<Skeleton className="size-9 rounded-full" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-14 rounded-full" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-16" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-28" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-40" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-20 rounded-full" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-16 rounded-full" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-8 w-24" />
									</TableCell>
								</TableRow>
							))
						) : people && people.length > 0 ? (
							people.map((person) => (
								<TableRow
									key={person.id}
									className="cursor-pointer"
									onClick={() =>
										router.push(`${basePath}/${person.id}`)
									}
								>
									<TableCell>
										<PersonAvatar
											firstName={person.firstName}
											lastName={person.lastName}
											personType={person.personType}
											avatarUrl={person.avatarUrl}
										/>
									</TableCell>
									<TableCell className="font-medium">
										{person.firstName} {person.lastName}
									</TableCell>
									<TableCell>
										<TypeBadge
											personType={person.personType}
											studentLabel={t(
												"launchclub.people.personType.STUDENT",
											)}
											parentLabel={t(
												"launchclub.people.personType.PARENT",
											)}
											mentorLabel={t(
												"launchclub.people.personType.MENTOR",
											)}
										/>
									</TableCell>
									<TableCell className="text-muted-foreground capitalize">
										{person.gender ?? "—"}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{person.phone ?? "—"}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{person.email ?? "—"}
									</TableCell>
									<TableCell>
										<GroupPills
											groups={(
												person.personGroups ?? []
											).map((pg) => ({
												name: pg.group.name,
											}))}
										/>
									</TableCell>
									<TableCell>
										<span
											className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${person.isActive ? "bg-green-500" : "bg-muted text-muted-foreground"}`}
										>
											{person.isActive
												? t(
														"launchclub.people.statusActive",
													)
												: t(
														"launchclub.people.statusInactive",
													)}
										</span>
									</TableCell>
									<TableCell
										onClick={(e) => e.stopPropagation()}
									>
										<div className="flex items-center gap-1">
											{person.personType ===
												"STUDENT" && (
												<Button
													size="icon"
													variant="ghost"
													title={t(
														"launchclub.people.manageGuardians",
													)}
													onClick={() =>
														setGuardianKidId(
															person.id,
														)
													}
												>
													<UserIcon className="size-4" />
												</Button>
											)}
											<Button
												asChild
												size="icon"
												variant="ghost"
											>
												<Link
													href={`${basePath}/${person.id}`}
												>
													<PencilIcon className="size-4" />
												</Link>
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onClick={() =>
													setDeletePersonId(person.id)
												}
											>
												<TrashIcon className="size-4 text-destructive" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={9}
									className="h-24 text-center text-muted-foreground"
								>
									{t("launchclub.people.noResults")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{guardianKidId && (
				<GuardianSheet
					kidId={guardianKidId}
					onClose={() => setGuardianKidId(null)}
					sheetTitle={(name) =>
						t("launchclub.people.guardianSheet.title", { name })
					}
					sheetFallback={t(
						"launchclub.people.guardianSheet.fallback",
					)}
				/>
			)}

			<AlertDialog
				open={!!deletePersonId}
				onOpenChange={(open) => !open && setDeletePersonId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("launchclub.people.confirmDelete.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("launchclub.people.confirmDelete.message")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("launchclub.people.form.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("launchclub.people.confirmDelete.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
