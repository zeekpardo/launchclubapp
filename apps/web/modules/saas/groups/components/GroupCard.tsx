"use client";

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
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useDeleteGroup } from "@saas/groups/hooks/use-groups";
import { CalendarIcon, PencilIcon, TrashIcon } from "lucide-react";
import { formatMeetingDays } from "@saas/groups/lib/day-utils";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { GroupDialog } from "./GroupDialog";

interface GroupCardProps {
	group: {
		id: string;
		name: string;
		siteId: string;
		description?: string | null;
		meetingDay?: string | null;
		meetingTime?: string | null;
		site?: { name: string } | null;
		_count?: { personGroups: number };
	};
	organizationId: string;
	organizationSlug: string;
}

export function GroupCard({
	group,
	organizationId,
	organizationSlug,
}: GroupCardProps) {
	const t = useTranslations();
	const locale = useLocale();
	const deleteGroup = useDeleteGroup();
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteGroup.mutateAsync({ id: group.id });
			toastSuccess(t("launchclub.groups.form.notifications.deleted"));
		} catch {
			toastError(t("launchclub.groups.form.notifications.error"));
		}
		setDeleteOpen(false);
	};

	const memberCount = group._count?.personGroups ?? 0;

	return (
		<>
			<Card className="relative flex flex-col gap-3 p-4">
				<Link
					href={`/app/${organizationSlug}/groups/${group.id}`}
					className="absolute inset-0 rounded-[inherit]"
					aria-label={group.name}
				/>

				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<p className="truncate font-semibold">{group.name}</p>
						{group.site && (
							<p className="truncate text-muted-foreground text-sm">
								{group.site.name}
							</p>
						)}
					</div>
					<Badge>
						{t("launchclub.groups.membersCount", {
							count: memberCount,
						})}
					</Badge>
				</div>

				{(group.meetingDay || group.meetingTime) && (
					<div className="flex items-center gap-1.5 text-muted-foreground text-sm">
						<CalendarIcon className="size-3.5 shrink-0" />
						<span>
							{[formatMeetingDays(group.meetingDay, locale, ""), group.meetingTime]
								.filter(Boolean)
								.join(" · ")}
						</span>
					</div>
				)}

				<div className="relative z-10 flex items-center justify-end gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="size-8"
						onClick={(e) => {
							e.preventDefault();
							setEditOpen(true);
						}}
					>
						<PencilIcon className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-8 text-destructive hover:text-destructive"
						onClick={(e) => {
							e.preventDefault();
							setDeleteOpen(true);
						}}
					>
						<TrashIcon className="size-4" />
					</Button>
				</div>
			</Card>

			<GroupDialog
				open={editOpen}
				onOpenChange={setEditOpen}
				group={group}
				organizationId={organizationId}
			/>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("launchclub.groups.confirmDelete.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("launchclub.groups.confirmDelete.message")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("launchclub.groups.confirmDelete.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
