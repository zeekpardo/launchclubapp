"use client";

import { Button } from "@repo/ui/components/button";
import {
	AlignLeftIcon,
	CalendarIcon,
	CheckSquareIcon,
	ChevronDownSquareIcon,
	FileIcon,
	HashIcon,
	ListIcon,
	TextIcon,
} from "lucide-react";

const FIELD_TYPES = [
	{ type: "TEXT", label: "Text", icon: TextIcon },
	{ type: "TEXTAREA", label: "Textarea", icon: AlignLeftIcon },
	{ type: "NUMBER", label: "Number", icon: HashIcon },
	{ type: "DATE", label: "Date", icon: CalendarIcon },
	{ type: "SELECT", label: "Select", icon: ChevronDownSquareIcon },
	{ type: "CHECKBOX", label: "Checkbox", icon: CheckSquareIcon },
	{ type: "RADIO", label: "Radio", icon: ListIcon },
	{ type: "FILE", label: "File", icon: FileIcon },
] as const;

interface FieldTypePickerProps {
	onAdd: (type: string) => void;
}

export function FieldTypePicker({ onAdd }: FieldTypePickerProps) {
	return (
		<div className="rounded-lg border bg-muted/30 p-3">
			<p className="text-xs font-medium text-muted-foreground mb-2">Add Field</p>
			<div className="grid grid-cols-4 gap-1.5">
				{FIELD_TYPES.map(({ type, label, icon: Icon }) => (
					<Button
						key={type}
						variant="outline"
						size="sm"
						className="flex flex-col h-auto gap-1 py-2 text-xs"
						onClick={() => onAdd(type)}
					>
						<Icon className="size-3.5" />
						{label}
					</Button>
				))}
			</div>
		</div>
	);
}
