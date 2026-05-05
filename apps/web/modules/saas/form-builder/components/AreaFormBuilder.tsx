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
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formFieldTypeEnum } from "@repo/api/modules/form-builder/types";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError } from "@repo/ui/components/toast";
import {
	useCustomFields,
	useReorderCustomFields,
	useUpdateCustomField,
} from "@saas/custom-fields/hooks/use-custom-fields";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { GripVerticalIcon, LockIcon, TrashIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { z } from "zod";
import {
	useAddFormField,
	useAreaFormFields,
	useDeleteFormField,
	useUpdateFormField,
} from "../hooks/use-form-fields";
import type { FormFieldItem } from "./FieldCard";
import { FieldTypePicker } from "./FieldTypePicker";
import { FormBuilderCanvas } from "./FormBuilderCanvas";

type FormFieldType = z.infer<typeof formFieldTypeEnum>;

const DEFAULT_ADULT_FIELDS = [
	{ label: "First Name", required: true },
	{ label: "Last Name", required: true },
	{ label: "Email Address", required: false },
	{ label: "Phone", required: false },
	{ label: "Street Address", required: false },
	{ label: "City", required: false },
	{ label: "State / Province", required: false },
	{ label: "Postal Code", required: false },
	{ label: "Country", required: false },
	{ label: "Emergency Contact Name", required: false },
	{ label: "Emergency Contact Phone", required: false },
] as const;

const DEFAULT_CHILD_FIELDS = [
	{ label: "First Name", required: true },
	{ label: "Last Name", required: true },
	{ label: "Date of Birth", required: false },
	{ label: "Grade", required: false },
	{ label: "Part of Church", required: false },
	{ label: "Observation Consent", required: true },
	{ label: "Terms & Conditions", required: true },
	{ label: "Photo / Video Consent", required: true },
] as const;

function DefaultFieldRow({ label, required }: { label: string; required: boolean }) {
	return (
		<div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 opacity-60">
			<LockIcon className="size-3.5 text-muted-foreground shrink-0" />
			<p className="text-sm text-muted-foreground flex-1 truncate">{label}</p>
			{required && (
				<Badge className="text-xs shrink-0 opacity-70">Required</Badge>
			)}
		</div>
	);
}

interface ProfileField {
	id: string;
	name: string;
	type: string;
	required: boolean;
	collectInApplication: boolean;
}

interface AreaFormBuilderProps {
	areaId: string;
	areaName?: string;
}

function slugify(str: string) {
	return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function SortableProfileFieldRow({
	field,
	onRemove,
}: { field: ProfileField; onRemove: () => void }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
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
				<Badge status="success" className="text-xs">Profile</Badge>
				{field.required && <Badge status="error" className="text-xs">Required</Badge>}
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

export function AreaFormBuilder({ areaId, areaName }: AreaFormBuilderProps) {
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const params = useParams<{ organizationSlug: string }>();
	const organizationSlug = params.organizationSlug ?? "";

	// Basic fields (FormField)
	const { data: basicFields = [], isLoading: basicLoading } = useAreaFormFields(areaId);
	const addField = useAddFormField(areaId);
	const deleteField = useDeleteFormField(areaId);
	const updateField = useUpdateFormField(areaId);

	// Profile fields (CustomField with collectInApplication)
	const { data: allCustomFields = [], isLoading: profileLoading } = useCustomFields(organizationId);
	const updateCustomField = useUpdateCustomField(organizationId);
	const reorderCustomField = useReorderCustomFields(organizationId);

	const linkedProfileFields = (allCustomFields as ProfileField[]).filter((f) => f.collectInApplication);
	const availableProfileFields = (allCustomFields as ProfileField[]).filter((f) => !f.collectInApplication);

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const isLoading = basicLoading || profileLoading;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	const handleProfileDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = linkedProfileFields.findIndex((f) => f.id === active.id);
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

	const handleAddBasic = async (type: string) => {
		const label = `New ${type.charAt(0) + type.slice(1).toLowerCase()} Field`;
		try {
			const created = await addField.mutateAsync({
				areaId,
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
			await updateCustomField.mutateAsync({ id: fieldId, collectInApplication: true });
		} catch {
			toastError("Failed to add profile field.");
		}
	};

	const handleRemoveProfile = async (fieldId: string) => {
		try {
			await updateCustomField.mutateAsync({ id: fieldId, collectInApplication: false });
		} catch {
			toastError("Failed to remove profile field.");
		}
	};

	const handleDeleteBasic = async (id: string) => {
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
			options: data.options as { label: string; value: string }[] | undefined,
		});
	};

	const isEmpty =
		linkedProfileFields.length === 0 && (basicFields as FormFieldItem[]).length === 0;

	return (
		<div className="grid grid-cols-[1fr_260px] gap-4 items-start">
			{/* Canvas */}
			<div className="rounded-lg border bg-card overflow-hidden">
				<div className="px-4 py-3 border-b bg-muted/40">
					<h3 className="font-semibold text-sm">Application Form Fields</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						{areaName ? `Fields for "${areaName}" — ` : ""}
						These fields appear on the public application form for all sites in this area.
					</p>
				</div>
				<div className="divide-y">
					{/* Adult defaults */}
					<div className="p-3 space-y-1.5">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pb-0.5">
							Adult — always collected
						</p>
						{DEFAULT_ADULT_FIELDS.map((f) => (
							<DefaultFieldRow key={f.label} label={f.label} required={f.required} />
						))}
					</div>

					{/* Child defaults + configurable fields */}
					<div className="p-3 space-y-1.5">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pb-0.5">
							Per Child — always collected
						</p>
						{DEFAULT_CHILD_FIELDS.map((f) => (
							<DefaultFieldRow key={f.label} label={f.label} required={f.required} />
						))}
					</div>

					{/* Configurable area fields */}
					<div className="p-3 space-y-2">
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pb-0.5">
							Per Child — area specific
						</p>
						{isLoading ? (
							<>
								<Skeleton className="h-11 w-full rounded-lg" />
								<Skeleton className="h-11 w-full rounded-lg" />
							</>
						) : isEmpty ? (
							<div className="py-6 text-center text-sm text-muted-foreground">
								No fields yet. Add one from the panel on the right.
							</div>
						) : (
							<>
								{linkedProfileFields.length > 0 && (
									<DndContext
										sensors={sensors}
										collisionDetection={closestCenter}
										onDragEnd={handleProfileDragEnd}
									>
										<SortableContext
											items={linkedProfileFields.map((f) => f.id)}
											strategy={verticalListSortingStrategy}
										>
											<div className="space-y-2">
												{linkedProfileFields.map((f) => (
													<SortableProfileFieldRow
														key={f.id}
														field={f}
														onRemove={() => handleRemoveProfile(f.id)}
													/>
												))}
											</div>
										</SortableContext>
									</DndContext>
								)}

								{(basicFields as FormFieldItem[]).length > 0 && (
									<FormBuilderCanvas
										fields={basicFields as FormFieldItem[]}
										areaId={areaId}
										expandedId={expandedId ?? undefined}
										onToggle={handleToggle}
										onDelete={handleDeleteBasic}
										onSave={handleSave}
									/>
								)}
							</>
						)}
					</div>
				</div>
			</div>

			{/* Field picker */}
			<div className="sticky top-4">
				<FieldTypePicker
					onAddBasic={handleAddBasic}
					availableProfileFields={availableProfileFields}
					onAddProfile={handleAddProfile}
					organizationSlug={organizationSlug}
				/>
			</div>
		</div>
	);
}
