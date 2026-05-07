"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Switch } from "@repo/ui/components/switch";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileTextIcon, GripVerticalIcon, PenLineIcon, Trash2Icon } from "lucide-react";
import type { ConsentItemType } from "@repo/database";
import { useDeleteConsentItem, useUpdateConsentItem, usePdfDownloadUrl } from "../hooks/use-consent-items";

interface ConsentItemRowProps {
	item: ConsentItemType;
	organizationId: string;
	onEdit: (item: ConsentItemType) => void;
}

export function ConsentItemRow({ item, organizationId, onEdit }: ConsentItemRowProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: item.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	const updateItem = useUpdateConsentItem(organizationId);
	const deleteItem = useDeleteConsentItem(organizationId);
	const pdfDownloadUrl = usePdfDownloadUrl();

	async function handleToggleActive(checked: boolean) {
		try {
			await updateItem.mutateAsync({
				id: item.id,
				organizationId,
				isActive: checked,
			});
		} catch {
			toastError("Failed to update consent item.");
		}
	}

	async function handleViewPdf() {
		try {
			const result = await pdfDownloadUrl.mutateAsync({
				id: item.id,
				organizationId,
			});
			window.open(result.downloadUrl, "_blank");
		} catch {
			toastError("Failed to get PDF.");
		}
	}

	async function handleDelete() {
		try {
			await deleteItem.mutateAsync({ id: item.id, organizationId });
			toastSuccess("Consent item deleted.");
		} catch {
			toastError("Failed to delete consent item.");
		}
	}

	const applicantTypeLabel = item.applicantType === "MENTOR" ? "Mentor" : "Student";

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
		>
			<button
				type="button"
				className="cursor-grab text-muted-foreground hover:text-foreground touch-none shrink-0"
				{...attributes}
				{...listeners}
			>
				<GripVerticalIcon className="size-4" />
			</button>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<p className="text-sm font-medium truncate">{item.name}</p>
					{item.pdfKey && (
						<button
							type="button"
							title="View PDF"
							className="text-muted-foreground hover:text-primary shrink-0 transition-colors"
							onClick={handleViewPdf}
							disabled={pdfDownloadUrl.isPending}
						>
							<FileTextIcon className="size-3.5" />
						</button>
					)}
					{!item.isActive && (
						<Badge status="warning" className="text-xs">Paused</Badge>
					)}
				</div>
				{item.nameES && (
					<p className="text-xs text-muted-foreground truncate mt-0.5">{item.nameES}</p>
				)}
			</div>

			<div className="flex items-center gap-2 shrink-0">
				<Badge status="info" className="text-xs">{applicantTypeLabel}</Badge>

				<Switch
					checked={item.isActive}
					onCheckedChange={handleToggleActive}
					disabled={updateItem.isPending}
				/>

				<Button
					variant="ghost"
					size="icon"
					className="size-7 text-muted-foreground"
					onClick={() => onEdit(item)}
				>
					<PenLineIcon className="size-3.5" />
				</Button>

				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-7 text-muted-foreground hover:text-destructive"
						>
							<Trash2Icon className="size-3.5" />
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete consent item?</AlertDialogTitle>
							<AlertDialogDescription>
								This will permanently delete <strong>{item.name}</strong> and remove all recorded
								consent history. This cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
								onClick={handleDelete}
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
