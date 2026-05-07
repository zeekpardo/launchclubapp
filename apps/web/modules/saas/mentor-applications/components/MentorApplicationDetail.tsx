"use client";

import type { ReactNode } from "react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
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
	useMentorApplication,
	useReviewMentorApplication,
} from "@saas/mentor-applications/hooks/use-mentor-applications";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeftIcon,
	CheckIcon,
	ChevronDownIcon,
	ClockIcon,
	FileTextIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface MentorApplicationDetailProps {
	applicationId: string;
}

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
			toastSuccess("Mentor approved. A login link has been sent to their email.");
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
						The mentor will be added as a group leader and sent a login link.
						Optionally assign them to a group now.
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
						Approve & Send Invite
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MentorApplicationDetail({
	applicationId,
}: MentorApplicationDetailProps) {
	const { data: application, isLoading } = useMentorApplication(applicationId);
	const reviewApplication = useReviewMentorApplication();
	const [approveDialogOpen, setApproveDialogOpen] = useState(false);

	const handleStatusChange = async (status: "REJECTED" | "PENDING") => {
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

	if (isLoading) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-6 w-24" />
				<Card>
					<CardContent className="pt-6 space-y-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="space-y-1">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-5 w-48" />
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!application) {
		return (
			<div className="text-muted-foreground">Application not found.</div>
		);
	}

	const statusBadge = () => {
		if (application.status === "APPROVED")
			return <Badge status="success">Approved</Badge>;
		if (application.status === "REJECTED")
			return <Badge status="error">Rejected</Badge>;
		return <Badge status="warning">Pending</Badge>;
	};

	return (
		<div className="space-y-6">
			<Link
				href="../mentor-applications"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeftIcon className="size-4" />
				All mentor applications
			</Link>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>
						{application.firstName} {application.lastName}
					</CardTitle>
					{statusBadge()}
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<DetailRow label="Email" value={application.email} />
						<DetailRow label="Phone" value={application.phone ?? "—"} />
						<DetailRow
							label="Site"
							value={application.site?.name ?? "—"}
						/>
						<DetailRow
							label="Organization"
							value={application.organization?.name ?? "—"}
						/>
						<DetailRow
							label="Submitted"
							value={new Date(application.createdAt).toLocaleDateString()}
						/>
						<DetailRow label="Status" value={statusBadge()} />
					</div>

					{(application.addressLine1 ||
						application.city ||
						application.stateProvince) && (
						<div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
							<p className="col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Address
							</p>
							{application.addressLine1 && (
								<DetailRow
									label="Street"
									value={application.addressLine1}
								/>
							)}
							{application.city && (
								<DetailRow label="City" value={application.city} />
							)}
							{application.stateProvince && (
								<DetailRow
									label="State / Province"
									value={application.stateProvince}
								/>
							)}
							{application.postalCode && (
								<DetailRow
									label="Postal Code"
									value={application.postalCode}
								/>
							)}
							{application.country && (
								<DetailRow label="Country" value={application.country} />
							)}
						</div>
					)}

					{(application.mentorContractFileUrl ||
						application.mentorSecurityClearanceFileUrl) && (
						<div className="pt-2 border-t space-y-3">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Signed Documents
							</p>
							<div className="flex flex-wrap gap-4">
								{application.mentorContractFileUrl && (
									<div className="flex items-center gap-1.5 text-sm text-primary">
										<FileTextIcon className="size-4" />
										<span className="font-medium">Mentor Contract</span>
										<span className="text-xs text-muted-foreground">
											(uploaded)
										</span>
									</div>
								)}
								{application.mentorSecurityClearanceFileUrl && (
									<div className="flex items-center gap-1.5 text-sm text-primary">
										<FileTextIcon className="size-4" />
										<span className="font-medium">Security Clearance</span>
										<span className="text-xs text-muted-foreground">
											(uploaded)
										</span>
									</div>
								)}
							</div>
						</div>
					)}

					{application.formFieldValues &&
						application.formFieldValues.length > 0 && (
							<div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
								<p className="col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Form Responses
								</p>
								{application.formFieldValues
									.filter((ffv) => ffv.formField.type !== "HEADER")
									.map((ffv) => (
										<DetailRow
											key={ffv.id}
											label={ffv.formField.label}
											value={ffv.value}
										/>
									))}
							</div>
						)}

					<div className="flex items-center gap-3 pt-4 border-t">
						<span className="text-sm text-muted-foreground">
							Change status:
						</span>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="gap-2"
									disabled={reviewApplication.isPending}
								>
									{application.status === "APPROVED" && (
										<CheckIcon className="size-3.5 text-green-600" />
									)}
									{application.status === "REJECTED" && (
										<XIcon className="size-3.5 text-red-600" />
									)}
									{application.status === "PENDING" && (
										<ClockIcon className="size-3.5 text-yellow-600" />
									)}
									{application.status === "APPROVED"
										? "Approved"
										: application.status === "REJECTED"
											? "Rejected"
											: "Pending"}
									<ChevronDownIcon className="size-3.5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start">
								<DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
									Set status
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="gap-2"
									disabled={application.status === "APPROVED"}
									onClick={() => setApproveDialogOpen(true)}
								>
									<CheckIcon className="size-4 text-green-600" />
									Approve
									{application.status === "APPROVED" && (
										<span className="ml-auto text-xs text-muted-foreground">
											current
										</span>
									)}
								</DropdownMenuItem>
								<DropdownMenuItem
									className="gap-2"
									disabled={application.status === "REJECTED"}
									onClick={() => handleStatusChange("REJECTED")}
								>
									<XIcon className="size-4 text-red-600" />
									Reject
									{application.status === "REJECTED" && (
										<span className="ml-auto text-xs text-muted-foreground">
											current
										</span>
									)}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="gap-2"
									disabled={application.status === "PENDING"}
									onClick={() => handleStatusChange("PENDING")}
								>
									<ClockIcon className="size-4 text-yellow-600" />
									Reset to Pending
									{application.status === "PENDING" && (
										<span className="ml-auto text-xs text-muted-foreground">
											current
										</span>
									)}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardContent>
			</Card>

			{approveDialogOpen && (
				<ApproveDialog
					applicationId={applicationId}
					siteId={application.siteId ?? ""}
					onClose={() => setApproveDialogOpen(false)}
				/>
			)}
		</div>
	);
}

function DetailRow({
	label,
	value,
}: {
	label: string;
	value: string | ReactNode;
}) {
	return (
		<div>
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<div className="mt-1 text-sm">{value}</div>
		</div>
	);
}
