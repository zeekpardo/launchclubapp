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
import { useEffect, useState } from "react";
import { useReorderFormFields, useReorderOrgFormFields } from "../hooks/use-form-fields";
import { FieldCard } from "./FieldCard";
import type { FormFieldItem } from "./FieldCard";

interface FormBuilderCanvasProps {
	fields: FormFieldItem[];
	/** New: formId-scoped reorder (preferred) */
	formId?: string;
	/** Legacy: areaId-scoped reorder */
	areaId?: string;
	organizationId?: string;
	locked?: boolean;
	expandedId?: string;
	onToggle?: (field: FormFieldItem) => void;
	onDelete?: (id: string) => void;
	onSave?: (id: string, data: Partial<FormFieldItem>) => Promise<void>;
	onReorder?: (ids: string[]) => void;
	customFieldOptions?: { id: string; name: string }[];
}

export function FormBuilderCanvas({
	fields,
	formId,
	areaId,
	organizationId,
	locked,
	expandedId,
	onToggle,
	onDelete,
	onSave,
	onReorder,
	customFieldOptions,
}: FormBuilderCanvasProps) {
	// Local copy for immediate visual reorder — synced from props when fields change externally
	const [localFields, setLocalFields] = useState(fields);
	useEffect(() => {
		setLocalFields(fields);
	}, [fields]);

	// Prefer formId-scoped reorder, fall back to org/area
	const reorderForm = useReorderFormFields(formId ?? areaId ?? "");
	const reorderOrg = useReorderOrgFormFields(organizationId ?? "");
	const reorder = organizationId && !formId ? reorderOrg : reorderForm;

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		const oldIndex = localFields.findIndex((f) => f.id === active.id);
		const newIndex = localFields.findIndex((f) => f.id === over.id);
		const reordered = arrayMove(localFields, oldIndex, newIndex);
		const ids = reordered.map((f) => f.id);

		// Optimistic update — show new order immediately
		setLocalFields(reordered);
		onReorder?.(ids);

		try {
			await reorder.mutateAsync({ ids });
		} catch {
			// Rollback on failure
			setLocalFields(fields);
			toastError("Failed to reorder fields.");
		}
	};

	if (localFields.length === 0) {
		return (
			<div className="rounded-lg border-2 border-dashed border-muted-foreground/20 py-10 text-center text-sm text-muted-foreground">
				{locked ? "No fields inherited from area." : "No fields yet. Add one from the panel."}
			</div>
		);
	}

	if (locked) {
		return (
			<div className="space-y-2">
				{localFields.map((field) => (
					<FieldCard key={field.id} field={field} locked />
				))}
			</div>
		);
	}

	return (
		<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<SortableContext items={localFields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
				<div className="space-y-2">
					{localFields.map((field) => (
						<FieldCard
							key={field.id}
							field={field}
							expanded={expandedId === field.id}
							onToggle={onToggle}
							onDelete={onDelete}
							onSave={onSave}
							customFieldOptions={customFieldOptions}
						/>
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}
