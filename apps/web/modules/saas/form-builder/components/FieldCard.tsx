"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, PencilIcon, TrashIcon } from "lucide-react";

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
}

interface FieldCardProps {
	field: FormFieldItem;
	locked?: boolean;
	selected?: boolean;
	onSelect?: (field: FormFieldItem) => void;
	onDelete?: (id: string) => void;
}

export function FieldCard({ field, locked, selected, onSelect, onDelete }: FieldCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: field.id,
		disabled: locked,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 ${
				selected ? "ring-2 ring-primary" : ""
			} ${locked ? "opacity-60" : ""}`}
		>
			{!locked && (
				<button
					type="button"
					className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
					{...attributes}
					{...listeners}
				>
					<GripVerticalIcon className="size-4" />
				</button>
			)}
			{locked && <div className="size-4" />}

			<button
				type="button"
				className="flex-1 min-w-0 text-left"
				onClick={() => !locked && onSelect?.(field)}
			>
				<p className="text-sm font-medium truncate">{field.label}</p>
				<p className="text-xs text-muted-foreground">{field.fieldKey}</p>
			</button>

			<div className="flex items-center gap-1.5 shrink-0">
				<Badge status="info" className="text-xs capitalize">
					{field.type.toLowerCase()}
				</Badge>
				{field.required && (
					<Badge status="error" className="text-xs">
						Required
					</Badge>
				)}
			</div>

			{!locked && (
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="size-7"
						onClick={() => onSelect?.(field)}
					>
						<PencilIcon className="size-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="size-7 text-destructive hover:text-destructive"
						onClick={() => onDelete?.(field.id)}
					>
						<TrashIcon className="size-3.5" />
					</Button>
				</div>
			)}
		</div>
	);
}
