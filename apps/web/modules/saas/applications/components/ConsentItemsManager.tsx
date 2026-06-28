"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ConsentItemType } from "@repo/database";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError } from "@repo/ui/components/toast";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import {
	useConsentItems,
	useReorderConsentItems,
} from "../hooks/use-consent-items";
import { ConsentItemDialog } from "./ConsentItemDialog";
import { ConsentItemRow } from "./ConsentItemRow";

interface ConsentItemsManagerProps {
	organizationId: string;
}

export function ConsentItemsManager({
	organizationId,
}: ConsentItemsManagerProps) {
	const { data: items, isLoading } = useConsentItems(organizationId);
	const reorder = useReorderConsentItems(organizationId);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<ConsentItemType | null>(null);
	const [localItems, setLocalItems] = useState<ConsentItemType[] | null>(
		null,
	);

	const displayItems = localItems ?? items ?? [];

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	function openDialog(item: ConsentItemType | null) {
		setEditTarget(item);
		setDialogOpen(true);
	}

	function handleDialogOpenChange(open: boolean) {
		setDialogOpen(open);
		if (!open) {
			setLocalItems(null);
		}
	}

	async function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const current = localItems ?? items ?? [];
		const oldIndex = current.findIndex((item) => item.id === active.id);
		const newIndex = current.findIndex((item) => item.id === over.id);
		const reordered = arrayMove(current, oldIndex, newIndex);

		setLocalItems(reordered);

		try {
			await reorder.mutateAsync({
				organizationId,
				items: reordered.map((item, i) => ({
					id: item.id,
					sortOrder: i,
				})),
			});
		} catch {
			setLocalItems(null);
			toastError("Failed to reorder consent items.");
		}
	}

	return (
		<div className="rounded-lg border p-4 space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-semibold">Consents</p>
					<p className="text-xs text-muted-foreground mt-0.5">
						Choose which consents appear on application forms.
						Attach a PDF for applicants to download.
					</p>
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={() => openDialog(null)}
				>
					<PlusIcon className="size-3.5" />
					Add consent
				</Button>
			</div>

			{isLoading ? (
				<div className="space-y-2">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-12 w-full" />
				</div>
			) : displayItems.length === 0 ? (
				<div className="text-center py-8 space-y-2">
					<p className="text-sm text-muted-foreground">
						No consent items yet.
					</p>
					<p className="text-xs text-muted-foreground">
						Add your first consent to include it on application
						forms.
					</p>
					<Button
						size="sm"
						variant="outline"
						onClick={() => openDialog(null)}
					>
						<PlusIcon className="size-3.5" />
						Add consent
					</Button>
				</div>
			) : (
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={displayItems.map((item) => item.id)}
						strategy={verticalListSortingStrategy}
					>
						<div className="space-y-2">
							{displayItems.map((item) => (
								<ConsentItemRow
									key={item.id}
									item={item}
									organizationId={organizationId}
									onEdit={openDialog}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			)}

			<ConsentItemDialog
				key={editTarget?.id ?? "new"}
				organizationId={organizationId}
				open={dialogOpen}
				onOpenChange={handleDialogOpenChange}
				editTarget={editTarget}
			/>
		</div>
	);
}
