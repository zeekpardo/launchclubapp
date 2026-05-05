"use client";

import {
	AlignLeftIcon,
	CalendarIcon,
	CheckSquareIcon,
	ChevronDownSquareIcon,
	FileIcon,
	HashIcon,
	Heading2Icon,
	ListIcon,
	TextIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const BASIC_FIELD_TYPES = [
	{ type: "HEADER", label: "Header", icon: Heading2Icon },
	{ type: "TEXT", label: "Text", icon: TextIcon },
	{ type: "TEXTAREA", label: "Paragraph", icon: AlignLeftIcon },
	{ type: "NUMBER", label: "Number", icon: HashIcon },
	{ type: "DATE", label: "Date", icon: CalendarIcon },
	{ type: "SELECT", label: "Dropdown", icon: ChevronDownSquareIcon },
	{ type: "CHECKBOX", label: "Checkbox", icon: CheckSquareIcon },
	{ type: "RADIO", label: "Radio", icon: ListIcon },
	{ type: "FILE", label: "File", icon: FileIcon },
] as const;

interface AvailableProfileField {
	id: string;
	name: string;
	type: string;
}

interface FieldTypePickerProps {
	onAddBasic: (type: string) => void;
	availableProfileFields?: AvailableProfileField[];
	onAddProfile?: (id: string) => void;
	organizationSlug?: string;
}

export function FieldTypePicker({
	onAddBasic,
	availableProfileFields = [],
	onAddProfile,
	organizationSlug,
}: FieldTypePickerProps) {
	const [selectedCustomFieldId, setSelectedCustomFieldId] = useState("");

	return (
		<div className="rounded-lg border bg-card overflow-hidden">
			<div className="px-4 py-3 border-b bg-muted/40 text-center">
				<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Add a Field
				</p>
			</div>

			{/* Child Profile Fields — custom fields only */}
			<div className="p-3 border-b">
				<p className="text-xs font-medium text-muted-foreground px-2 pt-1 pb-2 uppercase tracking-wide">
					Custom Profile Field
				</p>
				{availableProfileFields.length === 0 ? (
					<p className="text-xs text-muted-foreground px-2 pb-1">
						All custom fields added.{" "}
						{organizationSlug && (
							<Link
								href={`/app/${organizationSlug}/settings/custom-fields`}
								className="underline hover:text-foreground"
							>
								Manage fields
							</Link>
						)}
					</p>
				) : (
					<div className="flex gap-1.5 px-2">
						<select
							className="flex-1 min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
							value={selectedCustomFieldId}
							onChange={(e) => setSelectedCustomFieldId(e.target.value)}
						>
							<option value="">Select a field…</option>
							{availableProfileFields.map((f) => (
								<option key={f.id} value={f.id}>
									{f.name}
								</option>
							))}
						</select>
						<button
							type="button"
							disabled={!selectedCustomFieldId}
							onClick={() => {
								if (selectedCustomFieldId) {
									onAddProfile?.(selectedCustomFieldId);
									setSelectedCustomFieldId("");
								}
							}}
							className="shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
						>
							Add
						</button>
					</div>
				)}
			</div>

			{/* Basic Fields */}
			<div className="p-3">
				<p className="text-xs font-medium text-muted-foreground px-2 pt-1 pb-2 uppercase tracking-wide">
					Basic Fields
				</p>
				<div className="grid grid-cols-2 gap-0.5">
					{BASIC_FIELD_TYPES.map(({ type, label, icon: Icon }) => (
						<button
							key={type}
							type="button"
							className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm text-left hover:bg-muted transition-colors group"
							onClick={() => onAddBasic(type)}
						>
							<Icon className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
							<span className="text-muted-foreground group-hover:text-foreground transition-colors">
								{label}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
