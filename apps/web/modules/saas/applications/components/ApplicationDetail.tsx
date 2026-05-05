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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	useApplication,
	useReviewApplication,
} from "@saas/applications/hooks/use-applications";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { ArrowLeftIcon, CheckCircle2Icon, CheckIcon, ChevronDownIcon, ClockIcon, XCircleIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

interface ApplicationDetailProps {
	applicationId: string;
}

// ── Approve Dialog ─────────────────────────────────────────────────────────────

interface ApproveDialogProps {
	applicationId: string;
	siteId: string;
	children: { id: string; firstName: string; lastName: string }[];
	onClose: () => void;
}

function ApproveDialog({ applicationId, siteId, children, onClose }: ApproveDialogProps) {
	const { activeOrganization } = useActiveOrganization();
	const reviewApplication = useReviewApplication();
	const [groupSelections, setGroupSelections] = useState<Record<string, string>>({});

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
				.map(([applicationChildId, groupId]) => ({ applicationChildId, groupId }));

			await reviewApplication.mutateAsync({
				id: applicationId,
				status: "APPROVED",
				groupAssignments: groupAssignments.length > 0 ? groupAssignments : undefined,
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
						Optionally assign each child to a group. You can skip any or all and assign later.
					</p>

					{children.map((child) => (
						<div key={child.id} className="space-y-1.5">
							<p className="text-sm font-medium">
								{child.firstName} {child.lastName}
							</p>
							<Select
								value={groupSelections[child.id] ?? ""}
								onValueChange={(val) =>
									setGroupSelections((prev) => ({ ...prev, [child.id]: val }))
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

// ── Main component ─────────────────────────────────────────────────────────────

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
	const t = useTranslations();
	const { data: application, isLoading } = useApplication(applicationId);
	const reviewApplication = useReviewApplication();
	const [approveDialogOpen, setApproveDialogOpen] = useState(false);

	const handleStatusChange = async (status: "REJECTED" | "PENDING") => {
		try {
			await reviewApplication.mutateAsync({ id: applicationId, status });
			toastSuccess(
				status === "REJECTED"
					? t("launchclub.applications.notifications.rejected")
					: "Application reset to pending.",
			);
		} catch {
			toastError(t("launchclub.applications.notifications.error"));
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
		if (application.status === "APPROVED") {
			return (
				<Badge status="success">
					{t("launchclub.applications.status.APPROVED")}
				</Badge>
			);
		}
		if (application.status === "REJECTED") {
			return (
				<Badge status="error">
					{t("launchclub.applications.status.REJECTED")}
				</Badge>
			);
		}
		return (
			<Badge status="warning">
				{t("launchclub.applications.status.PENDING")}
			</Badge>
		);
	};

	return (
		<div className="space-y-6">
			<Link
				href="../applications"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeftIcon className="size-4" />
				{t("launchclub.applications.viewAll")}
			</Link>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>
						{application.parentFirstName} {application.parentLastName}
					</CardTitle>
					{statusBadge()}
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<DetailRow
							label={t("launchclub.applications.columns.email")}
							value={application.parentEmail ?? "—"}
						/>
						<DetailRow
							label={t("launchclub.applications.columns.phone")}
							value={application.parentPhone ?? "—"}
						/>
						<DetailRow
							label={t("launchclub.applications.columns.site")}
							value={application.site?.name ?? "—"}
						/>
						<DetailRow
							label="Area"
							value={application.site?.area?.name ?? "—"}
						/>
						<DetailRow
							label={t("launchclub.applications.columns.submitted")}
							value={new Date(application.createdAt).toLocaleDateString()}
						/>
						<DetailRow
							label={t("launchclub.applications.columns.status")}
							value={statusBadge()}
						/>
					</div>

					{application.children && application.children.length > 0 && (
						<div className="pt-2 border-t space-y-3">
							<p className="text-sm font-medium text-muted-foreground">
								Children
							</p>
							{application.children.map((child) => (
								<div key={child.id} className="rounded-lg border bg-muted/30 p-3 space-y-3">
									{/* Name + grade */}
									<div className="flex items-center justify-between gap-2">
										<p className="text-sm font-medium">
											{child.firstName} {child.lastName}
										</p>
										{child.grade && (
											<Badge className="text-xs">{child.grade}</Badge>
										)}
									</div>

									{/* Core fields */}
									<div className="grid grid-cols-2 gap-x-4 gap-y-2">
										{child.birthday && (
											<DetailRow
												label="Date of Birth"
												value={new Date(child.birthday).toLocaleDateString()}
											/>
										)}
										<DetailRow
											label="Part of Church"
											value={child.isPartOfChurch ? "Yes" : "No"}
										/>
									</div>

									{/* Emergency contact */}
									{(child.emergencyContactName || child.emergencyContactPhone) && (
										<div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t">
											<p className="col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
												Emergency Contact
											</p>
											{child.emergencyContactName && (
												<DetailRow label="Name" value={child.emergencyContactName} />
											)}
											{child.emergencyContactPhone && (
												<DetailRow label="Phone" value={child.emergencyContactPhone} />
											)}
											{child.emergencyContactEmail && (
												<DetailRow label="Email" value={child.emergencyContactEmail} />
											)}
										</div>
									)}

									{/* Consents */}
									<div className="pt-2 border-t">
										<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
											Consents
										</p>
										<div className="flex flex-wrap gap-3">
											<ConsentBadge label="Observation" granted={child.observationConsent} />
											<ConsentBadge label="Terms & Conditions" granted={child.termsConsent} />
											<ConsentBadge label="Photo / Video" granted={child.photoVideoConsent} />
										</div>
									</div>

									{/* Profile field values */}
									{child.profileFieldValues && child.profileFieldValues.length > 0 && (
										<div className="pt-2 border-t grid grid-cols-2 gap-x-4 gap-y-2">
											<p className="col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
												Profile Fields
											</p>
											{child.profileFieldValues.map((pfv) => (
												<DetailRow
													key={pfv.id}
													label={pfv.customField.name}
													value={pfv.value ?? "—"}
												/>
											))}
										</div>
									)}

									{/* Custom form field values */}
									{child.formFieldValues && child.formFieldValues.length > 0 && (
										<div className="pt-2 border-t grid grid-cols-2 gap-x-4 gap-y-2">
											<p className="col-span-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
												Form Responses
											</p>
											{child.formFieldValues.filter((ffv) => ffv.formField.type !== "HEADER").map((ffv) => (
												<DetailRow
													key={ffv.id}
													label={ffv.formField.label}
													value={ffv.value}
												/>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					)}

					{/* Status actions */}
					<div className="flex items-center gap-3 pt-4 border-t">
						<span className="text-sm text-muted-foreground">Change status:</span>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="gap-2"
									disabled={reviewApplication.isPending}
								>
									{application.status === "APPROVED" && <CheckIcon className="size-3.5 text-green-600" />}
									{application.status === "REJECTED" && <XIcon className="size-3.5 text-red-600" />}
									{application.status === "PENDING" && <ClockIcon className="size-3.5 text-yellow-600" />}
									{application.status === "APPROVED" ? "Approved" : application.status === "REJECTED" ? "Declined" : "Pending"}
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
										<span className="ml-auto text-xs text-muted-foreground">current</span>
									)}
								</DropdownMenuItem>
								<DropdownMenuItem
									className="gap-2"
									disabled={application.status === "REJECTED"}
									onClick={() => handleStatusChange("REJECTED")}
								>
									<XIcon className="size-4 text-red-600" />
									Decline
									{application.status === "REJECTED" && (
										<span className="ml-auto text-xs text-muted-foreground">current</span>
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
										<span className="ml-auto text-xs text-muted-foreground">current</span>
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
					siteId={application.siteId}
					children={application.children ?? []}
					onClose={() => setApproveDialogOpen(false)}
				/>
			)}
		</div>
	);
}

function ConsentBadge({ label, granted }: { label: string; granted: boolean }) {
	return (
		<div className={`flex items-center gap-1.5 text-xs font-medium ${granted ? "text-green-600" : "text-destructive"}`}>
			{granted
				? <CheckCircle2Icon className="size-3.5 shrink-0" />
				: <XCircleIcon className="size-3.5 shrink-0" />}
			{label}
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
