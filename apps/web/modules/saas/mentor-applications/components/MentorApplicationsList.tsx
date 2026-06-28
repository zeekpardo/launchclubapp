"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	useMentorApplications,
	useReviewMentorApplication,
} from "@saas/mentor-applications/hooks/use-mentor-applications";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { SearchInput } from "@shared/components/SearchInput";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	CheckIcon,
	ChevronDownIcon,
	ClockIcon,
	ExternalLinkIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
const ALL = "__all__";

// ── Approve Dialog ─────────────────────────────────────────────────────────────

interface ApproveDialogProps {
	applicationId: string;
	siteId: string;
	onClose: () => void;
}

function ApproveDialog({ applicationId, siteId, onClose }: ApproveDialogProps) {
	const { activeOrganization } = useActiveOrganization();
	const reviewApplication = useReviewMentorApplication();
	const [groupId, setGroupId] = useState("");

	const { data: groups } = useQuery(
		orpc.groups.list.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
			enabled: !!activeOrganization?.id,
		}),
	);

	const siteGroups = useMemo(
		() => (groups ?? []).filter((g) => g.site.id === siteId),
		[groups, siteId],
	);

	const handleApprove = async () => {
		try {
			await reviewApplication.mutateAsync({
				id: applicationId,
				status: "APPROVED",
				assignedGroupId: groupId || undefined,
			});
			toastSuccess("Mentor application approved.");
			onClose();
		} catch {
			toastError("Failed to approve application.");
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Approve Mentor Application</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<p className="text-sm text-muted-foreground">
						Optionally assign the mentor to a group. You can skip
						and assign later.
					</p>
					<Select value={groupId} onValueChange={setGroupId}>
						<SelectTrigger>
							<SelectValue placeholder="No group (assign later)" />
						</SelectTrigger>
						<SelectContent>
							{siteGroups.length === 0 ? (
								<div className="py-2 px-3 text-sm text-muted-foreground">
									No groups for this site.
								</div>
							) : (
								siteGroups.map((g) => (
									<SelectItem key={g.id} value={g.id}>
										{g.name}
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						className="bg-green-600 hover:bg-green-700 text-white"
						onClick={handleApprove}
						disabled={reviewApplication.isPending}
					>
						<CheckIcon className="mr-2 size-4" />
						Approve
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ── Status Actions ─────────────────────────────────────────────────────────────

interface StatusActionsProps {
	applicationId: string;
	siteId: string;
	currentStatus: string;
	onApprove: (id: string, siteId: string) => void;
}

function StatusActions({
	applicationId,
	siteId,
	currentStatus,
	onApprove,
}: StatusActionsProps) {
	const reviewApplication = useReviewMentorApplication();

	const changeStatus = async (status: "REJECTED" | "PENDING") => {
		try {
			await reviewApplication.mutateAsync({ id: applicationId, status });
			toastSuccess(
				status === "REJECTED"
					? "Application rejected."
					: "Application reset to pending.",
			);
		} catch {
			toastError("Failed to update status.");
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="gap-1">
					Actions
					<ChevronDownIcon className="size-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{currentStatus !== "APPROVED" && (
					<DropdownMenuItem
						className="gap-2 text-green-600 focus:text-green-600"
						onClick={() => onApprove(applicationId, siteId)}
					>
						<CheckIcon className="size-4" />
						Approve
					</DropdownMenuItem>
				)}
				{currentStatus !== "REJECTED" && (
					<DropdownMenuItem
						className="gap-2 text-red-600 focus:text-red-600"
						onClick={() => changeStatus("REJECTED")}
					>
						<XIcon className="size-4" />
						Reject
					</DropdownMenuItem>
				)}
				{currentStatus !== "PENDING" && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="gap-2"
							onClick={() => changeStatus("PENDING")}
						>
							<ClockIcon className="size-4" />
							Reset to Pending
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MentorApplicationsList() {
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const params = useParams<{ organizationSlug: string }>();
	const orgSlug = params.organizationSlug;

	const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
	const [selectedSiteId, setSelectedSiteId] = useState<string>(ALL);
	const [search, setSearch] = useState("");
	const [approveTarget, setApproveTarget] = useState<{
		id: string;
		siteId: string;
	} | null>(null);

	const queryStatus =
		statusFilter === "ALL"
			? undefined
			: (statusFilter as "PENDING" | "APPROVED" | "REJECTED");

	const { data: applications, isLoading } =
		useMentorApplications(queryStatus);

	const { data: sites } = useQuery(
		orpc.sites.list.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);

	const filteredApplications = useMemo(() => {
		let list = applications ?? [];
		if (selectedSiteId !== ALL) {
			list = list.filter((a) => a.siteId === selectedSiteId);
		}
		if (search.trim()) {
			const q = search.toLowerCase();
			list = list.filter(
				(a) =>
					`${a.firstName} ${a.lastName}`.toLowerCase().includes(q) ||
					a.email.toLowerCase().includes(q),
			);
		}
		return list;
	}, [applications, selectedSiteId, search]);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-3">
				<Select
					value={selectedSiteId}
					onValueChange={setSelectedSiteId}
				>
					<SelectTrigger className="w-44">
						<SelectValue placeholder="All sites" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL}>All sites</SelectItem>
						{(sites ?? []).map((site) => (
							<SelectItem key={site.id} value={site.id}>
								{site.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<SearchInput
					value={search}
					onChange={setSearch}
					placeholder="Search by name or email…"
					className="w-64"
				/>
			</div>

			<div className="inline-flex rounded-lg border bg-muted p-1">
				{(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(
					(s) => (
						<button
							key={s}
							type="button"
							onClick={() => setStatusFilter(s)}
							className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
						>
							{s === "ALL"
								? "All"
								: s.charAt(0) + s.slice(1).toLowerCase()}
						</button>
					),
				)}
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Site</TableHead>
							<TableHead>Submitted</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<TableRow key={i}>
									<TableCell>
										<Skeleton className="h-4 w-32" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-40" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-28" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-24" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-20 rounded-full" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-8 w-20" />
									</TableCell>
								</TableRow>
							))
						) : filteredApplications.length > 0 ? (
							filteredApplications.map((app) => (
								<TableRow key={app.id}>
									<TableCell className="font-medium">
										<Link
											href={`/app/${orgSlug}/mentor-applications/${app.id}`}
											className="hover:underline inline-flex items-center gap-1"
										>
											{app.firstName} {app.lastName}
											<ExternalLinkIcon className="size-3 text-muted-foreground" />
										</Link>
									</TableCell>
									<TableCell>{app.email}</TableCell>
									<TableCell>{app.phone ?? "—"}</TableCell>
									<TableCell>
										{app.site?.name ?? "—"}
									</TableCell>
									<TableCell>
										{new Date(
											app.createdAt,
										).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<StatusBadge status={app.status} />
									</TableCell>
									<TableCell>
										<StatusActions
											applicationId={app.id}
											siteId={app.siteId ?? ""}
											currentStatus={app.status}
											onApprove={(id, siteId) =>
												setApproveTarget({ id, siteId })
											}
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
									No applications found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{approveTarget && (
				<ApproveDialog
					applicationId={approveTarget.id}
					siteId={approveTarget.siteId}
					onClose={() => setApproveTarget(null)}
				/>
			)}
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	if (status === "APPROVED") {
		return <Badge status="success">Approved</Badge>;
	}
	if (status === "REJECTED") {
		return <Badge status="error">Rejected</Badge>;
	}
	return <Badge status="warning">Pending</Badge>;
}
