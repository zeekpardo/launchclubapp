"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
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
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	useAllPurchaseRequests,
	useReviewPurchaseRequest,
} from "@saas/groups/hooks/use-purchase-requests";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { SearchInput } from "@shared/components/SearchInput";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	CheckCircle2Icon,
	ChevronDownIcon,
	ClockIcon,
	DollarSignIcon,
	ExternalLinkIcon,
	XCircleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

const ALL = "__all__";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "DECLINED";

export function PurchaseRequestsApprovalPage() {
	const t = useTranslations("launchclub.purchaseRequests");
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";

	const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
	const [selectedAreaId, setSelectedAreaId] = useState(ALL);
	const [selectedSiteId, setSelectedSiteId] = useState(ALL);
	const [selectedGroupId, setSelectedGroupId] = useState(ALL);
	const [selectedCategory, setSelectedCategory] = useState(ALL);
	const [search, setSearch] = useState("");
	const today = new Date();
	const [dateFrom, setDateFrom] = useState(
		`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`,
	);
	const [dateTo, setDateTo] = useState(today.toISOString().slice(0, 10));

	const { data: requests, isLoading } = useAllPurchaseRequests();

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

	const { data: groups } = useQuery(
		orpc.groups.list.queryOptions({
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

	const visibleGroups = useMemo(() => {
		let list = groups ?? [];
		if (selectedAreaId !== ALL) list = list.filter((g) => g.site.area?.id === selectedAreaId);
		if (selectedSiteId !== ALL) list = list.filter((g) => g.site?.id === selectedSiteId);
		return list;
	}, [groups, selectedAreaId, selectedSiteId]);

	const filteredRequests = useMemo(() => {
		let list = requests ?? [];
		if (statusFilter !== "ALL") list = list.filter((r) => r.status === statusFilter);
		if (selectedAreaId !== ALL) list = list.filter((r) => r.group.site.area?.id === selectedAreaId);
		if (selectedSiteId !== ALL) list = list.filter((r) => r.group.site.id === selectedSiteId);
		if (selectedGroupId !== ALL) list = list.filter((r) => r.group.id === selectedGroupId);
		if (selectedCategory !== ALL) list = list.filter((r) => r.items.some((i) => i.category === selectedCategory));
		if (dateFrom) list = list.filter((r) => new Date(r.createdAt) >= new Date(dateFrom));
		if (dateTo) {
			const to = new Date(dateTo);
			to.setHours(23, 59, 59, 999);
			list = list.filter((r) => new Date(r.createdAt) <= to);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter(
				(r) =>
					r.name.toLowerCase().includes(q) ||
					r.description.toLowerCase().includes(q) ||
					r.items.some((i) => i.item.toLowerCase().includes(q)) ||
					r.group.name.toLowerCase().includes(q) ||
					r.requestedBy.name.toLowerCase().includes(q),
			);
		}
		return list;
	}, [requests, statusFilter, selectedAreaId, selectedSiteId, selectedGroupId, selectedCategory, dateFrom, dateTo, search]);

	const pendingCount = (requests ?? []).filter((r) => r.status === "PENDING").length;
	const approvedAmount = (requests ?? [])
		.filter((r) => r.status === "APPROVED")
		.reduce((sum, r) => sum + r.items.reduce((s, i) => s + Number(i.amount) * i.quantity, 0), 0);

	const handleAreaChange = (value: string) => {
		setSelectedAreaId(value);
		setSelectedSiteId(ALL);
		setSelectedGroupId(ALL);
	};

	const handleSiteChange = (value: string) => {
		setSelectedSiteId(value);
		setSelectedGroupId(ALL);
	};

	const categoryLabels: Record<string, string> = {
		supplies: t("categories.supplies"),
		snacks: t("categories.snacks"),
		activities: t("categories.activities"),
		equipment: t("categories.equipment"),
		field_trips: t("categories.field_trips"),
		guest_speakers: t("categories.guest_speakers"),
		other: t("categories.other"),
	};

	return (
		<div className="space-y-6">
			{/* Summary stats */}
			<div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
				<span>
					<span className="font-semibold text-foreground">{pendingCount}</span>{" "}
					{t("pendingReview")}
				</span>
				<span>
					<span className="font-semibold text-green-600">${approvedAmount.toFixed(2)}</span>{" "}
					{t("approvedTotal")}
				</span>
			</div>

			{/* Filter bar */}
			<div className="flex flex-wrap items-center gap-3">
				<Select value={selectedAreaId} onValueChange={handleAreaChange}>
					<SelectTrigger className="w-40">
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

				<Select value={selectedSiteId} onValueChange={handleSiteChange}>
					<SelectTrigger className="w-40">
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

				<Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
					<SelectTrigger className="w-40">
						<SelectValue placeholder={t("allGroups")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>{t("allGroups")}</SelectItem>
						{visibleGroups.map((group) => (
							<SelectItem key={group.id} value={group.id}>
								{group.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={selectedCategory} onValueChange={setSelectedCategory}>
					<SelectTrigger className="w-40">
						<SelectValue placeholder={t("allCategories")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>{t("allCategories")}</SelectItem>
						{Object.entries(categoryLabels).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className="flex items-center gap-2">
					<Input
						type="date"
						value={dateFrom}
						onChange={(e) => setDateFrom(e.target.value)}
						className="w-44 pr-2"
						aria-label={t("dateFrom")}
					/>
					<span className="text-sm text-muted-foreground">–</span>
					<Input
						type="date"
						value={dateTo}
						onChange={(e) => setDateTo(e.target.value)}
						className="w-44 pr-2"
						aria-label={t("dateTo")}
					/>
				</div>

				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder={t("searchPlaceholder")}
					className="w-64"
				/>

				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						setSelectedAreaId(ALL);
						setSelectedSiteId(ALL);
						setSelectedGroupId(ALL);
						setSelectedCategory(ALL);
						const now = new Date();
						setDateFrom(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
						setDateTo(now.toISOString().slice(0, 10));
						setSearch("");
					}}
				>
					{t("clearFilters")}
				</Button>
			</div>

			{/* Status tabs */}
			<div className="inline-flex rounded-lg border bg-muted p-1">
				{(["ALL", "PENDING", "APPROVED", "DECLINED"] as const).map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => setStatusFilter(s)}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
					>
						{s === "ALL" ? t("tabs.all") : t(`tabs.${s.toLowerCase() as "pending" | "approved" | "declined"}`)}
					</button>
				))}
			</div>

			{/* Request list */}
			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-32 w-full rounded-lg" />
					))}
				</div>
			) : filteredRequests.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
					<DollarSignIcon className="size-8 opacity-40" />
					<p className="text-sm">{t("notFound")}</p>
				</div>
			) : (
				<div className="space-y-3">
					{filteredRequests.map((request) => (
						<ApprovalCard key={request.id} request={request} categoryLabels={categoryLabels} />
					))}
				</div>
			)}
		</div>
	);
}

function ApprovalCard({
	request,
	categoryLabels,
}: {
	request: NonNullable<ReturnType<typeof useAllPurchaseRequests>["data"]>[number];
	categoryLabels: Record<string, string>;
}) {
	const t = useTranslations("launchclub.purchaseRequests");
	const reviewRequest = useReviewPurchaseRequest();

	const statusConfig: Record<string, { label: string; status: "info" | "success" | "error" }> = {
		PENDING: { label: t("status.PENDING"), status: "info" },
		APPROVED: { label: t("status.APPROVED"), status: "success" },
		DECLINED: { label: t("status.DECLINED"), status: "error" },
	};

	const config = statusConfig[request.status] ?? { label: request.status, status: "info" as const };

	const handleReview = async (status: "APPROVED" | "DECLINED" | "PENDING") => {
		try {
			await reviewRequest.mutateAsync({ id: request.id, status });
			toastSuccess(
				status === "APPROVED"
					? t("notifications.approved")
					: status === "DECLINED"
						? t("notifications.declined")
						: t("notifications.resetPending"),
			);
		} catch {
			toastError(t("notifications.updateError"));
		}
	};

	const total = request.items.reduce((s, i) => s + Number(i.amount) * i.quantity, 0);

	return (
		<div className="rounded-lg border bg-card p-4">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1 space-y-2">
					{/* Title row */}
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-semibold">{request.name}</span>
						<Badge status={config.status}>{config.label}</Badge>
						<span className="text-lg font-bold text-green-600">
							${total.toFixed(2)}
						</span>
					</div>
					{request.description && (
						<p className="text-sm text-muted-foreground">{request.description}</p>
					)}

					{/* Meta row */}
					<div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
						<span>
							<span className="font-medium text-foreground">{t("card.group")} </span>
							{request.group.name}
						</span>
						<span>
							<span className="font-medium text-foreground">{t("card.site")} </span>
							{request.group.site.name}
						</span>
						<span>
							<span className="font-medium text-foreground">{t("card.requestedBy")} </span>
							{request.requestedBy.name}
						</span>
						{request.dueDate && (
							<span>
								<span className="font-medium text-foreground">Needed by: </span>
								{new Date(request.dueDate).toLocaleDateString()}
							</span>
						)}
						<span>
							<span className="font-medium text-foreground">{t("card.date")} </span>
							{new Date(request.createdAt).toLocaleDateString()}
						</span>
					</div>

					{/* Line items */}
					{request.items.length > 0 && (
						<div className="rounded-md bg-muted/40 px-3 py-2 text-sm space-y-1">
							{request.items.map((item) => (
								<div key={item.id} className="flex items-center gap-2">
									<span className="flex-1 font-medium">{item.item}</span>
									<span className="text-muted-foreground text-xs">
										{categoryLabels[item.category] ?? item.category}
									</span>
									<span className="text-muted-foreground">
										{item.quantity} × ${Number(item.amount).toFixed(2)} ={" "}
										<span className="font-medium text-foreground">
											${(Number(item.amount) * item.quantity).toFixed(2)}
										</span>
									</span>
									{item.url && (
										<a
											href={item.url}
											target="_blank"
											rel="noopener noreferrer"
											className="text-primary hover:text-primary/80"
										>
											<ExternalLinkIcon className="h-3.5 w-3.5" />
										</a>
									)}
								</div>
							))}
						</div>
					)}

					{/* Review result */}
					{request.reviewedBy && request.reviewedAt && (
						<div className="flex items-center gap-1.5 border-t pt-2 text-sm text-muted-foreground">
							{request.status === "APPROVED" ? (
								<CheckCircle2Icon className="h-3.5 w-3.5 text-green-600" />
							) : (
								<XCircleIcon className="h-3.5 w-3.5 text-destructive" />
							)}
							<span>
								{config.label} by {request.reviewedBy.name} on{" "}
								{new Date(request.reviewedAt).toLocaleDateString()}
							</span>
							{request.reviewNote && (
								<span className="italic">— {request.reviewNote}</span>
							)}
						</div>
					)}
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="shrink-0 gap-2"
							disabled={reviewRequest.isPending}
						>
							{request.status === "APPROVED" && <CheckCircle2Icon className="size-3.5 text-green-600" />}
							{request.status === "DECLINED" && <XCircleIcon className="size-3.5 text-red-600" />}
							{request.status === "PENDING" && <ClockIcon className="size-3.5 text-yellow-600" />}
							{config.label}
							<ChevronDownIcon className="size-3.5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
							{t("dropdown.setStatus")}
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="gap-2"
							disabled={request.status === "APPROVED"}
							onClick={() => handleReview("APPROVED")}
						>
							<CheckCircle2Icon className="size-4 text-green-600" />
							{t("dropdown.approve")}
							{request.status === "APPROVED" && (
								<span className="ml-auto text-xs text-muted-foreground">{t("dropdown.current")}</span>
							)}
						</DropdownMenuItem>
						<DropdownMenuItem
							className="gap-2"
							disabled={request.status === "DECLINED"}
							onClick={() => handleReview("DECLINED")}
						>
							<XCircleIcon className="size-4 text-red-600" />
							{t("dropdown.decline")}
							{request.status === "DECLINED" && (
								<span className="ml-auto text-xs text-muted-foreground">{t("dropdown.current")}</span>
							)}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="gap-2"
							disabled={request.status === "PENDING"}
							onClick={() => handleReview("PENDING")}
						>
							<ClockIcon className="size-4 text-yellow-600" />
							{t("dropdown.resetToPending")}
							{request.status === "PENDING" && (
								<span className="ml-auto text-xs text-muted-foreground">{t("dropdown.current")}</span>
							)}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
