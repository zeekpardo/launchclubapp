"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle2Icon,
	DollarSignIcon,
	ExternalLinkIcon,
	PencilIcon,
	PlusIcon,
	Trash2Icon,
	XCircleIcon,
} from "lucide-react";
import { useState } from "react";
import {
	useDeletePurchaseRequest,
	usePurchaseRequests,
	type PurchaseRequest,
} from "../../hooks/use-purchase-requests";
import { PurchaseRequestDialog } from "../PurchaseRequestDialog";
import { ReviewDialog } from "@saas/purchase-requests/components/ReviewDialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; status: "success" | "info" | "warning" | "error" }> = {
	PENDING: { label: "Pending", status: "warning" },
	APPROVED: { label: "Approved", status: "success" },
	DECLINED: { label: "Declined", status: "error" },
};

const CATEGORY_LABELS: Record<string, string> = {
	supplies: "Supplies",
	snacks: "Snacks",
	activities: "Activities",
	equipment: "Equipment",
	field_trips: "Field Trips",
	guest_speakers: "Guest Speakers",
	other: "Other",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requestTotal(r: PurchaseRequest): number {
	return r.items.reduce((sum, i) => sum + Number(i.amount) * i.quantity, 0);
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

interface GroupPurchaseRequestsTabProps {
	groupId: string;
}

export function GroupPurchaseRequestsTab({ groupId }: GroupPurchaseRequestsTabProps) {
	const { data: requests, isLoading } = usePurchaseRequests(groupId);
	const deleteRequest = useDeletePurchaseRequest(groupId);
	const { isOrganizationAdmin } = useActiveOrganization();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editRequest, setEditRequest] = useState<PurchaseRequest | null>(null);

	const handleOpenCreate = () => {
		setEditRequest(null);
		setDialogOpen(true);
	};

	const handleOpenEdit = (request: PurchaseRequest) => {
		setEditRequest(request);
		setDialogOpen(true);
	};

	const handleDialogClose = (open: boolean) => {
		setDialogOpen(open);
		if (!open) setEditRequest(null);
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteRequest.mutateAsync({ id });
			toastSuccess("Purchase request deleted.");
		} catch {
			toastError("Failed to delete request. Please try again.");
		}
	};

	const totalPending = requests?.filter((r: PurchaseRequest) => r.status === "PENDING").length ?? 0;
	const totalApproved = requests?.filter((r: PurchaseRequest) => r.status === "APPROVED").length ?? 0;
	const approvedAmount = requests
		?.filter((r: PurchaseRequest) => r.status === "APPROVED")
		.reduce((sum: number, r: PurchaseRequest) => sum + requestTotal(r), 0) ?? 0;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-6 text-sm text-muted-foreground">
					<span>
						<span className="font-semibold text-foreground">{totalPending}</span>{" "}
						pending
					</span>
					<span>
						<span className="font-semibold text-green-600">{totalApproved}</span>{" "}
						approved
					</span>
					<span>
						<span className="font-semibold text-green-600">
							${approvedAmount.toFixed(2)}
						</span>{" "}
						approved total
					</span>
				</div>
				<Button onClick={handleOpenCreate}>
					<PlusIcon className="mr-2 h-4 w-4" />
					New Request
				</Button>
			</div>

			{/* List */}
			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
						<Skeleton key={i} className="h-28 w-full" />
					))}
				</div>
			) : !requests || requests.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
					<DollarSignIcon className="size-8 opacity-40" />
					<p className="text-sm">No purchase requests yet.</p>
					<Button variant="outline" size="sm" onClick={handleOpenCreate}>
						Submit first request
					</Button>
				</div>
			) : (
				<div className="space-y-3">
					{requests.map((request: PurchaseRequest) => (
						<PurchaseRequestCard
							key={request.id}
							groupId={groupId}
							request={request}
							isAdmin={isOrganizationAdmin}
							onEdit={handleOpenEdit}
							onDelete={handleDelete}
						/>
					))}
				</div>
			)}

			<PurchaseRequestDialog
				groupId={groupId}
				open={dialogOpen}
				onOpenChange={handleDialogClose}
				editRequest={editRequest}
			/>
		</div>
	);
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface PurchaseRequestCardProps {
	groupId: string;
	request: PurchaseRequest;
	isAdmin: boolean;
	onEdit: (request: PurchaseRequest) => void;
	onDelete: (id: string) => void;
}

function PurchaseRequestCard({
	groupId,
	request,
	isAdmin,
	onEdit,
	onDelete,
}: PurchaseRequestCardProps) {
	const queryClient = useQueryClient();
	const reviewMutation = useMutation(orpc.purchaseRequests.review.mutationOptions());

	const [reviewDialog, setReviewDialog] = useState<"APPROVED" | "DECLINED" | null>(null);

	const isPending = request.status === "PENDING";
	const statusConfig = STATUS_CONFIG[request.status] ?? { label: request.status, status: "default" as const };
	const total = requestTotal(request);

	const handleReview = async (status: "APPROVED" | "DECLINED", note: string) => {
		try {
			await reviewMutation.mutateAsync({ id: request.id, status, reviewNote: note || undefined });
			queryClient.invalidateQueries(
				orpc.purchaseRequests.list.queryOptions({ input: { groupId } }),
			);
			toastSuccess(status === "APPROVED" ? "Request approved." : "Request declined.");
			setReviewDialog(null);
		} catch {
			toastError("Failed to review request. Please try again.");
		}
	};

	return (
		<div className="rounded-lg border bg-card p-4">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1 space-y-2">
					{/* Title row */}
					<div className="flex flex-wrap items-center gap-2">
						<span className="font-semibold">{request.name}</span>
						<Badge status={statusConfig.status}>{statusConfig.label}</Badge>
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
							<span className="font-medium text-foreground">By: </span>
							{request.requestedBy.name}
						</span>
						{request.dueDate && (
							<span>
								<span className="font-medium text-foreground">Needed by: </span>
								{new Date(request.dueDate).toLocaleDateString()}
							</span>
						)}
						<span>
							<span className="font-medium text-foreground">Submitted: </span>
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
										{CATEGORY_LABELS[item.category] ?? item.category}
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
								{statusConfig.label} by {request.reviewedBy.name} on{" "}
								{new Date(request.reviewedAt).toLocaleDateString()}
							</span>
							{request.reviewNote && (
								<span className="italic">— {request.reviewNote}</span>
							)}
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="flex shrink-0 items-center gap-1">
					{isPending && isAdmin && (
						<>
							<Button
								size="sm"
								variant="outline"
								className="h-8 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
								onClick={() => setReviewDialog("APPROVED")}
							>
								Approve
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="h-8 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
								onClick={() => setReviewDialog("DECLINED")}
							>
								Decline
							</Button>
						</>
					)}
					<Button
						size="icon"
						variant="ghost"
						className="h-8 w-8"
						onClick={() => onEdit(request)}
					>
						<PencilIcon className="h-4 w-4" />
					</Button>
					{isPending && (
						<Button
							size="icon"
							variant="ghost"
							className="h-8 w-8 text-destructive hover:text-destructive"
							onClick={() => onDelete(request.id)}
						>
							<Trash2Icon className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>

			{reviewDialog && (
				<ReviewDialog
					open={!!reviewDialog}
					status={reviewDialog}
					loading={reviewMutation.isPending}
					onOpenChange={(open) => { if (!open) setReviewDialog(null); }}
					onConfirm={(note) => handleReview(reviewDialog, note)}
				/>
			)}
		</div>
	);
}
