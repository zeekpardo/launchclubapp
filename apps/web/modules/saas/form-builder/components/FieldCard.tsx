"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, Heading2Icon, PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";

export interface FormFieldItem {
	id: string;
	label: string;
	fieldKey: string;
	type: string;
	required: boolean;
	order: number;
	placeholder?: string | null;
	helpText?: string | null;
	options?: unknown;
	validation?: unknown;
	areaId?: string | null;
	siteId?: string | null;
	customFieldId?: string | null;
	profileFieldKey?: string | null;
	targetPersonType?: string | null;
	consentItemId?: string | null;
}

interface FieldOption {
	label: string;
	value: string;
}

function slugify(str: string) {
	return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

interface FieldCardProps {
	field: FormFieldItem;
	locked?: boolean;
	expanded?: boolean;
	onToggle?: (field: FormFieldItem) => void;
	onDelete?: (id: string) => void;
	onSave?: (id: string, data: Partial<FormFieldItem & { options: FieldOption[]; customFieldId?: string }>) => Promise<void>;
	customFieldOptions?: { id: string; name: string }[];
}

export function FieldCard({ field, locked, expanded, onToggle, onDelete, onSave, customFieldOptions }: FieldCardProps) {
	const isHeader = field.type === "HEADER";
	const isCustom = field.type === "CUSTOM";
	const isConsent = field.type === "CONSENT";
	const isUnresolvedCustom = isCustom && !field.customFieldId;
	const needsOptions = ["SELECT", "RADIO"].includes(field.type);

	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: field.id,
		disabled: locked || expanded,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};

	const [label, setLabel] = useState(field.label);
	const [placeholder, setPlaceholder] = useState(field.placeholder ?? "");
	const [helpText, setHelpText] = useState(field.helpText ?? "");
	const [required, setRequired] = useState(field.required);
	const [options, setOptions] = useState<FieldOption[]>(
		Array.isArray(field.options) ? (field.options as FieldOption[]) : [],
	);
	const [pendingCustomFieldId, setPendingCustomFieldId] = useState(field.customFieldId ?? "");
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setLabel(field.label);
		setPlaceholder(field.placeholder ?? "");
		setHelpText(field.helpText ?? "");
		setRequired(field.required);
		setOptions(Array.isArray(field.options) ? (field.options as FieldOption[]) : []);
		setPendingCustomFieldId(field.customFieldId ?? "");
	}, [field.id]);

	const handleCustomFieldSelect = (id: string) => {
		setPendingCustomFieldId(id);
		const cf = customFieldOptions?.find((f) => f.id === id);
		if (cf) setLabel(cf.name);
	};

	const handleSave = async () => {
		if (!onSave) return;

		if (!label.trim()) {
			setError("Field name is required.");
			return;
		}
		if (needsOptions && options.filter((o) => o.label.trim()).length === 0) {
			setError("Add at least one option.");
			return;
		}
		if (isCustom && !pendingCustomFieldId) {
			setError("Select a custom field.");
			return;
		}

		setError(null);
		setSaving(true);
		try {
			await onSave(field.id, {
				label,
				fieldKey: slugify(label),
				placeholder: !isHeader ? (placeholder || undefined) : undefined,
				helpText: helpText || undefined,
				required: !isHeader ? required : false,
				options: needsOptions ? options : undefined,
				customFieldId: isCustom ? (pendingCustomFieldId || undefined) : undefined,
			});
			onToggle?.(field);
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		setLabel(field.label);
		setPlaceholder(field.placeholder ?? "");
		setHelpText(field.helpText ?? "");
		setRequired(field.required);
		setOptions(Array.isArray(field.options) ? (field.options as FieldOption[]) : []);
		onToggle?.(field);
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`rounded-lg border bg-card transition-shadow ${expanded ? "shadow-md ring-1 ring-primary/30" : ""} ${locked ? "opacity-60" : ""}`}
		>
			{/* Row — always visible */}
			{isHeader ? (
				<div className="flex items-center gap-2 px-3 py-3">
					{locked ? (
						<div className="size-4 shrink-0" />
					) : (
						<button
							type="button"
							className="cursor-grab text-muted-foreground hover:text-foreground touch-none shrink-0"
							{...attributes}
							{...listeners}
						>
							<GripVerticalIcon className="size-4" />
						</button>
					)}
					<button
						type="button"
						className="flex-1 min-w-0 text-left"
						onClick={() => !locked && onToggle?.(field)}
					>
						<div className="flex items-center gap-2">
							<Heading2Icon className="size-3.5 text-muted-foreground shrink-0" />
							<p className="text-sm font-semibold truncate">
								{field.label || <span className="italic text-muted-foreground font-normal">Untitled header</span>}
							</p>
						</div>
						{field.helpText && (
							<p className="text-xs text-muted-foreground truncate mt-0.5 pl-5">{field.helpText}</p>
						)}
					</button>
					{!locked && (
						<Button
							variant="ghost"
							size="icon"
							className="size-7 text-muted-foreground hover:text-destructive shrink-0"
							onClick={(e) => { e.stopPropagation(); onDelete?.(field.id); }}
						>
							<TrashIcon className="size-3.5" />
						</Button>
					)}
				</div>
			) : isConsent ? (
				<div className="flex items-center gap-2 px-3 py-2.5">
					{locked ? (
						<div className="size-4 shrink-0" />
					) : (
						<button
							type="button"
							className="cursor-grab text-muted-foreground hover:text-foreground touch-none shrink-0"
							{...attributes}
							{...listeners}
						>
							<GripVerticalIcon className="size-4" />
						</button>
					)}

					<p className="flex-1 min-w-0 text-sm font-medium truncate">
						{field.label || <span className="italic text-muted-foreground">Consent</span>}
					</p>

					<div className="flex items-center gap-1.5 shrink-0">
						<Badge status="info" className="text-xs">consent</Badge>
						{!locked && (
							<Button
								variant="ghost"
								size="icon"
								className="size-7 text-muted-foreground hover:text-destructive"
								onClick={(e) => { e.stopPropagation(); onDelete?.(field.id); }}
							>
								<TrashIcon className="size-3.5" />
							</Button>
						)}
					</div>
				</div>
			) : (
				<div className="flex items-center gap-2 px-3 py-2.5">
					{locked ? (
						<div className="size-4 shrink-0" />
					) : (
						<button
							type="button"
							className="cursor-grab text-muted-foreground hover:text-foreground touch-none shrink-0"
							{...attributes}
							{...listeners}
						>
							<GripVerticalIcon className="size-4" />
						</button>
					)}

					<button
						type="button"
						className="flex-1 min-w-0 text-left py-0.5"
						onClick={() => !locked && onToggle?.(field)}
					>
						<p className="text-sm font-medium truncate">
							{isUnresolvedCustom
								? <span className="italic text-muted-foreground">Select a custom field…</span>
								: field.label || <span className="italic text-muted-foreground">Untitled field</span>}
						</p>
					</button>

					<div className="flex items-center gap-1.5 shrink-0">
						<Badge status={isUnresolvedCustom ? "warning" : "info"} className="text-xs capitalize">
							{isUnresolvedCustom ? "pending" : field.type.toLowerCase()}
						</Badge>
						{field.required && (
							<Badge status="error" className="text-xs">Required</Badge>
						)}
						{!locked && (
							<Button
								variant="ghost"
								size="icon"
								className="size-7 text-muted-foreground hover:text-destructive"
								onClick={(e) => { e.stopPropagation(); onDelete?.(field.id); }}
							>
								<TrashIcon className="size-3.5" />
							</Button>
						)}
					</div>
				</div>
			)}

			{/* Inline edit form — expanded only (not for CONSENT fields) */}
			{expanded && !locked && !isConsent && (
				<div className="border-t px-4 py-4 space-y-4 bg-muted/20">
					{isHeader ? (
						<>
							<div className="space-y-1.5">
								<Label htmlFor={`label-${field.id}`}>Title</Label>
								<Input
									id={`label-${field.id}`}
									value={label}
									onChange={(e) => setLabel(e.target.value)}
									placeholder="Section title"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor={`help-${field.id}`}>Description</Label>
								<Textarea
									id={`help-${field.id}`}
									value={helpText}
									onChange={(e) => setHelpText(e.target.value)}
									placeholder="Optional description for this section"
									rows={2}
								/>
							</div>
						</>
					) : (
						<>
							{/* Custom field selector — shown when type is CUSTOM */}
							{isCustom && customFieldOptions && (
								<div className="space-y-1.5">
									<Label htmlFor={`custom-field-${field.id}`}>Custom Field</Label>
									<select
										id={`custom-field-${field.id}`}
										className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
										value={pendingCustomFieldId}
										onChange={(e) => { handleCustomFieldSelect(e.target.value); setError(null); }}
									>
										<option value="">Select a custom field…</option>
										{customFieldOptions.map((cf) => (
											<option key={cf.id} value={cf.id}>{cf.name}</option>
										))}
									</select>
								</div>
							)}

							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-1.5">
									<Label htmlFor={`label-${field.id}`}>Label</Label>
									<Input
										id={`label-${field.id}`}
										value={label}
										onChange={(e) => { setLabel(e.target.value); setError(null); }}
										placeholder="Enter field name…"
									/>
								</div>
								<div className="space-y-1.5">
									<Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
									<Input
										id={`placeholder-${field.id}`}
										value={placeholder}
										onChange={(e) => setPlaceholder(e.target.value)}
									/>
								</div>
							</div>

							<div className="space-y-1.5">
								<Label htmlFor={`help-${field.id}`}>Help Text</Label>
								<Textarea
									id={`help-${field.id}`}
									value={helpText}
									onChange={(e) => setHelpText(e.target.value)}
									rows={2}
								/>
							</div>

							{needsOptions && (
								<div className="space-y-2">
									<Label>Options</Label>
									{options.map((opt, i) => (
										<div key={i} className="flex items-center gap-2">
											<GripVerticalIcon className="size-4 text-muted-foreground shrink-0" />
											<Input
												placeholder="Option label"
												value={opt.label}
												onChange={(e) =>
													setOptions((prev) =>
														prev.map((o, idx) =>
															idx === i
																? { label: e.target.value, value: slugify(e.target.value) }
																: o,
														),
													)
												}
												className="flex-1"
											/>
											<Button
												variant="ghost"
												size="icon"
												className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
												onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
											>
												<TrashIcon className="size-3.5" />
											</Button>
										</div>
									))}
									<Button
										variant="outline"
										size="sm"
										className="gap-1.5"
										onClick={() => { setOptions((prev) => [...prev, { label: "", value: "" }]); setError(null); }}
									>
										<PlusIcon className="size-3.5" />
										Add option
									</Button>
								</div>
							)}

							<div className="flex items-center gap-2 border-t pt-3">
								<Switch
									id={`required-${field.id}`}
									checked={required}
									onCheckedChange={setRequired}
								/>
								<Label htmlFor={`required-${field.id}`} className="font-normal cursor-pointer">
									Required
								</Label>
							</div>
						</>
					)}

					{error && (
						<p className="text-xs text-destructive -mb-1">{error}</p>
					)}
					<div className="flex justify-end gap-2 border-t pt-3">
						<Button variant="ghost" size="sm" onClick={handleCancel}>
							Cancel
						</Button>
						<Button size="sm" onClick={handleSave} disabled={saving}>
							{saving ? "Saving…" : "Save"}
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
