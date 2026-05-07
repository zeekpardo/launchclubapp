"use client";

import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError } from "@repo/ui/components/toast";
import type { FormFieldItem } from "@saas/form-builder/components/FieldCard";
import {
	FieldTypePicker,
	MENTOR_PROFILE_FIELDS,
	PARENT_PROFILE_FIELDS,
	STUDENT_PROFILE_FIELDS,
} from "@saas/form-builder/components/FieldTypePicker";
import { FormBuilderCanvas } from "@saas/form-builder/components/FormBuilderCanvas";
import {
	useAddFormField,
	useDeleteFormField,
	useFormFields,
	useUpdateFormField,
} from "@saas/form-builder/hooks/use-form-fields";
import { slugify } from "@saas/form-builder/lib/slugify";
import { useConsentItems } from "@saas/applications/hooks/use-consent-items";
import { useCustomFields } from "@saas/custom-fields/hooks/use-custom-fields";
import { formFieldTypeEnum } from "@repo/api/modules/form-builder/types";
import { useCallback, useMemo, useState } from "react";
import type { z } from "zod";

type FormFieldType = z.infer<typeof formFieldTypeEnum>;
type ActiveSection = "PARENT" | "STUDENT";

interface BuilderTabProps {
	formId: string;
	isStudentForm: boolean;
	organizationId: string;
	orgSlug: string;
}

export function BuilderTab({ formId, isStudentForm, organizationId, orgSlug }: BuilderTabProps) {
	const { data: fields = [], isLoading: fieldsLoading } = useFormFields(formId);
	const { data: allCustomFields = [] } = useCustomFields(organizationId);
	const { data: allConsentItems = [] } = useConsentItems(organizationId);

	const addField = useAddFormField(formId);
	const deleteField = useDeleteFormField(formId);
	const updateField = useUpdateFormField(formId);

	const [activeSection, setActiveSection] = useState<ActiveSection>("PARENT");
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const typedFields = fields as FormFieldItem[];

	const { parentFields, studentFields, globalFields } = useMemo(
		() =>
			typedFields.reduce(
				(acc, f) => {
					if (f.targetPersonType === "PARENT") acc.parentFields.push(f);
					else if (f.targetPersonType === "STUDENT") acc.studentFields.push(f);
					else acc.globalFields.push(f);
					return acc;
				},
				{ parentFields: [] as FormFieldItem[], studentFields: [] as FormFieldItem[], globalFields: [] as FormFieldItem[] },
			),
		[typedFields],
	);

	const fieldsInSection = isStudentForm
		? activeSection === "PARENT"
			? parentFields
			: studentFields
		: globalFields;

	const builtinFieldsForSection = isStudentForm
		? activeSection === "PARENT"
			? PARENT_PROFILE_FIELDS
			: STUDENT_PROFILE_FIELDS
		: MENTOR_PROFILE_FIELDS;

	const addedProfileKeys = useMemo(
		() =>
			new Set(
				fieldsInSection
					.filter((f) => f.type === "PROFILE")
					.map((f) => f.profileFieldKey)
					.filter(Boolean) as string[],
			),
		[fieldsInSection],
	);

	const customFieldOptions = allCustomFields as { id: string; name: string }[];

	const consentItems = useMemo(
		() =>
			(allConsentItems as { id: string; name: string; applicantType: string }[]).filter((item) =>
				isStudentForm
					? item.applicantType === "STUDENT" || item.applicantType === "PARENT"
					: item.applicantType === "MENTOR",
			),
		[allConsentItems, isStudentForm],
	);

	const hasPendingField = typedFields.some((f) => !f.label.trim());

	const addedConsentIds = useMemo(
		() =>
			new Set(
				typedFields
					.filter((f) => f.type === "CONSENT" && (f as FormFieldItem & { consentItemId?: string | null }).consentItemId)
					.map((f) => (f as FormFieldItem & { consentItemId?: string | null }).consentItemId as string),
			),
		[typedFields],
	);

	const addFieldAndExpand = useCallback(
		async (payload: Parameters<typeof addField.mutateAsync>[0]) => {
			try {
				const created = await addField.mutateAsync(payload);
				setExpandedId((created as FormFieldItem).id);
			} catch {
				toastError("Failed to add field.");
			}
		},
		[addField],
	);

	const handleAddBasic = (type: string) =>
		addFieldAndExpand({
			formId,
			label: "",
			fieldKey: `field_${Date.now()}`,
			type: type as FormFieldType,
			required: false,
			targetPersonType: isStudentForm ? activeSection : undefined,
		});

	const handleAddBuiltinField = (key: string) => {
		const def = builtinFieldsForSection.find((f) => f.key === key);
		if (!def) return;
		addFieldAndExpand({
			formId,
			label: def.label,
			fieldKey: slugify(def.label),
			type: "PROFILE" as FormFieldType,
			profileFieldKey: key,
			required: false,
			targetPersonType: isStudentForm ? activeSection : undefined,
		});
	};

	const handleAddCustomField = () =>
		addFieldAndExpand({
			formId,
			label: "Custom Field",
			fieldKey: `custom_field_${Date.now()}`,
			type: "CUSTOM" as FormFieldType,
			required: false,
			targetPersonType: isStudentForm ? activeSection : undefined,
		});

	const handleAddConsentField = (consentItemId: string) => {
		const item = consentItems.find((c) => c.id === consentItemId);
		addFieldAndExpand({
			formId,
			type: "CONSENT" as FormFieldType,
			label: item?.name ?? "Consent",
			fieldKey: `consent_${consentItemId.slice(-6)}`,
			required: true,
			consentItemId,
			targetPersonType: isStudentForm ? activeSection : undefined,
		});
	};

	const handleDeleteField = async (id: string) => {
		if (expandedId === id) setExpandedId(null);
		try {
			await deleteField.mutateAsync({ id });
		} catch {
			toastError("Failed to delete field.");
		}
	};

	const handleToggle = (field: FormFieldItem) =>
		setExpandedId((prev) => (prev === field.id ? null : field.id));

	const handleSave = async (id: string, data: Partial<FormFieldItem>) => {
		await updateField.mutateAsync({
			id,
			label: data.label,
			fieldKey: data.fieldKey,
			placeholder: data.placeholder ?? undefined,
			helpText: data.helpText ?? undefined,
			required: data.required,
			options: data.options as { label: string; value: string }[] | undefined,
			customFieldId: data.customFieldId ?? undefined,
		});
	};

	const canvasProps = {
		formId,
		expandedId: expandedId ?? undefined,
		onToggle: handleToggle,
		onDelete: handleDeleteField,
		onSave: handleSave,
		customFieldOptions,
	};

	return (
		<div className="grid grid-cols-[1fr_260px] gap-4 items-start">
			<div className="rounded-lg border bg-card overflow-hidden">
				<div className="px-4 py-3 border-b bg-muted/40">
					<h3 className="font-semibold text-sm">Form Fields</h3>
					<p className="text-xs text-muted-foreground mt-0.5">
						{isStudentForm
							? "Click a section to select where new fields are added."
							: "Fields appear in the order shown below."}
					</p>
				</div>

				{fieldsLoading ? (
					<div className="p-3 space-y-2">
						<Skeleton className="h-11 w-full rounded-lg" />
						<Skeleton className="h-11 w-full rounded-lg" />
					</div>
				) : isStudentForm ? (
					<div className="divide-y">
						<SectionPanel
							label="Parent Information"
							fields={parentFields}
							isActive={activeSection === "PARENT"}
							onSelect={() => setActiveSection("PARENT")}
							{...canvasProps}
						/>
						<SectionPanel
							label="Student Information"
							fields={studentFields}
							isActive={activeSection === "STUDENT"}
							onSelect={() => setActiveSection("STUDENT")}
							{...canvasProps}
						/>
					</div>
				) : (
					<div className="p-3">
						<FormBuilderCanvas fields={globalFields.length > 0 ? globalFields : typedFields} {...canvasProps} />
					</div>
				)}
			</div>

			<div className="sticky top-4">
				<FieldTypePicker
					onAddBasic={handleAddBasic}
					targetSection={isStudentForm ? activeSection : null}
					onTargetSectionChange={isStudentForm ? setActiveSection : undefined}
					addedProfileKeys={addedProfileKeys}
					onAddBuiltinField={handleAddBuiltinField}
					onAddCustomField={handleAddCustomField}
					consentItems={consentItems}
					addedConsentIds={addedConsentIds}
					onAddConsentField={handleAddConsentField}
					organizationSlug={orgSlug}
					pendingField={hasPendingField}
				/>
			</div>
		</div>
	);
}

// ── SectionPanel ──────────────────────────────────────────────────────────────

interface SectionPanelProps {
	label: string;
	fields: FormFieldItem[];
	isActive: boolean;
	onSelect: () => void;
	formId: string;
	expandedId?: string;
	onToggle: (field: FormFieldItem) => void;
	onDelete: (id: string) => Promise<void>;
	onSave: (id: string, data: Partial<FormFieldItem>) => Promise<void>;
	customFieldOptions: { id: string; name: string }[];
}

function SectionPanel({ label, fields, isActive, onSelect, ...canvasProps }: SectionPanelProps) {
	return (
		<>
			<button
				type="button"
				onClick={onSelect}
				className={`w-full text-left px-4 py-3 transition-colors ${
					isActive ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/40"
				}`}
			>
				<p className={`text-xs font-semibold uppercase tracking-wider ${isActive ? "text-primary" : "text-muted-foreground"}`}>
					{label}
				</p>
				<p className="text-xs text-muted-foreground mt-0.5">
					{isActive ? "← Adding to this section" : `${fields.length} field${fields.length !== 1 ? "s" : ""}`}
				</p>
			</button>
			<div className="p-3">
				<FormBuilderCanvas fields={fields} {...canvasProps} />
			</div>
		</>
	);
}
