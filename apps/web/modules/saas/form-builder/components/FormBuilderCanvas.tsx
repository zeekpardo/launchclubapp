"use client";

import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { toastError } from "@repo/ui/components/toast";
import { useReorderFormFields } from "../hooks/use-form-fields";
import { FieldCard } from "./FieldCard";
import type { FormFieldItem } from "./FieldCard";

interface FormBuilderCanvasProps {
	fields: FormFieldItem[];
	areaId: string;
	locked?: boolean;
	selectedId?: string;
	onSelect?: (field: FormFieldItem) => void;
	onDelete?: (id: string) => void;
	onReorder?: (ids: string[]) => void;
}

export function FormBuilderCanvas({
	fields,
	areaId,
	locked,
	selectedId,
	onSelect,
	onDelete,
	onReorder,
}: FormBuilderCanvasProps) {
	const reorder = useReorderFormFields(areaId);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = fields.findIndex((f) => f.id === active.id);
		const newIndex = fields.findIndex((f) => f.id === over.id);
		const reordered = arrayMove(fields, oldIndex, newIndex);
		const ids = reordered.map((f) => f.id);

		onReorder?.(ids);

		try {
			await reorder.mutateAsync({ ids });
		} catch {
			toastError("Failed to reorder fields.");
		}
	};

	if (fields.length === 0) {
		return (
			<div className="rounded-lg border-2 border-dashed border-muted-foreground/20 py-10 text-center text-sm text-muted-foreground">
				{locked ? "No fields inherited from area." : "No fields yet. Add one above."}
			</div>
		);
	}

	if (locked) {
		return (
			<div className="space-y-2">
				{fields.map((field) => (
					<FieldCard key={field.id} field={field} locked />
				))}
			</div>
		);
	}

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
				<div className="space-y-2">
					{fields.map((field) => (
						<FieldCard
							key={field.id}
							field={field}
							selected={selectedId === field.id}
							onSelect={onSelect}
							onDelete={onDelete}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}
