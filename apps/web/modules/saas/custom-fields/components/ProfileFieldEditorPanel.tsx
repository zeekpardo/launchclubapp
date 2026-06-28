"use client";

import { Button } from "@repo/ui/components/button";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { useUpdateCustomField } from "../hooks/use-custom-fields";

interface ProfileField {
	id: string;
	name: string;
	type: string;
	required: boolean;
}

interface ProfileFieldEditorPanelProps {
	field: ProfileField;
	organizationId: string;
	/** Fields that can be swapped in (not currently linked) */
	availableFields: ProfileField[];
	onClose: () => void;
}

export function ProfileFieldEditorPanel({
	field,
	organizationId,
	availableFields,
	onClose,
}: ProfileFieldEditorPanelProps) {
	const updateField = useUpdateCustomField(organizationId);
	const [swapTo, setSwapTo] = useState("");

	const handleSwap = async () => {
		if (!swapTo) return;
		try {
			// Unlink current, link new
			await updateField.mutateAsync({
				id: field.id,
				collectInApplication: false,
			});
			await updateField.mutateAsync({
				id: swapTo,
				collectInApplication: true,
			});
			toastSuccess("Profile field updated.");
			onClose();
		} catch {
			toastError("Failed to update profile field.");
		}
	};

	const handleRemove = async () => {
		try {
			await updateField.mutateAsync({
				id: field.id,
				collectInApplication: false,
			});
			toastSuccess("Profile field removed.");
			onClose();
		} catch {
			toastError("Failed to remove profile field.");
		}
	};

	return (
		<div className="rounded-lg border bg-card p-4 space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm font-semibold">Edit Profile Field</p>
				<Button
					variant="ghost"
					size="icon"
					className="size-7"
					onClick={onClose}
				>
					<XIcon className="size-4" />
				</Button>
			</div>

			<div className="space-y-1">
				<p className="text-xs text-muted-foreground uppercase tracking-wide">
					Current field
				</p>
				<p className="text-sm font-medium">{field.name}</p>
				<p className="text-xs text-muted-foreground capitalize">
					{field.type.toLowerCase()}
				</p>
			</div>

			{availableFields.length > 0 && (
				<div className="space-y-1.5">
					<Label>Swap to a different field</Label>
					<Select value={swapTo} onValueChange={setSwapTo}>
						<SelectTrigger>
							<SelectValue placeholder="Select a field…" />
						</SelectTrigger>
						<SelectContent>
							{availableFields.map((f) => (
								<SelectItem key={f.id} value={f.id}>
									{f.name}
									<span className="ml-1.5 text-xs text-muted-foreground capitalize">
										({f.type.toLowerCase()})
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}

			<div className="flex gap-2 pt-2">
				<Button
					variant="destructive"
					size="sm"
					onClick={handleRemove}
					disabled={updateField.isPending}
				>
					Remove
				</Button>
				{availableFields.length > 0 && (
					<Button
						size="sm"
						onClick={handleSwap}
						disabled={!swapTo || updateField.isPending}
					>
						{updateField.isPending ? "Saving…" : "Swap Field"}
					</Button>
				)}
				<Button
					variant="outline"
					size="sm"
					onClick={onClose}
					className="ml-auto"
				>
					Cancel
				</Button>
			</div>
		</div>
	);
}
