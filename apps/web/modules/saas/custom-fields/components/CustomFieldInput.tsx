"use client";

import type { CustomFieldType } from "@repo/api/modules/custom-fields/types";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon, PaperclipIcon } from "lucide-react";
import { useRef, useState } from "react";

interface CustomFieldInputProps {
	type: CustomFieldType;
	value: string | null | undefined;
	options?: string[];
	onChange: (value: string | null) => void;
	disabled?: boolean;
	customFieldId?: string;
	personId?: string;
}

function FileFieldInput({
	value,
	customFieldId,
	personId,
	onChange,
}: {
	value: string | null | undefined;
	customFieldId: string;
	personId: string;
	onChange: (path: string) => void;
}) {
	const { activeOrganization } = useActiveOrganization();
	const getUploadUrl = useMutation(
		orpc.customFields.getUploadUrl.mutationOptions(),
	);
	const saveValue = useMutation(orpc.customFields.setValue.mutationOptions());
	const [uploading, setUploading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";
		setUploading(true);
		try {
			const { signedUploadUrl, path } = await getUploadUrl.mutateAsync({
				customFieldId,
				personId,
			});
			const res = await fetch(signedUploadUrl, {
				method: "PUT",
				body: file,
				headers: {
					"Content-Type": file.type || "application/octet-stream",
				},
			});
			if (!res.ok) throw new Error("Upload failed");
			await saveValue.mutateAsync({
				organizationId: activeOrganization?.id ?? "",
				customFieldId,
				personId,
				value: path,
			});
			onChange(path);
			toastSuccess("File uploaded.");
		} catch {
			toastError("Upload failed. Please try again.");
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="flex items-center gap-2">
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={uploading}
				onClick={() => inputRef.current?.click()}
			>
				{uploading ? (
					<Loader2Icon className="size-3.5 animate-spin" />
				) : (
					<PaperclipIcon className="size-3.5" />
				)}
				<span className="ml-1.5">
					{uploading
						? "Uploading…"
						: value
							? "Replace"
							: "Upload file"}
				</span>
			</Button>
			{value && (
				<a
					href={`/image-proxy/customFields/${value}`}
					target="_blank"
					rel="noopener noreferrer"
					className="text-sm text-primary underline truncate max-w-[180px]"
				>
					View file
				</a>
			)}
			<input
				ref={inputRef}
				type="file"
				className="hidden"
				onChange={handleFileChange}
			/>
		</div>
	);
}

export function CustomFieldInput({
	type,
	value,
	options = [],
	onChange,
	disabled,
	customFieldId,
	personId,
}: CustomFieldInputProps) {
	switch (type) {
		case "TEXTAREA":
			return (
				<Textarea
					value={value ?? ""}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					rows={3}
				/>
			);
		case "NUMBER":
			return (
				<Input
					type="number"
					value={value ?? ""}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
				/>
			);
		case "CHECKBOX":
			return (
				<Checkbox
					checked={value === "true"}
					onCheckedChange={(checked) =>
						onChange(checked ? "true" : "false")
					}
					disabled={disabled}
				/>
			);
		case "SELECT":
			return (
				<Select
					value={value ?? ""}
					onValueChange={onChange}
					disabled={disabled}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select…" />
					</SelectTrigger>
					<SelectContent>
						{options.map((opt) => (
							<SelectItem key={opt} value={opt}>
								{opt}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			);
		case "DATE":
			return (
				<Input
					type="date"
					value={value ?? ""}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
				/>
			);
		case "FILE":
			if (!customFieldId || !personId) return null;
			return (
				<FileFieldInput
					value={value}
					customFieldId={customFieldId}
					personId={personId}
					onChange={onChange}
				/>
			);
		default:
			return (
				<Input
					type="text"
					value={value ?? ""}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
				/>
			);
	}
}
