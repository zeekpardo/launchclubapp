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
	useApplications,
	useReviewApplication,
} from "@saas/applications/hooks/use-applications";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
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

const ALL = "__all__";
type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

interface AreaSubmissionsTabProps {
	areaId: string;
}

// ── Approve Dialog ──────────────────────────────────────────────────────────

function ApproveDialog({
	applicationId,
	siteId,
	children,
	onClose,
}: {
	applicationId: string;
	siteId: string;
	children: { id: string; firstName: string; lastName: string }[];
	onClose: () => void;
}) {
	const { activeOrganization } = useActiveOrganization();
	const reviewApplication = useReviewApplication();
	const [groupSelections, setGroupSelections] = useState<
		Record<string, string>
	>({});

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
			const groupAssignments = Object.entries(groupSelections)
				.filter(([, groupId]) => !!groupId)
				.map(([applicationChildId, groupId]) => ({
					applicationChildId,
					groupId,
				}));

			await reviewApplication.mutateAsync({
				id: applicationId,
				status: "APPROVED",
				groupAssignments:
					groupAssignments.length > 0 ? groupAssignments : undefined,
			});
			toastSuccess("Application approved.");
			onClose();
		} catch {
			toastError("Failed to approve application.");
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Approve Application</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<p className="text-sm text-muted-foreground">
						Optionally assign each child to a group. You can skip
						any or all and assign later.
					</p>
					{children.map((child) => (
						<div key={child.id} className="space-y-1.5">
							<p className="text-sm font-medium">
								{child.firstName} {child.lastName}
							</p>
							<Select
								value={groupSelections[child.id] ?? ""}
								onValueChange={(val) =>
									setGroupSelections((prev) => ({
										...prev,
										[child.id]: val,
									}))
								}
							>
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
					))}
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

// ── Row actions ─────────────────────────────────────────────────────────────

function RowActions({
	applicationId,
	siteId,
	status,
	onApprove,
}: {
	applicationId: string;
	siteId: string;
	status: string;
	onApprove: () => void;
}) {
	const reviewApplication = useReviewApplication();

	const changeStatus = async (s: "REJECTED" | "PENDING") => {
		try {
			await reviewApplication.mutateAsync({
				id: applicationId,
				status: s,
			});
			toastSuccess(
				s === "REJECTED"
					? "Application rejected."
					: "Reset to pending.",
			);
		} catch {
			toastError("Failed to update application.");
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm" className="gap-1">
					Actions <ChevronDownIcon className="size-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{status !== "APPROVED" && (
					<DropdownMenuItem
						className="gap-2 text-green-600 focus:text-green-600"
						onClick={onApprove}
					>
						<CheckIcon className="size-4" /> Approve
					</DropdownMenuItem>
				)}
				{status !== "REJECTED" && (
					<DropdownMenuItem
						className="gap-2 text-red-600 focus:text-red-600"
						onClick={() => changeStatus("REJECTED")}
					>
						<XIcon className="size-4" /> Reject
					</DropdownMenuItem>
				)}
				{status !== "PENDING" && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="gap-2"
							onClick={() => changeStatus("PENDING")}
						>
							<ClockIcon className="size-4" /> Reset to Pending
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
	if (status === "APPROVED") return <Badge status="success">Approved</Badge>;
	if (status === "REJECTED") return <Badge status="error">Rejected</Badge>;
	return <Badge status="warning">Pending</Badge>;
}

// ── Main tab ─────────────────────────────────────────────────────────────────

export function AreaSubmissionsTab({ areaId }: AreaSubmissionsTabProps) {
	const params = useParams<{ organizationSlug: string }>();
	const orgSlug = params.organizationSlug;

	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const [selectedSiteId, setSelectedSiteId] = useState(ALL);
	const [approveTarget, setApproveTarget] = useState<{
		id: string;
		siteId: string;
		children: { id: string; firstName: string; lastName: string }[];
	} | null>(null);

	const queryStatus =
		statusFilter === "ALL"
			? undefined
			: (statusFilter as "PENDING" | "APPROVED" | "REJECTED");
	const { data: applications = [], isLoading } = useApplications(queryStatus);

	// Sites within this area for the filter dropdown
	const areaSites = useMemo(
		() => [
			...new Map(
				(applications as typeof applications)
					.filter((a) => a.site?.area?.id === areaId && a.site)
					.map((a) => [a.site!.id, a.site!]),
			).values(),
		],
		[applications, areaId],
	);

	const filtered = useMemo(() => {
		let list = applications.filter((a) => a.site?.area?.id === areaId);
		if (selectedSiteId !== ALL) {
			list = list.filter((a) => a.site?.id === selectedSiteId);
		}
		return list;
	}, [applications, areaId, selectedSiteId]);

	return (
		<div className="space-y-4">
			<div>
				<h3 className="font-semibold text-sm">Submissions</h3>
				<p className="text-xs text-muted-foreground mt-0.5">
					All applications submitted across sites in this area.
				</p>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="inline-flex rounded-lg border bg-muted p-1">
					<button
						key="ALL"
						type="button"
						onClick={() => setStatusFilter("ALL")}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === "ALL" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
					>
						All
					</button>
					<button
						key="PENDING"
						type="button"
						onClick={() => setStatusFilter("PENDING")}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === "PENDING" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
					>
						Pending
					</button>
					<button
						key="APPROVED"
						type="button"
						onClick={() => setStatusFilter("APPROVED")}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === "APPROVED" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
					>
						Approved
					</button>
					<button
						key="REJECTED"
						type="button"
						onClick={() => setStatusFilter("REJECTED")}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${statusFilter === "REJECTED" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
					>
						Rejected
					</button>
				</div>

				{areaSites.length > 1 && (
					<Select
						value={selectedSiteId}
						onValueChange={setSelectedSiteId}
					>
						<SelectTrigger className="w-40">
							<SelectValue placeholder="All Sites" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>All Sites</SelectItem>
							{areaSites.map((s) => (
								<SelectItem key={s.id} value={s.id}>
									{s.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>

			{/* Table */}
			<div className="overflow-x-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Applicant</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Children</TableHead>
							<TableHead>Site</TableHead>
							<TableHead>Submitted</TableHead>
							<TableHead>Status</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 4 }).map((_, i) => (
								<TableRow key={i}>
									{Array.from({ length: 7 }).map((__, j) => (
										<TableCell key={j}>
											<Skeleton className="h-4 w-full" />
										</TableCell>
									))}
								</TableRow>
							))
						) : filtered.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="py-10 text-center text-sm text-muted-foreground"
								>
									No submissions yet.
								</TableCell>
							</TableRow>
						) : (
							filtered.map((app) => (
								<TableRow key={app.id}>
									<TableCell className="font-medium">
										<Link
											href={`/app/${orgSlug}/applications/${app.id}`}
											className="hover:underline flex items-center gap-1"
										>
											{app.parentFirstName}{" "}
											{app.parentLastName}
											<ExternalLinkIcon className="size-3 text-muted-foreground" />
										</Link>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{app.parentEmail ?? "—"}
									</TableCell>
									<TableCell>
										{app.children?.length ?? 0}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{app.site?.name ?? "—"}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{new Date(
											app.createdAt,
										).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<StatusBadge status={app.status} />
									</TableCell>
									<TableCell>
										<RowActions
											applicationId={app.id}
											siteId={app.site?.id ?? ""}
											status={app.status}
											onApprove={() =>
												setApproveTarget({
													id: app.id,
													siteId: app.site?.id ?? "",
													children:
														app.children ?? [],
												})
											}
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{approveTarget && (
				<ApproveDialog
					applicationId={approveTarget.id}
					siteId={approveTarget.siteId}
					children={approveTarget.children}
					onClose={() => setApproveTarget(null)}
				/>
			)}
		</div>
	);
}
