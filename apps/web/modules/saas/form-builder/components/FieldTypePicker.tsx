"use client";

import type { LucideIcon } from "lucide-react";
import {
	ActivityIcon,
	AlertTriangleIcon,
	AlignLeftIcon,
	BookOpenIcon,
	CalendarIcon,
	CheckSquareIcon,
	ChevronDownSquareIcon,
	FileIcon,
	HashIcon,
	Heading2Icon,
	ListIcon,
	MapPinIcon,
	PhoneCallIcon,
	PhoneIcon,
	ShieldCheckIcon,
	SparklesIcon,
	StarIcon,
	TextIcon,
	UserIcon,
} from "lucide-react";

// ── Profile field definitions ────────────────────────────────────────────────

interface ProfileFieldDef {
	key: string;
	label: string;
	icon: LucideIcon;
}

export const PARENT_PROFILE_FIELDS: ProfileFieldDef[] = [
	{ key: "phone", label: "Phone", icon: PhoneIcon },
	{ key: "addressLine1", label: "Address", icon: MapPinIcon },
	{
		key: "emergency_contact_name",
		label: "Emergency Name",
		icon: PhoneCallIcon,
	},
	{
		key: "emergency_contact_phone",
		label: "Emergency Phone",
		icon: PhoneCallIcon,
	},
];

export const STUDENT_PROFILE_FIELDS: ProfileFieldDef[] = [
	{ key: "dateOfBirth", label: "Date of Birth", icon: CalendarIcon },
	{ key: "grade", label: "Grade", icon: BookOpenIcon },
	{ key: "allergies", label: "Allergies", icon: AlertTriangleIcon },
	{ key: "medicalNotes", label: "Medical Notes", icon: ActivityIcon },
];

export const MENTOR_PROFILE_FIELDS: ProfileFieldDef[] = [
	{ key: "phone", label: "Phone", icon: PhoneIcon },
	{ key: "addressLine1", label: "Address", icon: MapPinIcon },
	{ key: "dateOfBirth", label: "Date of Birth", icon: CalendarIcon },
	{
		key: "emergency_contact_name",
		label: "Emergency Name",
		icon: PhoneCallIcon,
	},
	{
		key: "emergency_contact_phone",
		label: "Emergency Phone",
		icon: PhoneCallIcon,
	},
];

const BASIC_FIELDS = [
	{ type: "TEXT", label: "Text", icon: TextIcon },
	{ type: "TEXTAREA", label: "Paragraph", icon: AlignLeftIcon },
	{ type: "NUMBER", label: "Number", icon: HashIcon },
	{ type: "DATE", label: "Date", icon: CalendarIcon },
	{ type: "SELECT", label: "Dropdown", icon: ChevronDownSquareIcon },
	{ type: "CHECKBOX", label: "Checkbox", icon: CheckSquareIcon },
	{ type: "RADIO", label: "Multiple choice", icon: ListIcon },
	{ type: "FILE", label: "File", icon: FileIcon },
	{ type: "HEADER", label: "Section heading", icon: Heading2Icon },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface FieldTypePickerProps {
	onAddBasic: (type: string) => void;

	// New form builder
	targetSection?: "PARENT" | "STUDENT" | null;
	onTargetSectionChange?: (section: "PARENT" | "STUDENT") => void;
	/** Profile field keys already on the active section (will be hidden) */
	addedProfileKeys?: Set<string>;
	onAddBuiltinField?: (key: string) => void;
	/** Called when user clicks "Custom field" — no id; canvas handles selection */
	onAddCustomField?: () => void;
	/** Consent items available to add as CONSENT fields */
	consentItems?: { id: string; name: string }[];
	/** IDs of consent items already added to the form */
	addedConsentIds?: Set<string>;
	/** Called when user clicks a consent item to add it */
	onAddConsentField?: (consentItemId: string) => void;
	/** When true, all add buttons are disabled — a pending unsaved field exists */
	pendingField?: boolean;

	// Legacy area builder (kept for AreaFormBuilder)
	availableProfileFields?: { id: string; name: string; type: string }[];
	onAddProfile?: (id: string) => void;
	availablePresetFields?: { id: string; label: string }[];
	onAddPreset?: (id: string) => void;
	organizationSlug?: string;
}

export function FieldTypePicker({
	onAddBasic,
	targetSection,
	onTargetSectionChange,
	addedProfileKeys = new Set(),
	onAddBuiltinField,
	onAddCustomField,
	consentItems,
	addedConsentIds = new Set(),
	onAddConsentField,
	pendingField = false,
	// legacy
	availableProfileFields = [],
	onAddProfile,
	availablePresetFields,
	onAddPreset,
	organizationSlug,
}: FieldTypePickerProps) {
	const isNewBuilder = targetSection !== undefined;

	// Pick the right profile field list
	const profileFieldDefs: ProfileFieldDef[] = !isNewBuilder
		? []
		: targetSection === "PARENT"
			? PARENT_PROFILE_FIELDS
			: targetSection === "STUDENT"
				? STUDENT_PROFILE_FIELDS
				: MENTOR_PROFILE_FIELDS;

	const availableProfileDefs = profileFieldDefs.filter(
		(f) => !addedProfileKeys.has(f.key),
	);

	return (
		<div className="rounded-lg border bg-card overflow-hidden text-sm">
			{/* Header */}
			<div className="px-4 py-3 border-b bg-muted/40 text-center">
				<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Add a Field
				</p>
			</div>

			{/* ── Pending field warning ──────────────────────────────────────── */}
			{pendingField && (
				<div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
					<p className="text-xs text-amber-700 dark:text-amber-400">
						Fill in and save the current field before adding
						another.
					</p>
				</div>
			)}

			{/* ── Section toggle (STUDENT forms) ─────────────────────────────── */}
			{isNewBuilder && onTargetSectionChange && (
				<div className="p-3 border-b">
					<p className="text-xs font-medium text-muted-foreground px-1 pb-2 uppercase tracking-wide">
						Adding to
					</p>
					<div className="flex gap-1">
						{(["PARENT", "STUDENT"] as const).map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => onTargetSectionChange(s)}
								className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
									targetSection === s
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}
							>
								{s === "PARENT" ? "Parent" : "Student"}
							</button>
						))}
					</div>
				</div>
			)}

			{/* ── Legacy area builder: optional preset fields ───────────────── */}
			{!isNewBuilder && availablePresetFields !== undefined && (
				<LegacyDropdownSection
					label="Optional Fields"
					items={availablePresetFields}
					onAdd={(id) => onAddPreset?.(id)}
					emptyLabel="All optional fields added."
				/>
			)}

			{/* ── Legacy area builder: custom profile fields ────────────────── */}
			{!isNewBuilder && (
				<LegacyDropdownSection
					label="Custom Profile Field"
					items={availableProfileFields.map((f) => ({
						id: f.id,
						label: f.name,
					}))}
					onAdd={(id) => onAddProfile?.(id)}
					emptyLabel="All custom fields added."
					organizationSlug={organizationSlug}
				/>
			)}

			{/* ── Profile Fields (new builder) ───────────────────────────────── */}
			{isNewBuilder && (
				<div className="p-3 border-b">
					<SectionHeader label="Profile Fields" icon={UserIcon} />
					<div className="grid grid-cols-2 gap-1 mt-2">
						{availableProfileDefs.map(
							({ key, label, icon: Icon }) => (
								<FieldButton
									key={key}
									icon={Icon}
									label={label}
									disabled={pendingField}
									onClick={() => onAddBuiltinField?.(key)}
								/>
							),
						)}
						<FieldButton
							icon={SparklesIcon}
							label="Custom field"
							disabled={pendingField}
							onClick={() => onAddCustomField?.()}
						/>
					</div>
					{availableProfileDefs.length === 0 && (
						<p className="text-xs text-muted-foreground px-1 mt-1">
							All profile fields added.
						</p>
					)}
				</div>
			)}

			{/* ── Consent Fields (new builder) ───────────────────────────────── */}
			{isNewBuilder && consentItems && consentItems.length > 0 && (
				<div className="p-3 border-b">
					<SectionHeader label="Consent" icon={ShieldCheckIcon} />
					<div className="grid grid-cols-2 gap-1 mt-2">
						{consentItems
							.filter((item) => !addedConsentIds.has(item.id))
							.map((item) => (
								<FieldButton
									key={item.id}
									icon={ShieldCheckIcon}
									label={item.name}
									disabled={pendingField}
									onClick={() => onAddConsentField?.(item.id)}
								/>
							))}
					</div>
					{consentItems.every((item) =>
						addedConsentIds.has(item.id),
					) && (
						<p className="text-xs text-muted-foreground px-1 mt-1">
							All consent items added.
						</p>
					)}
				</div>
			)}

			{/* ── Basic Fields ───────────────────────────────────────────────── */}
			<div className="p-3">
				<SectionHeader label="Basic Fields" icon={StarIcon} />
				<div className="grid grid-cols-2 gap-1 mt-2">
					{BASIC_FIELDS.map(({ type, label, icon: Icon }) => (
						<FieldButton
							key={type}
							icon={Icon}
							label={label}
							disabled={pendingField}
							onClick={() => onAddBasic(type)}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({
	label,
	icon: Icon,
}: {
	label: string;
	icon: LucideIcon;
}) {
	return (
		<div className="flex items-center gap-1.5 px-1">
			<Icon className="size-3 text-muted-foreground" />
			<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
				{label}
			</p>
		</div>
	);
}

function FieldButton({
	icon: Icon,
	label,
	onClick,
	disabled,
}: {
	icon: LucideIcon;
	label: string;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className="flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-2 text-left text-xs text-foreground hover:bg-muted hover:border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-border/60"
		>
			<Icon className="size-3.5 text-muted-foreground shrink-0" />
			<span className="truncate">{label}</span>
		</button>
	);
}

function LegacyDropdownSection({
	label,
	items,
	onAdd,
	emptyLabel,
	organizationSlug,
}: {
	label: string;
	items: { id: string; label: string }[];
	onAdd: (id: string) => void;
	emptyLabel: string;
	organizationSlug?: string;
}) {
	const [selected, setSelected] = React.useState("");

	return (
		<div className="p-3 border-b">
			<p className="text-xs font-medium text-muted-foreground px-1 pt-1 pb-2 uppercase tracking-wide">
				{label}
			</p>
			{items.length === 0 ? (
				<p className="text-xs text-muted-foreground px-1 pb-1">
					{emptyLabel}{" "}
					{organizationSlug && (
						<a
							href={`/app/${organizationSlug}/settings/custom-fields`}
							className="underline hover:text-foreground"
						>
							Manage fields
						</a>
					)}
				</p>
			) : (
				<div className="flex gap-1.5 px-1">
					<select
						className="flex-1 min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
						value={selected}
						onChange={(e) => setSelected(e.target.value)}
					>
						<option value="">Select a field…</option>
						{items.map((f) => (
							<option key={f.id} value={f.id}>
								{f.label}
							</option>
						))}
					</select>
					<button
						type="button"
						disabled={!selected}
						onClick={() => {
							if (selected) {
								onAdd(selected);
								setSelected("");
							}
						}}
						className="shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
					>
						Add
					</button>
				</div>
			)}
		</div>
	);
}

// need React for useState in LegacyDropdownSection
import React from "react";
