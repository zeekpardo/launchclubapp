"use client";

import { formFieldTypeEnum } from "@repo/api/modules/form-builder/types";
import { toastError } from "@repo/ui/components/toast";
import { AreaProfileFieldPicker } from "@saas/custom-fields/components/AreaProfileFieldPicker";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { z } from "zod";
import { useAddFormField, useAreaFormFields, useDeleteFormField } from "../hooks/use-form-fields";
import type { FormFieldItem } from "./FieldCard";
import { FieldEditorPanel } from "./FieldEditorPanel";
import { FieldTypePicker } from "./FieldTypePicker";
import { FormBuilderCanvas } from "./FormBuilderCanvas";

type FormFieldType = z.infer<typeof formFieldTypeEnum>;

interface AreaFormBuilderProps {
	areaId: string;
	areaName?: string;
}

function slugify(str: string) {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "");
}

export function AreaFormBuilder({ areaId, areaName }: AreaFormBuilderProps) {
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const params = useParams<{ organizationSlug: string }>();
	const organizationSlug = params.organizationSlug ?? "";

	const { data: fields = [], isLoading } = useAreaFormFields(areaId);
	const addField = useAddFormField(areaId);
	const deleteField = useDeleteFormField(areaId);
	const [selectedField, setSelectedField] = useState<FormFieldItem | null>(null);

	const handleAdd = async (type: string) => {
		const label = `New ${type.charAt(0) + type.slice(1).toLowerCase()} Field`;
		try {
			const created = await addField.mutateAsync({
				areaId,
				label,
				fieldKey: slugify(label),
				type: type as FormFieldType,
				required: false,
			});
			setSelectedField(created as FormFieldItem);
		} catch {
			toastError("Failed to add field.");
		}
	};

	const handleDelete = async (id: string) => {
		if (selectedField?.id === id) setSelectedField(null);
		try {
			await deleteField.mutateAsync({ id });
		} catch {
			toastError("Failed to delete field.");
		}
	};

	return (
		<div className="space-y-8">
			{/* ── Application Form Fields ── */}
			<div className="space-y-4">
				<div>
					<h3 className="font-semibold text-sm">Application Form Fields</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						{areaName ? `Fields for "${areaName}" — ` : ""}
						These fields appear on the public application form for all sites in this area.
					</p>
				</div>

				<FieldTypePicker onAdd={handleAdd} />

				<div className={`grid gap-4 ${selectedField ? "grid-cols-1 md:grid-cols-2" : ""}`}>
					<div>
						{isLoading ? (
							<p className="text-sm text-muted-foreground">Loading fields...</p>
						) : (
							<FormBuilderCanvas
								fields={fields as FormFieldItem[]}
								areaId={areaId}
								selectedId={selectedField?.id}
								onSelect={setSelectedField}
								onDelete={handleDelete}
							/>
						)}
					</div>

					{selectedField && (
						<FieldEditorPanel
							field={selectedField}
							areaId={areaId}
							onClose={() => setSelectedField(null)}
						/>
					)}
				</div>
			</div>

			{/* ── Profile Fields ── */}
			<div className="border-t pt-8">
				<AreaProfileFieldPicker
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					title="Child Profile Fields"
					description="These fields are collected on the application and written to the child's profile when the application is approved. Manage the full list at Settings › Custom Fields."
				/>
			</div>
		</div>
	);
}
