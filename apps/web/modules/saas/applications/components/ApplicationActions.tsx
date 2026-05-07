"use client";

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
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useReviewApplication } from "@saas/applications/hooks/use-applications";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronDownIcon, ClockIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

type ApplicationChild = { id: string; firstName: string; lastName: string };

// ── Approve Dialog ─────────────────────────────────────────────────────────────

interface ApproveDialogProps {
	applicationId: string;
	siteId: string;
	children: ApplicationChild[];
	onClose: () => void;
}

export function ApproveDialog({ applicationId, siteId, children, onClose }: ApproveDialogProps) {
	const t = useTranslations("launchclub.applications");
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
			toastSuccess(t("notifications.approved"));
			onClose();
		} catch {
			toastError(t("notifications.approveError"));
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("approveDialog.title")}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-2">
					<p className="text-sm text-muted-foreground">
						{t("approveDialog.assignChildren")}
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
									<SelectValue placeholder={t("approveDialog.noGroup")} />
								</SelectTrigger>
								<SelectContent>
									{siteGroups.length === 0 ? (
										<div className="py-2 px-3 text-sm text-muted-foreground">
											{t("approveDialog.noGroupsForSite")}
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
						{t("approveDialog.cancel")}
					</Button>
					<Button
						className="bg-green-600 hover:bg-green-700 text-white"
						onClick={handleApprove}
						disabled={reviewApplication.isPending}
					>
						<CheckIcon className="mr-2 size-4" />
						{t("approveDialog.approve")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ── Status Actions Dropdown ────────────────────────────────────────────────────

interface ApplicationStatusActionsProps {
	applicationId: string;
	siteId: string;
	currentStatus: string;
	children: ApplicationChild[];
}

export function ApplicationStatusActions({
	applicationId,
	siteId,
	currentStatus,
	children,
}: ApplicationStatusActionsProps) {
	const t = useTranslations("launchclub.applications");
	const reviewApplication = useReviewApplication();
	const [approveOpen, setApproveOpen] = useState(false);

	const changeStatus = async (status: "REJECTED" | "PENDING") => {
		try {
			await reviewApplication.mutateAsync({ id: applicationId, status });
			toastSuccess(
				status === "REJECTED"
					? t("notifications.rejected")
					: t("notifications.resetPending"),
			);
		} catch {
			toastError(t("notifications.updateError"));
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="gap-1">
						{t("actions.label")}
						<ChevronDownIcon className="size-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{currentStatus !== "APPROVED" && (
						<DropdownMenuItem
							className="gap-2 text-green-600 focus:text-green-600"
							onClick={() => setApproveOpen(true)}
						>
							<CheckIcon className="size-4" />
							{t("actions.approve")}
						</DropdownMenuItem>
					)}
					{currentStatus !== "REJECTED" && (
						<DropdownMenuItem
							className="gap-2 text-red-600 focus:text-red-600"
							onClick={() => changeStatus("REJECTED")}
						>
							<XIcon className="size-4" />
							{t("actions.reject")}
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
								{t("actions.resetToPending")}
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{approveOpen && (
				<ApproveDialog
					applicationId={applicationId}
					siteId={siteId}
					children={children}
					onClose={() => setApproveOpen(false)}
				/>
			)}
		</>
	);
}
