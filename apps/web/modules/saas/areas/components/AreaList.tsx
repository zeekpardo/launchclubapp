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
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { AreaDialog } from "@saas/areas/components/AreaDialog";
import { useAreas, useDeleteArea } from "@saas/areas/hooks/use-areas";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { PencilIcon, PlusCircleIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface EditingArea {
	id: string;
	name: string;
	description?: string | null;
}

export function AreaList() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const { data: areas, isLoading } = useAreas();
	const deleteArea = useDeleteArea();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingArea, setEditingArea] = useState<EditingArea | undefined>(
		undefined,
	);
	const [deletingAreaId, setDeletingAreaId] = useState<string | undefined>(
		undefined,
	);

	const organizationId = activeOrganization?.id ?? "";

	const handleEdit = (area: EditingArea) => {
		setEditingArea(area);
		setDialogOpen(true);
	};

	const handleNewArea = () => {
		setEditingArea(undefined);
		setDialogOpen(true);
	};

	const handleDialogOpenChange = (open: boolean) => {
		setDialogOpen(open);
		if (!open) {
			setEditingArea(undefined);
		}
	};

	const handleDelete = async () => {
		if (!deletingAreaId) return;
		try {
			await deleteArea.mutateAsync({ id: deletingAreaId });
			toastSuccess(t("launchclub.areas.form.notifications.deleted"));
		} catch {
			toastError(t("launchclub.areas.form.notifications.error"));
		} finally {
			setDeletingAreaId(undefined);
		}
	};

	if (isLoading) {
		return (
			<div className="@container">
				<div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-32 w-full rounded-xl" />
					))}
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mb-4">
				<Button
					variant="primary"
					onClick={handleNewArea}
					className="gap-2"
				>
					<PlusCircleIcon className="size-4" />
					{t("launchclub.areas.new")}
				</Button>
			</div>

			<div className="@container">
				<div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4">
					{areas?.map((area) => (
						<Card key={area.id} className="relative p-4">
							<div className="absolute top-3 right-3 flex gap-1">
								<Button
									variant="ghost"
									size="icon"
									onClick={() =>
										handleEdit({
											id: area.id,
											name: area.name,
											description: area.description,
										})
									}
									aria-label={t("launchclub.areas.edit")}
								>
									<PencilIcon className="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setDeletingAreaId(area.id)}
									aria-label={t("launchclub.areas.delete")}
								>
									<TrashIcon className="size-4 text-destructive" />
								</Button>
							</div>

							<div className="pr-16">
								<p className="font-bold text-base leading-tight">
									{area.name}
								</p>
								{area.description && (
									<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
										{area.description}
									</p>
								)}
								<div className="mt-3">
									<Badge status="info">
										{t("launchclub.areas.sitesCount", {
											count: area._count?.sites ?? 0,
										})}
									</Badge>
								</div>
							</div>
						</Card>
					))}

					{areas?.length === 0 && (
						<p className="col-span-full text-muted-foreground text-sm">
							No areas yet. Create one to get started.
						</p>
					)}
				</div>
			</div>

			<AreaDialog
				open={dialogOpen}
				onOpenChange={handleDialogOpenChange}
				area={editingArea}
				organizationId={organizationId}
			/>

			<AlertDialog
				open={Boolean(deletingAreaId)}
				onOpenChange={(open) => {
					if (!open) setDeletingAreaId(undefined);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("launchclub.areas.confirmDelete.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("launchclub.areas.confirmDelete.message")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							{t("launchclub.areas.confirmDelete.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
