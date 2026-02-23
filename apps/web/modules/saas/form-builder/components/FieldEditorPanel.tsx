"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { PlusIcon, TrashIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useUpdateFormField } from "../hooks/use-form-fields";
import type { FormFieldItem } from "./FieldCard";

interface FieldOption {
	label: string;
	value: string;
}

interface FieldEditorPanelProps {
	field: FormFieldItem;
	areaId: string;
	onClose: () => void;
}

function slugify(str: string) {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "");
}

export function FieldEditorPanel({ field, areaId, onClose }: FieldEditorPanelProps) {
	const updateField = useUpdateFormField(areaId);

	const [label, setLabel] = useState(field.label);
	const [fieldKey, setFieldKey] = useState(field.fieldKey);
	const [placeholder, setPlaceholder] = useState(field.placeholder ?? "");
	const [helpText, setHelpText] = useState(field.helpText ?? "");
	const [required, setRequired] = useState(field.required);
	const [options, setOptions] = useState<FieldOption[]>(
		Array.isArray(field.options) ? (field.options as FieldOption[]) : [],
	);

	// Auto-generate fieldKey from label (only when user hasn't manually changed it)
	const [keyEdited, setKeyEdited] = useState(false);
	useEffect(() => {
		if (!keyEdited) {
			setFieldKey(slugify(label));
		}
	}, [label, keyEdited]);

	const needsOptions = ["SELECT", "RADIO"].includes(field.type);

	const handleSave = async () => {
		try {
			await updateField.mutateAsync({
				id: field.id,
				label,
				fieldKey,
				placeholder: placeholder || undefined,
				helpText: helpText || undefined,
				required,
				options: needsOptions ? options : undefined,
			});
			toastSuccess("Field saved.");
			onClose();
		} catch {
			toastError("Failed to save field.");
		}
	};

	const addOption = () => setOptions((prev) => [...prev, { label: "", value: "" }]);

	const updateOption = (index: number, key: "label" | "value", val: string) => {
		setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, [key]: val } : o)));
	};

	const removeOption = (index: number) => {
		setOptions((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<div className="rounded-lg border bg-card p-4 space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm font-semibold">Edit Field</p>
				<Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
					<XIcon className="size-4" />
				</Button>
			</div>

			<div className="space-y-3">
				<div className="space-y-1.5">
					<Label htmlFor="field-label">Label</Label>
					<Input
						id="field-label"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="field-key">Field Key</Label>
					<Input
						id="field-key"
						value={fieldKey}
						onChange={(e) => {
							setKeyEdited(true);
							setFieldKey(e.target.value);
						}}
					/>
					<p className="text-xs text-muted-foreground">
						Used to identify this field in submissions.
					</p>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="field-placeholder">Placeholder</Label>
					<Input
						id="field-placeholder"
						value={placeholder}
						onChange={(e) => setPlaceholder(e.target.value)}
					/>
				</div>

				<div className="space-y-1.5">
					<Label htmlFor="field-help">Help Text</Label>
					<Textarea
						id="field-help"
						value={helpText}
						onChange={(e) => setHelpText(e.target.value)}
						rows={2}
					/>
				</div>

				<div className="flex items-center gap-3">
					<Switch
						id="field-required"
						checked={required}
						onCheckedChange={setRequired}
					/>
					<Label htmlFor="field-required">Required</Label>
				</div>

				{needsOptions && (
					<div className="space-y-2">
						<Label>Options</Label>
						{options.map((opt, i) => (
							<div key={i} className="flex gap-2">
								<Input
									placeholder="Label"
									value={opt.label}
									onChange={(e) => updateOption(i, "label", e.target.value)}
								/>
								<Input
									placeholder="Value"
									value={opt.value}
									onChange={(e) => updateOption(i, "value", e.target.value)}
								/>
								<Button
									variant="ghost"
									size="icon"
									className="size-9 shrink-0 text-destructive hover:text-destructive"
									onClick={() => removeOption(i)}
								>
									<TrashIcon className="size-3.5" />
								</Button>
							</div>
						))}
						<Button variant="outline" size="sm" className="gap-1.5" onClick={addOption}>
							<PlusIcon className="size-3.5" />
							Add Option
						</Button>
					</div>
				)}
			</div>

			<div className="flex gap-2 pt-2">
				<Button variant="outline" size="sm" onClick={onClose}>
					Cancel
				</Button>
				<Button size="sm" onClick={handleSave} disabled={updateField.isPending}>
					{updateField.isPending ? "Saving..." : "Save"}
				</Button>
			</div>
		</div>
	);
}
