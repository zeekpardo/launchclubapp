"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	useAddFormField,
	useDeleteFormField,
	useFormFields,
	useUpdateFormField,
} from "@saas/form-builder/hooks/use-form-fields";
import type { FormFieldItem } from "@saas/form-builder/components/FieldCard";
import { FieldTypePicker } from "@saas/form-builder/components/FieldTypePicker";
import { FormBuilderCanvas } from "@saas/form-builder/components/FormBuilderCanvas";
import { useSites } from "@saas/sites/hooks/use-sites";
import { useAssignSites, useSoftDeleteForm, useUpdateForm, useFormData } from "@saas/forms/hooks/use-forms";
import { useCustomFields } from "@saas/custom-fields/hooks/use-custom-fields";
import { useConsentItems } from "@saas/applications/hooks/use-consent-items";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formFieldTypeEnum } from "@repo/api/modules/form-builder/types";
import type { z } from "zod";
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

type FormFieldType = z.infer<typeof formFieldTypeEnum>;
type ActiveSection = "PARENT" | "STUDENT";
type TabKey = "builder" | "settings" | "share";

function slugify(str: string) {
	return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

// Built-in profile fields available per section
const PARENT_PROFILE_FIELDS = [
	{ key: "phone", label: "Phone" },
	{ key: "addressLine1", label: "Address" },
	{ key: "notes", label: "Notes" },
	{ key: "emergency_contact_name", label: "Emergency Contact Name" },
	{ key: "emergency_contact_phone", label: "Emergency Contact Phone" },
] as const;

const STUDENT_PROFILE_FIELDS = [
	{ key: "dateOfBirth", label: "Date of Birth" },
	{ key: "grade", label: "Grade" },
	{ key: "notes", label: "Notes" },
	{ key: "allergies", label: "Allergies" },
	{ key: "medicalNotes", label: "Medical Notes" },
] as const;

const MENTOR_PROFILE_FIELDS = [
	{ key: "phone", label: "Phone" },
	{ key: "addressLine1", label: "Address" },
	{ key: "dateOfBirth", label: "Date of Birth" },
	{ key: "notes", label: "Notes" },
] as const;

interface FormBuilderPageProps {
	formId: string;
}

export function FormBuilderPage({ formId }: FormBuilderPageProps) {
	const params = useParams<{ organizationSlug: string }>();
	const orgSlug = params.organizationSlug;
	const router = useRouter();

	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";

	const { data: form, isLoading: formLoading } = useFormData(formId);
	const { data: fields = [], isLoading: fieldsLoading } = useFormFields(formId);
	const { data: sites = [] } = useSites();
	const { data: allCustomFields = [] } = useCustomFields(organizationId);

	const addField = useAddFormField(formId);
	const deleteField = useDeleteFormField(formId);
	const updateField = useUpdateFormField(formId);
	const updateForm = useUpdateForm(formId);
	const assignSites = useAssignSites(formId);
	const softDelete = useSoftDeleteForm();

	const [activeTab, setActiveTab] = useState<TabKey>("builder");
	const [activeSection, setActiveSection] = useState<ActiveSection>("PARENT");
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	// Settings form state (initialized from form data)
	const [settingsName, setSettingsName] = useState(form?.name ?? "");
	const [settingsDescription, setSettingsDescription] = useState(form?.description ?? "");
	const [settingsSiteIds, setSettingsSiteIds] = useState<string[]>(
		form?.formSites.map((fs: { siteId: string }) => fs.siteId) ?? [],
	);

	useEffect(() => {
		if (form) {
			setSettingsName(form.name);
			setSettingsDescription(form.description ?? "");
			setSettingsSiteIds(form.formSites.map((fs: { siteId: string }) => fs.siteId));
		}
	}, [form?.id]);

	const isStudentForm = form?.type === "STUDENT";

	// Split fields by section for STUDENT forms
	const typedFields = fields as FormFieldItem[];
	const parentFields = typedFields.filter((f) => f.targetPersonType === "PARENT");
	const studentFields = typedFields.filter((f) => f.targetPersonType === "STUDENT");
	const globalFields = typedFields.filter((f) => !f.targetPersonType);

	// Compute available built-in profile fields for the active section
	const builtinFieldsForSection = isStudentForm
		? activeSection === "PARENT"
			? PARENT_PROFILE_FIELDS
			: STUDENT_PROFILE_FIELDS
		: MENTOR_PROFILE_FIELDS;

	const fieldsInSection = isStudentForm
		? activeSection === "PARENT"
			? parentFields
			: studentFields
		: globalFields;

	const addedProfileKeys = new Set(
		fieldsInSection.filter((f) => f.type === "PROFILE").map((f) => f.profileFieldKey).filter(Boolean) as string[],
	);

	// All org custom fields — passed to canvas so FieldCard can show the selector
	const customFieldOptions = allCustomFields as { id: string; name: string }[];

	// Consent items for this form's type
	const { data: allConsentItems = [] } = useConsentItems(organizationId);
	const consentItems = (allConsentItems as { id: string; name: string; applicantType: string }[]).filter(
		(item) =>
			form?.type === "STUDENT"
				? item.applicantType === "STUDENT" || item.applicantType === "PARENT"
				: item.applicantType === "MENTOR",
	);

	// True when any field has an empty label (not yet saved)
	const hasPendingField = typedFields.some((f) => !f.label.trim());

	// IDs of consent items already on the form
	const addedConsentIds = new Set(
		typedFields
			.filter((f) => f.type === "CONSENT" && (f as FormFieldItem & { consentItemId?: string | null }).consentItemId)
			.map((f) => (f as FormFieldItem & { consentItemId?: string | null }).consentItemId as string),
	);

	const handleAddBasic = async (type: string) => {
		try {
			const created = await addField.mutateAsync({
				formId,
				label: "",
				fieldKey: `field_${Date.now()}`,
				type: type as FormFieldType,
				required: false,
				targetPersonType: isStudentForm ? activeSection : undefined,
			});
			setExpandedId((created as FormFieldItem).id);
		} catch {
			toastError("Failed to add field.");
		}
	};

	const handleAddBuiltinField = async (key: string) => {
		const def = builtinFieldsForSection.find((f) => f.key === key);
		if (!def) return;
		try {
			const created = await addField.mutateAsync({
				formId,
				label: def.label,
				fieldKey: slugify(def.label),
				type: "PROFILE" as FormFieldType,
				profileFieldKey: key,
				required: false,
				targetPersonType: isStudentForm ? activeSection : undefined,
			});
			setExpandedId((created as FormFieldItem).id);
		} catch {
			toastError("Failed to add field.");
		}
	};

	// Adds a CUSTOM field slot with no customFieldId — user selects the field inline on the canvas
	const handleAddCustomField = async () => {
		try {
			const created = await addField.mutateAsync({
				formId,
				label: "Custom Field",
				fieldKey: `custom_field_${Date.now()}`,
				type: "CUSTOM" as FormFieldType,
				required: false,
				targetPersonType: isStudentForm ? activeSection : undefined,
			});
			setExpandedId((created as FormFieldItem).id);
		} catch {
			toastError("Failed to add field.");
		}
	};

	const handleAddConsentField = async (consentItemId: string) => {
		const item = consentItems.find((c) => c.id === consentItemId);
		try {
			const created = await addField.mutateAsync({
				formId,
				type: "CONSENT" as FormFieldType,
				label: item?.name ?? "Consent",
				fieldKey: `consent_${consentItemId.slice(-6)}`,
				required: true,
				consentItemId,
				targetPersonType: isStudentForm ? activeSection : undefined,
			});
			setExpandedId((created as FormFieldItem).id);
		} catch {
			toastError("Failed to add consent field.");
		}
	};

	const handleDeleteField = async (id: string) => {
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
			customFieldId: data.customFieldId ?? undefined,
		});
	};

	const handleTogglePublish = async () => {
		if (!form) return;
		const newStatus = form.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";
		try {
			await updateForm.mutateAsync({ formId, status: newStatus });
			toastSuccess(newStatus === "PUBLISHED" ? "Form published." : "Form unpublished.");
		} catch {
			toastError("Failed to update form status.");
		}
	};

	const handleSaveSettings = async () => {
		try {
			await updateForm.mutateAsync({
				formId,
				name: settingsName,
				description: settingsDescription || undefined,
			});
			toastSuccess("Settings saved.");
		} catch {
			toastError("Failed to save settings.");
		}
	};

	const handleSiteToggle = async (siteId: string) => {
		const newIds = settingsSiteIds.includes(siteId)
			? settingsSiteIds.filter((id) => id !== siteId)
			: [...settingsSiteIds, siteId];
		setSettingsSiteIds(newIds);
		try {
			await assignSites.mutateAsync({ formId, siteIds: newIds });
		} catch {
			toastError("Failed to update site assignment.");
		}
	};

	const handleDelete = async () => {
		try {
			await softDelete.mutateAsync({ formId });
			router.push(`/app/${orgSlug}/forms`);
		} catch {
			toastError("Failed to delete form.");
		}
	};

	if (formLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	if (!form) return null;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold">{form.name}</h1>
					{form.description && (
						<p className="mt-1 text-sm text-muted-foreground">{form.description}</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<FormTypeBadge type={form.type} />
					<FormStatusBadge status={form.status} />
				</div>
			</div>

			{/* Tabs */}
			<div className="inline-flex rounded-lg border bg-muted p-1">
				{(["builder", "settings", "share"] as const).map((tab) => (
					<button
						key={tab}
						type="button"
						onClick={() => setActiveTab(tab)}
						className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
					>
						{tab === "share" ? "Share" : tab}
					</button>
				))}
			</div>

			{/* Builder Tab */}
			{activeTab === "builder" && (
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
								{/* Parent section */}
								<button
									type="button"
									onClick={() => setActiveSection("PARENT")}
									className={`w-full text-left px-4 py-3 transition-colors ${
										activeSection === "PARENT"
											? "bg-primary/5 border-l-2 border-l-primary"
											: "hover:bg-muted/40"
									}`}
								>
									<p className={`text-xs font-semibold uppercase tracking-wider ${activeSection === "PARENT" ? "text-primary" : "text-muted-foreground"}`}>
										Parent Information
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{activeSection === "PARENT" ? "← Adding to this section" : `${parentFields.length} field${parentFields.length !== 1 ? "s" : ""}`}
									</p>
								</button>
								<div className="p-3">
									<FormBuilderCanvas
										fields={parentFields}
										formId={formId}
										expandedId={expandedId ?? undefined}
										onToggle={handleToggle}
										onDelete={handleDeleteField}
										onSave={handleSave}
										customFieldOptions={customFieldOptions}
									/>
								</div>

								{/* Student section */}
								<button
									type="button"
									onClick={() => setActiveSection("STUDENT")}
									className={`w-full text-left px-4 py-3 transition-colors ${
										activeSection === "STUDENT"
											? "bg-primary/5 border-l-2 border-l-primary"
											: "hover:bg-muted/40"
									}`}
								>
									<p className={`text-xs font-semibold uppercase tracking-wider ${activeSection === "STUDENT" ? "text-primary" : "text-muted-foreground"}`}>
										Student Information
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{activeSection === "STUDENT" ? "← Adding to this section" : `${studentFields.length} field${studentFields.length !== 1 ? "s" : ""}`}
									</p>
								</button>
								<div className="p-3">
									<FormBuilderCanvas
										fields={studentFields}
										formId={formId}
										expandedId={expandedId ?? undefined}
										onToggle={handleToggle}
										onDelete={handleDeleteField}
										onSave={handleSave}
										customFieldOptions={customFieldOptions}
									/>
								</div>
							</div>
						) : (
							<div className="p-3">
								<FormBuilderCanvas
									fields={globalFields.length > 0 ? globalFields : typedFields}
									formId={formId}
									expandedId={expandedId ?? undefined}
									onToggle={handleToggle}
									onDelete={handleDeleteField}
									onSave={handleSave}
									customFieldOptions={customFieldOptions}
								/>
							</div>
						)}
					</div>

					{/* Field picker */}
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
			)}

			{/* Settings Tab */}
			{activeTab === "settings" && (
				<div className="max-w-xl space-y-6">
					<div className="rounded-lg border bg-card p-6 space-y-4">
						<h3 className="font-semibold">General</h3>

						<div className="space-y-1.5">
							<Label htmlFor="form-name">Form Name</Label>
							<Input
								id="form-name"
								value={settingsName}
								onChange={(e) => setSettingsName(e.target.value)}
							/>
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="form-description">Description</Label>
							<Textarea
								id="form-description"
								value={settingsDescription}
								onChange={(e) => setSettingsDescription(e.target.value)}
								rows={3}
								placeholder="Optional description shown on the public form"
							/>
						</div>

						<Button onClick={handleSaveSettings} disabled={updateForm.isPending}>
							{updateForm.isPending ? "Saving…" : "Save Changes"}
						</Button>
					</div>

					<div className="rounded-lg border bg-card p-6 space-y-4">
						<h3 className="font-semibold">Sites</h3>
						<p className="text-sm text-muted-foreground">
							Select which sites this form is assigned to.
						</p>
						{sites.length === 0 ? (
							<p className="text-sm text-muted-foreground">No sites available.</p>
						) : (
							<div className="space-y-2">
								{sites.map((site: { id: string; name: string }) => (
									<label
										key={site.id}
										className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted"
									>
										<input
											type="checkbox"
											className="size-4 rounded border-border"
											checked={settingsSiteIds.includes(site.id)}
											onChange={() => handleSiteToggle(site.id)}
										/>
										<span className="text-sm">{site.name}</span>
									</label>
								))}
							</div>
						)}
					</div>

					<div className="rounded-lg border bg-card p-6 space-y-4">
						<h3 className="font-semibold">Publish</h3>
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium">
									{form.status === "PUBLISHED" ? "Form is published" : "Form is unpublished"}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{form.status === "PUBLISHED"
										? "The form is publicly accessible."
										: "The form is not accessible to the public."}
								</p>
							</div>
							<Switch
								checked={form.status === "PUBLISHED"}
								onCheckedChange={handleTogglePublish}
								disabled={updateForm.isPending}
							/>
						</div>
					</div>

					<div className="rounded-lg border border-destructive/40 bg-card p-6 space-y-4">
						<h3 className="font-semibold text-destructive">Danger Zone</h3>
						<p className="text-sm text-muted-foreground">
							Deleting a form is permanent and cannot be undone.
						</p>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setDeleteDialogOpen(true)}
						>
							Delete Form
						</Button>
					</div>
				</div>
			)}

			{/* Share Tab */}
			{activeTab === "share" && (
				<div className="max-w-2xl space-y-6">
					<ShareLinksSection form={form} orgSlug={orgSlug} />
				</div>
			)}

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Form</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{form.name}"? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={handleDelete}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// ── Share Links ───────────────────────────────────────────────────────────────

interface AssignedSite {
	siteId: string;
	site: { id: string; name: string; slug: string };
}

function CopyButton({ url }: { url: string }) {
	const [copied, setCopied] = useState(false);
	const handleCopy = async () => {
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};
	return (
		<Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0" title="Copy link">
			{copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
		</Button>
	);
}

function ShareLinksSection({
	form,
	orgSlug,
}: {
	form: { slug: string; status: string; formSites: AssignedSite[] };
	orgSlug: string;
}) {
	const origin = typeof window !== "undefined" ? window.location.origin : "";
	const assignedSites = form.formSites;

	return (
		<div className="rounded-lg border bg-card p-6 space-y-4">
			<div>
				<h3 className="font-semibold">Share Links</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					Each assigned site gets its own shareable link. Share the link for the site you want applicants to register at.
				</p>
			</div>

			{form.status === "UNPUBLISHED" && (
				<p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
					Publish the form first so applicants can access these links.
				</p>
			)}

			{assignedSites.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No sites assigned yet. Add sites above to generate shareable links.
				</p>
			) : (
				<div className="space-y-4">
					{assignedSites.map(({ site }) => {
						const url =
							assignedSites.length === 1
								? `${origin}/apply/${orgSlug}/forms/${form.slug}`
								: `${origin}/apply/${orgSlug}/forms/${form.slug}?site=${site.slug}`;
						return (
							<div key={site.id} className="space-y-1.5">
								<p className="text-sm font-medium">{site.name}</p>
								<div className="flex items-center gap-2">
									<Input readOnly value={url} className="font-mono text-xs" />
									<CopyButton url={url} />
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

function FormTypeBadge({ type }: { type: string }) {
	if (type === "STUDENT") {
		return <Badge status="info" className="text-xs">Student</Badge>;
	}
	return <Badge status="warning" className="text-xs">Mentor</Badge>;
}

function FormStatusBadge({ status }: { status: string }) {
	if (status === "PUBLISHED") {
		return <Badge status="success" className="text-xs">Published</Badge>;
	}
	return <Badge className="text-xs">Unpublished</Badge>;
}
