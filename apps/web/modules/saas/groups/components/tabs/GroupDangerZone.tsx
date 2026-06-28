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
import { Button } from "@repo/ui/components/button";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useDeleteGroup } from "@saas/groups/hooks/use-groups";
import { TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface GroupDangerZoneProps {
	groupId: string;
}

export function GroupDangerZone({ groupId }: GroupDangerZoneProps) {
	const t = useTranslations();
	const deleteGroup = useDeleteGroup();
	const [open, setOpen] = useState(false);

	const handleDelete = async () => {
		try {
			await deleteGroup.mutateAsync({ id: groupId });
			toastSuccess(t("launchclub.groups.form.notifications.deleted"));
		} catch {
			toastError(t("launchclub.groups.form.notifications.error"));
		}
		setOpen(false);
	};

	return (
		<>
			<div className="rounded-lg border border-destructive/40 p-4">
				<h3 className="mb-4 font-semibold text-destructive text-lg">
					Danger Zone
				</h3>
				<div className="flex items-center justify-between">
					<div>
						<p className="font-medium text-sm">
							{t("launchclub.groups.delete")}
						</p>
						<p className="text-muted-foreground text-sm">
							{t("launchclub.groups.confirmDelete.message")}
						</p>
					</div>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => setOpen(true)}
					>
						<TrashIcon className="mr-2 h-4 w-4" />
						{t("launchclub.groups.delete")}
					</Button>
				</div>
			</div>

			<AlertDialog open={open} onOpenChange={setOpen}>
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
