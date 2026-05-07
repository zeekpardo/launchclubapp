"use client";

import { useState, useRef } from "react";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { orpcClient } from "@shared/lib/orpc-client";
import { DownloadIcon } from "lucide-react";

const GRADES = [
	"Pre-K",
	"Kindergarten",
	"1st Grade",
	"2nd Grade",
	"3rd Grade",
	"4th Grade",
	"5th Grade",
	"6th Grade",
	"7th Grade",
	"8th Grade",
	"9th Grade",
	"10th Grade",
	"11th Grade",
	"12th Grade",
];

interface FieldOption {
	label: string;
	value: string;
}

export interface PublicFormField {
	id: string;
	label: string;
	fieldKey: string;
	type: string;
	required: boolean;
	placeholder?: string | null;
	helpText?: string | null;
	options?: unknown;
	profileFieldKey?: string | null;
	targetPersonType?: string | null;
	customField?: { type: string; options: string[] } | null;
	consentItem?: { id: string; name: string; pdfKey?: string | null; downloadUrl?: string | null } | null;
}

interface FormFieldRendererProps {
	field: PublicFormField;
	value: string;
	onChange: (value: string) => void;
}

function FieldWrapper({
	field,
	children,
	hideLabel,
}: {
	field: PublicFormField;
	children: React.ReactNode;
	hideLabel?: boolean;
}) {
	return (
		<div className="space-y-1.5">
			{!hideLabel && (
				<Label htmlFor={`field-${field.id}`}>
					{field.label}
					{field.required && <span className="ml-1 text-destructive">*</span>}
				</Label>
			)}
			{children}
			{field.helpText && (
				<p className="text-xs text-muted-foreground">{field.helpText}</p>
			)}
		</div>
	);
}

function NativeSelect({
	id,
	value,
	onChange,
	children,
}: {
	id: string;
	value: string;
	onChange: (v: string) => void;
	children: React.ReactNode;
}) {
	return (
		<select
			id={id}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
		>
			{children}
		</select>
	);
}

function renderProfileField(
	field: PublicFormField,
	value: string,
	onChange: (v: string) => void,
): React.ReactNode {
	const id = `field-${field.id}`;

	switch (field.profileFieldKey) {
		case "grade":
			return (
				<FieldWrapper field={field}>
					<NativeSelect id={id} value={value} onChange={onChange}>
						<option value="">Select a grade…</option>
						{GRADES.map((g) => (
							<option key={g} value={g}>{g}</option>
						))}
					</NativeSelect>
				</FieldWrapper>
			);

		case "dateOfBirth":
			return (
				<FieldWrapper field={field}>
					<Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
				</FieldWrapper>
			);

		case "email":
			return (
				<FieldWrapper field={field}>
					<Input id={id} type="email" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? undefined} />
				</FieldWrapper>
			);

		case "phone":
		case "emergency_contact_phone":
			return (
				<FieldWrapper field={field}>
					<Input
						id={id}
						type="tel"
						value={value}
						onChange={(e) => onChange(e.target.value.replace(/[^\d\s\-()+.]/g, ""))}
						placeholder={field.placeholder ?? undefined}
					/>
				</FieldWrapper>
			);

		case "notes":
		case "allergies":
		case "medicalNotes":
			return (
				<FieldWrapper field={field}>
					<Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={field.placeholder ?? undefined} />
				</FieldWrapper>
			);

		default:
			// addressLine1, emergency_contact_name, studentId, etc.
			return (
				<FieldWrapper field={field}>
					<Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? undefined} />
				</FieldWrapper>
			);
	}
}

function renderCustomField(
	field: PublicFormField,
	value: string,
	onChange: (v: string) => void,
): React.ReactNode {
	const id = `field-${field.id}`;
	const cf = field.customField;
	if (!cf) return null;

	switch (cf.type) {
		case "TEXTAREA":
			return (
				<FieldWrapper field={field}>
					<Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={field.placeholder ?? undefined} />
				</FieldWrapper>
			);

		case "NUMBER":
			return (
				<FieldWrapper field={field}>
					<Input id={id} type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? undefined} />
				</FieldWrapper>
			);

		case "CHECKBOX":
			return (
				<div className="flex items-start gap-2.5">
					<input
						id={id}
						type="checkbox"
						checked={value === "true"}
						onChange={(e) => onChange(e.target.checked ? "true" : "false")}
						className="mt-0.5 size-4 rounded border-border"
					/>
					<div className="space-y-0.5">
						<Label htmlFor={id} className="font-normal cursor-pointer">
							{field.label}
							{field.required && <span className="ml-1 text-destructive">*</span>}
						</Label>
						{field.helpText && (
							<p className="text-xs text-muted-foreground">{field.helpText}</p>
						)}
					</div>
				</div>
			);

		case "SELECT":
			return (
				<FieldWrapper field={field}>
					<NativeSelect id={id} value={value} onChange={onChange}>
						<option value="">Select an option…</option>
						{cf.options.map((opt) => (
							<option key={opt} value={opt}>{opt}</option>
						))}
					</NativeSelect>
				</FieldWrapper>
			);

		case "DATE":
			return (
				<FieldWrapper field={field}>
					<Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
				</FieldWrapper>
			);

		case "FILE":
			return (
				<FieldWrapper field={field}>
					<Input id={id} type="file" onChange={(e) => onChange(e.target.value)} />
				</FieldWrapper>
			);

		default:
			return (
				<FieldWrapper field={field}>
					<Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? undefined} />
				</FieldWrapper>
			);
	}
}

export function FormFieldRenderer({ field, value, onChange }: FormFieldRendererProps) {
	const options = Array.isArray(field.options) ? (field.options as FieldOption[]) : [];
	const id = `field-${field.id}`;

	if (field.type === "HEADER") {
		return (
			<div className="border-b pb-3 pt-2">
				<p className="font-semibold text-base">{field.label}</p>
				{field.helpText && (
					<p className="text-sm text-muted-foreground mt-0.5">{field.helpText}</p>
				)}
			</div>
		);
	}

	if (field.type === "SITE_SELECTOR") return null;

	if (field.type === "PROFILE") {
		return <>{renderProfileField(field, value, onChange)}</>;
	}

	if (field.type === "CUSTOM") {
		return <>{renderCustomField(field, value, onChange)}</>;
	}

	if (field.type === "CONSENT") {
		return (
			<ConsentField
				id={id}
				field={field}
				value={value}
				onChange={onChange}
			/>
		);
	}

	// ── Standard field types ───────────────────────────────────────────────────

	const label = (
		<Label htmlFor={id}>
			{field.label}
			{field.required && <span className="ml-1 text-destructive">*</span>}
		</Label>
	);
	const helpText = field.helpText ? (
		<p className="text-xs text-muted-foreground">{field.helpText}</p>
	) : null;

	switch (field.type) {
		case "TEXTAREA":
			return (
				<div className="space-y-1.5">
					{label}
					<Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? undefined} rows={4} />
					{helpText}
				</div>
			);

		case "SELECT":
			return (
				<div className="space-y-1.5">
					{label}
					<NativeSelect id={id} value={value} onChange={onChange}>
						<option value="">Select an option…</option>
						{options.map((opt) => (
							<option key={opt.value} value={opt.value}>{opt.label}</option>
						))}
					</NativeSelect>
					{helpText}
				</div>
			);

		case "CHECKBOX":
			return (
				<div className="flex items-start gap-2.5">
					<input
						id={id}
						type="checkbox"
						checked={value === "true"}
						onChange={(e) => onChange(e.target.checked ? "true" : "false")}
						className="mt-0.5 size-4 rounded border-border"
					/>
					<div className="space-y-0.5">
						<Label htmlFor={id} className="font-normal cursor-pointer">
							{field.label}
							{field.required && <span className="ml-1 text-destructive">*</span>}
						</Label>
						{helpText}
					</div>
				</div>
			);

		case "DATE":
			return (
				<div className="space-y-1.5">
					{label}
					<Input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)} />
					{helpText}
				</div>
			);

		case "NUMBER":
			return (
				<div className="space-y-1.5">
					{label}
					<Input id={id} type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? undefined} />
					{helpText}
				</div>
			);

		case "FILE":
			return (
				<div className="space-y-1.5">
					{label}
					<Input id={id} type="file" onChange={(e) => onChange(e.target.value)} />
					{helpText}
				</div>
			);

		case "RADIO":
			return (
				<div className="space-y-1.5">
					{label}
					<div className="space-y-2">
						{options.map((opt) => (
							<label key={opt.value} className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name={`field-${field.id}`}
									value={opt.value}
									checked={value === opt.value}
									onChange={() => onChange(opt.value)}
									className="size-4"
								/>
								<span className="text-sm">{opt.label}</span>
							</label>
						))}
					</div>
					{helpText}
				</div>
			);

		default:
			return (
				<div className="space-y-1.5">
					{label}
					<Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? undefined} />
					{helpText}
				</div>
			);
	}
}

// ── Consent Field ─────────────────────────────────────────────────────────────

function ConsentField({
	id,
	field,
	value,
	onChange,
}: {
	id: string;
	field: PublicFormField;
	value: string;
	onChange: (v: string) => void;
}) {
	const consentName = field.consentItem?.name ?? field.label;
	const downloadUrl = field.consentItem?.downloadUrl;
	const consentItemId = field.consentItem?.id;

	const isChecked = value === "true" || value.startsWith("agreed:");
	const uploadedFileKey = value.startsWith("agreed:") ? value.slice("agreed:".length) : null;

	const [uploading, setUploading] = useState(false);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleCheck = (checked: boolean) => {
		if (!checked) {
			onChange("false");
		} else {
			onChange("true");
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !consentItemId) return;

		setUploading(true);
		setUploadError(null);

		try {
			const { uploadUrl, fileKey } = await orpcClient.forms.publicConsentUploadUrl({ consentItemId });

			const upload = await fetch(uploadUrl, {
				method: "PUT",
				headers: { "Content-Type": "application/pdf" },
				body: file,
			});
			if (!upload.ok) throw new Error("Upload failed");

			onChange(`agreed:${fileKey}`);
		} catch {
			setUploadError("Upload failed. Please try again.");
		} finally {
			setUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleRemoveFile = () => {
		onChange("true");
	};

	return (
		<div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
			{/* Header: name + download link */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-3 min-w-0">
					<input
						id={id}
						type="checkbox"
						checked={isChecked}
						onChange={(e) => handleCheck(e.target.checked)}
						className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
					/>
					<div className="space-y-1 min-w-0">
						<Label htmlFor={id} className="cursor-pointer leading-snug">
							{consentName}
							{field.required && <span className="ml-1 text-destructive">*</span>}
						</Label>
						{field.helpText && (
							<p className="text-xs text-muted-foreground">{field.helpText}</p>
						)}
					</div>
				</div>
				{downloadUrl && (
					<a
						href={downloadUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex shrink-0 items-center gap-1 max-w-[140px] text-xs font-medium text-primary hover:text-primary/80"
						title={`${consentName}.pdf`}
					>
						<DownloadIcon className="size-3 shrink-0" />
						<span className="truncate">{consentName}.pdf</span>
					</a>
				)}
			</div>

			{/* Upload section — shown when checked */}
			{isChecked && (
				<div className="ml-7 space-y-2">
					{uploadedFileKey ? (
						<div className="flex items-center gap-2 text-sm">
							<span className="text-green-600 dark:text-green-400 font-medium">✓ Signed form uploaded</span>
							<button
								type="button"
								onClick={handleRemoveFile}
								className="text-xs text-muted-foreground underline hover:text-foreground"
							>
								Remove
							</button>
						</div>
					) : (
						<div className="space-y-1">
							<p className="text-xs text-muted-foreground">
								Upload your signed copy <span className="opacity-60">(optional)</span>
							</p>
							<label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs hover:bg-muted transition-colors">
								{uploading ? "Uploading…" : "Choose PDF file"}
								<input
									ref={fileInputRef}
									type="file"
									accept="application/pdf"
									className="sr-only"
									disabled={uploading}
									onChange={handleFileChange}
								/>
							</label>
							{uploadError && (
								<p className="text-xs text-destructive">{uploadError}</p>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
