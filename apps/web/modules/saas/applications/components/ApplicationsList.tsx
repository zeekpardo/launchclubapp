"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
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
import { ApplicationStatusActions } from "@saas/applications/components/ApplicationActions";
import { useApplications } from "@saas/applications/hooks/use-applications";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { SearchInput } from "@shared/components/SearchInput";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon, ExternalLinkIcon, Settings2Icon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

const ALL = "__all__";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

// ── Main component ─────────────────────────────────────────────────────────────

export function ApplicationsList() {
	const t = useTranslations("launchclub.applications");
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const params = useParams<{ organizationSlug: string }>();
	const orgSlug = params.organizationSlug;

	const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
	const [selectedAreaId, setSelectedAreaId] = useState<string>(ALL);
	const [selectedSiteId, setSelectedSiteId] = useState<string>(ALL);
	const [search, setSearch] = useState("");

	const queryStatus =
		statusFilter === "ALL"
			? undefined
			: (statusFilter as "PENDING" | "APPROVED" | "REJECTED");

	const { data: applications, isLoading } = useApplications(queryStatus);

	const { data: areas } = useQuery(
		orpc.areas.list.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);

	const { data: sites } = useQuery(
		orpc.sites.list.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);

	const visibleSites = useMemo(
		() =>
			selectedAreaId === ALL
				? (sites ?? [])
				: (sites ?? []).filter((s) => s.areaId === selectedAreaId),
		[sites, selectedAreaId],
	);

	const filteredApplications = useMemo(() => {
		let list = applications ?? [];
		if (selectedAreaId !== ALL) {
			list = list.filter((a) => a.site?.area?.id === selectedAreaId);
		}
		if (selectedSiteId !== ALL) {
			list = list.filter((a) => a.site?.id === selectedSiteId);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter(
				(a) =>
					`${a.parentFirstName} ${a.parentLastName}`.toLowerCase().includes(q) ||
					(a.parentEmail ?? "").toLowerCase().includes(q),
			);
		}
		return list;
	}, [applications, selectedAreaId, selectedSiteId, search]);

	const handleAreaChange = (value: string) => {
		setSelectedAreaId(value);
		setSelectedSiteId(ALL);
	};

	return (
		<div className="space-y-4">
			{/* Filter bar */}
			<div className="flex flex-wrap items-center gap-3">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon" aria-label="Settings">
							<Settings2Icon className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem asChild>
							<Link href={`/app/${orgSlug}/settings/applications`}>
								Advanced Settings
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<Select value={selectedAreaId} onValueChange={handleAreaChange}>
					<SelectTrigger className="w-44">
						<SelectValue placeholder={t("allAreas")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>{t("allAreas")}</SelectItem>
						{(areas ?? []).map((area) => (
							<SelectItem key={area.id} value={area.id}>
								{area.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
					<SelectTrigger className="w-44">
						<SelectValue placeholder={t("allSites")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>{t("allSites")}</SelectItem>
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
					placeholder={t("searchPlaceholder")}
					className="w-64"
				/>
			</div>

			<div className="inline-flex rounded-lg border bg-muted p-1">
				{(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => setStatusFilter(s)}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
					>
						{t(`filter.${s.toLowerCase() as "all" | "pending" | "approved" | "rejected"}`)}
					</button>
				))}
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("columns.name")}</TableHead>
							<TableHead>{t("columns.email")}</TableHead>
							<TableHead>{t("columns.phone")}</TableHead>
							<TableHead>{t("columns.site")}</TableHead>
							<TableHead>{t("columns.submitted")}</TableHead>
							<TableHead>{t("columns.status")}</TableHead>
							<TableHead>{t("columns.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<>
								{Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell><Skeleton className="h-4 w-32" /></TableCell>
										<TableCell><Skeleton className="h-4 w-40" /></TableCell>
										<TableCell><Skeleton className="h-4 w-28" /></TableCell>
										<TableCell><Skeleton className="h-4 w-24" /></TableCell>
										<TableCell><Skeleton className="h-4 w-24" /></TableCell>
										<TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
										<TableCell><Skeleton className="h-8 w-20" /></TableCell>
									</TableRow>
								))}
							</>
						) : filteredApplications.length > 0 ? (
							filteredApplications.map((app) => (
								<TableRow key={app.id}>
									<TableCell className="font-medium">
										<Link
											href={`/app/${orgSlug}/applications/${app.id}`}
											className="hover:underline inline-flex items-center gap-1"
										>
											{app.parentFirstName} {app.parentLastName}
											<ExternalLinkIcon className="size-3 text-muted-foreground" />
										</Link>
									</TableCell>
									<TableCell>{app.parentEmail ?? "—"}</TableCell>
									<TableCell>{app.parentPhone ?? "—"}</TableCell>
									<TableCell>{app.site?.name ?? "—"}</TableCell>
									<TableCell>
										{new Date(app.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<StatusBadge status={app.status} />
									</TableCell>
									<TableCell>
										<ApplicationStatusActions
											applicationId={app.id}
											siteId={app.site?.id ?? ""}
											currentStatus={app.status}
											children={app.children ?? []}
										/>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={7}
									className="text-center text-muted-foreground py-8"
								>
									{t("notFound")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const t = useTranslations("launchclub.applications");

	if (status === "APPROVED") {
		return <Badge status="success">{t("status.APPROVED")}</Badge>;
	}
	if (status === "REJECTED") {
		return <Badge status="error">{t("status.REJECTED")}</Badge>;
	}
	return <Badge status="warning">{t("status.PENDING")}</Badge>;
}
