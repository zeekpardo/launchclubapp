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
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { formFieldTypeEnum } from "@repo/api/modules/form-builder/types";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError } from "@repo/ui/components/toast";
import {
	useCustomFields,
	useReorderCustomFields,
	useUpdateCustomField,
} from "@saas/custom-fields/hooks/use-custom-fields";
import { GripVerticalIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import {
	useAddFormField,
	useDeleteFormField,
	useFormFields,
	useUpdateFormField,
} from "../hooks/use-form-fields";
import { slugify } from "../lib/slugify";
import type { FormFieldItem } from "./FieldCard";
import { FieldTypePicker } from "./FieldTypePicker";
import { FormBuilderCanvas } from "./FormBuilderCanvas";

type FormFieldType = z.infer<typeof formFieldTypeEnum>;

const PRESET_FIELDS = [
	{
		id: "emergency_contact_name",
		label: "Emergency Contact Name",
		type: "TEXT",
	},
	{
		id: "emergency_contact_phone",
		label: "Emergency Contact Phone",
		type: "TEXT",
	},
	{
		id: "emergency_contact_email",
		label: "Emergency Contact Email",
		type: "TEXT",
	},
] as const;

interface ProfileField {
	id: string;
	name: string;
	type: string;
	required: boolean;
	collectInApplication: boolean;
}

interface OrgFormBuilderProps {
	organizationId: string;
	organizationSlug?: string;
	/** formId is now required; the builder operates on a specific Form object */
	formId?: string;
}

function SortableProfileFieldRow({
	field,
	onRemove,
}: {
	field: ProfileField;
	onRemove: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: field.id,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5"
		>
			<button
				type="button"
				className="cursor-grab text-muted-foreground hover:text-foreground touch-none shrink-0"
				{...attributes}
				{...listeners}
			>
				<GripVerticalIcon className="size-4" />
			</button>
			<p className="text-sm font-medium flex-1 truncate">{field.name}</p>
			<div className="flex items-center gap-1.5 shrink-0">
				<Badge status="success" className="text-xs">
					Profile
				</Badge>
				{field.required && (
					<Badge status="error" className="text-xs">
						Required
					</Badge>
				)}
			</div>
			<Button
				variant="ghost"
				size="icon"
				className="size-7 text-muted-foreground hover:text-destructive shrink-0"
				onClick={onRemove}
				title="Remove from form"
			>
				<TrashIcon className="size-3.5" />
			</Button>
		</div>
	);
}

export function OrgFormBuilder({
	organizationId,
	organizationSlug,
	formId = "",
}: OrgFormBuilderProps) {
	const { data: fields = [], isLoading: basicLoading } =
		useFormFields(formId);
	const addField = useAddFormField(formId);
	const deleteField = useDeleteFormField(formId);
	const updateField = useUpdateFormField(formId);

	const { data: allCustomFields = [], isLoading: profileLoading } =
		useCustomFields(organizationId);
	const updateCustomField = useUpdateCustomField(organizationId);
	const reorderCustomField = useReorderCustomFields(organizationId);

	const linkedProfileFields = (allCustomFields as ProfileField[]).filter(
		(f) => f.collectInApplication,
	);
	const availableProfileFields = (allCustomFields as ProfileField[]).filter(
		(f) => !f.collectInApplication,
	);

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const isLoading = basicLoading || profileLoading;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleProfileDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = linkedProfileFields.findIndex(
			(f) => f.id === active.id,
		);
		const newIndex = linkedProfileFields.findIndex((f) => f.id === over.id);
		const reordered = arrayMove(linkedProfileFields, oldIndex, newIndex);
		try {
			await reorderCustomField.mutateAsync({
				organizationId,
				ids: reordered.map((f) => f.id),
			});
		} catch {
			toastError("Failed to reorder fields.");
		}
	};

	const currentFieldKeys = new Set(
		(fields as FormFieldItem[]).map((f) => f.fieldKey),
	);
	const availablePresetFields = PRESET_FIELDS.filter(
		(p) => !currentFieldKeys.has(p.id),
	);

	const handleAddPreset = async (id: string) => {
		const preset = PRESET_FIELDS.find((p) => p.id === id);
		if (!preset) return;
		try {
			const created = await addField.mutateAsync({
				formId,
				label: preset.label,
				fieldKey: preset.id,
				type: preset.type as FormFieldType,
				required: false,
			});
			setExpandedId((created as FormFieldItem).id);
		} catch {
			toastError("Failed to add field.");
		}
	};

	const handleAddBasic = async (type: string) => {
		const label = `New ${type.charAt(0) + type.slice(1).toLowerCase()} Field`;
		try {
			const created = await addField.mutateAsync({
				formId,
				label,
				fieldKey: slugify(label),
				type: type as FormFieldType,
				required: false,
			});
			setExpandedId((created as FormFieldItem).id);
		} catch {
			toastError("Failed to add field.");
		}
	};

	const handleAddProfile = async (fieldId: string) => {
		try {
			await updateCustomField.mutateAsync({
				id: fieldId,
				collectInApplication: true,
			});
		} catch {
			toastError("Failed to add profile field.");
		}
	};

	const handleRemoveProfile = async (fieldId: string) => {
		try {
			await updateCustomField.mutateAsync({
				id: fieldId,
				collectInApplication: false,
			});
		} catch {
			toastError("Failed to remove profile field.");
		}
	};

	const handleDelete = async (id: string) => {
		if (expandedId === id) setExpandedId(null);
		try {
			await deleteField.mutateAsync({ id });
		} catch {
			toastError("Failed to delete field.");
		}
	};

	const handleToggle = (field: FormFieldItem) => {
		setExpandedId((prev) => (prev === field.id ? null : field.id));
	};

	const handleSave = async (id: string, data: Partial<FormFieldItem>) => {
		await updateField.mutateAsync({
			id,
			label: data.label,
			fieldKey: data.fieldKey,
			placeholder: data.placeholder ?? undefined,
			helpText: data.helpText ?? undefined,
			required: data.required,
			options: data.options as
				| { label: string; value: string }[]
				| undefined,
		});
	};

	const isEmpty =
		linkedProfileFields.length === 0 &&
		(fields as FormFieldItem[]).length === 0;

	return (
		<div className="grid grid-cols-[1fr_260px] gap-4 items-start">
			<div className="rounded-lg border bg-card overflow-hidden">
				<div className="px-4 py-3 border-b bg-muted/40">
					<h3 className="font-semibold text-sm">
						Mentor Form Questions
					</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						These questions appear on the mentor application form
						for this organization.
					</p>
				</div>
				<div className="p-3">
					{isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-11 w-full rounded-lg" />
							<Skeleton className="h-11 w-full rounded-lg" />
						</div>
					) : isEmpty ? (
						<div className="py-6 text-center text-sm text-muted-foreground">
							No fields yet. Add one from the panel on the right.
						</div>
					) : (
						<div className="space-y-2">
							{linkedProfileFields.length > 0 && (
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragEnd={handleProfileDragEnd}
								>
									<SortableContext
										items={linkedProfileFields.map(
											(f) => f.id,
										)}
										strategy={verticalListSortingStrategy}
									>
										<div className="space-y-2">
											{linkedProfileFields.map((f) => (
												<SortableProfileFieldRow
													key={f.id}
													field={f}
													onRemove={() =>
														handleRemoveProfile(
															f.id,
														)
													}
												/>
											))}
										</div>
									</SortableContext>
								</DndContext>
							)}

							{(fields as FormFieldItem[]).length > 0 && (
								<FormBuilderCanvas
									fields={fields as FormFieldItem[]}
									organizationId={organizationId}
									expandedId={expandedId ?? undefined}
									onToggle={handleToggle}
									onDelete={handleDelete}
									onSave={handleSave}
								/>
							)}
						</div>
					)}
				</div>
			</div>

			<div className="sticky top-4">
				<FieldTypePicker
					onAddBasic={handleAddBasic}
					availablePresetFields={availablePresetFields}
					onAddPreset={handleAddPreset}
					availableProfileFields={availableProfileFields}
					onAddProfile={handleAddProfile}
					organizationSlug={organizationSlug ?? ""}
				/>
			</div>
		</div>
	);
}
