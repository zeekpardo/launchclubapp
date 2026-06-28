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
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpenIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ResourceDialog } from "../ResourceDialog";

interface GroupResourcesTabProps {
	groupId: string;
}

type EditTarget = {
	id: string;
	name: string;
	url: string;
	description?: string | null;
	eventId?: string | null;
};

export function GroupResourcesTab({ groupId }: GroupResourcesTabProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
	const [deleteResourceId, setDeleteResourceId] = useState<string | null>(
		null,
	);

	const { data: resources, isLoading } = useQuery(
		orpc.resources.list.queryOptions({ input: { groupId } }),
	);

	const { data: events } = useQuery(
		orpc.events.list.queryOptions({ input: { groupId } }),
	);

	const deleteResource = useMutation(orpc.resources.delete.mutationOptions());

	const handleOpenCreate = () => {
		setEditTarget(null);
		setResourceDialogOpen(true);
	};

	const handleOpenEdit = (resource: EditTarget) => {
		setEditTarget(resource);
		setResourceDialogOpen(true);
	};

	const handleDialogClose = (open: boolean) => {
		setResourceDialogOpen(open);
		if (!open) setEditTarget(null);
	};

	const handleConfirmDelete = async () => {
		if (!deleteResourceId) return;
		try {
			await deleteResource.mutateAsync({ id: deleteResourceId });
			queryClient.invalidateQueries(
				orpc.resources.list.queryOptions({ input: { groupId } }),
			);
			toastSuccess(t("launchclub.resources.notifications.deleted"));
		} catch {
			toastError(t("launchclub.resources.notifications.deleteError"));
		}
		setDeleteResourceId(null);
	};

	const dialogEvents =
		events?.map((e) => ({
			id: e.id,
			name: e.name,
			startsAt: e.startsAt,
		})) ?? [];

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">
					{t("launchclub.resources.title")}
				</h2>
				<Button onClick={handleOpenCreate}>
					<PlusIcon className="mr-2 h-4 w-4" />
					{t("launchclub.resources.add")}
				</Button>
			</div>

			{isLoading ? (
				<div className="space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
						<Skeleton key={i} className="h-20 w-full" />
					))}
				</div>
			) : (
				<div className="divide-y">
					{resources?.map((resource) => (
						<div
							key={resource.id}
							className="flex items-start gap-3 py-4"
						>
							<BookOpenIcon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
							<div className="min-w-0 flex-1">
								<p className="font-medium">{resource.name}</p>
								{resource.description && (
									<p className="mt-0.5 text-sm text-muted-foreground">
										{resource.description}
									</p>
								)}
								<a
									href={resource.url}
									target="_blank"
									rel="noopener noreferrer"
									className="mt-1 block truncate text-sm text-blue-500 hover:underline"
								>
									{resource.url}
								</a>
								{resource.event && (
									<Badge
										className="mt-2 normal-case"
										status="info"
									>
										Linked to: {resource.event.name}
									</Badge>
								)}
							</div>
							<div className="flex shrink-0 items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={() => handleOpenEdit(resource)}
								>
									<PencilIcon className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-destructive hover:text-destructive"
									onClick={() =>
										setDeleteResourceId(resource.id)
									}
								>
									<TrashIcon className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}

					{resources?.length === 0 && (
						<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
							<BookOpenIcon className="size-8 opacity-40" />
							<p className="text-sm">
								{t("launchclub.resources.empty")}
							</p>
						</div>
					)}
				</div>
			)}

			<ResourceDialog
				groupId={groupId}
				open={resourceDialogOpen}
				onOpenChange={handleDialogClose}
				events={dialogEvents}
				editResource={editTarget ?? undefined}
			/>

			<AlertDialog
				open={!!deleteResourceId}
				onOpenChange={(open) => {
					if (!open) setDeleteResourceId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Resource</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this resource? This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
