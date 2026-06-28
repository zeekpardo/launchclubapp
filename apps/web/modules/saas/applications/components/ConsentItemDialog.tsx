"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ConsentItemType } from "@repo/database";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { FileTextIcon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	useCreateConsentItem,
	usePdfDownloadUrl,
	usePdfUploadUrl,
	useUpdateConsentItem,
} from "../hooks/use-consent-items";

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	nameES: z.string().optional(),
	applicantType: z.enum(["STUDENT", "MENTOR"]),
});

type FormValues = z.infer<typeof formSchema>;

interface ConsentItemDialogProps {
	organizationId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	editTarget?: ConsentItemType | null;
}

export function ConsentItemDialog({
	organizationId,
	open,
	onOpenChange,
	editTarget,
}: ConsentItemDialogProps) {
	const isEditing = !!editTarget;
	const createItem = useCreateConsentItem(organizationId);
	const updateItem = useUpdateConsentItem(organizationId);
	const pdfUploadUrl = usePdfUploadUrl();
	const pdfDownloadUrl = usePdfDownloadUrl();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [uploadingPdf, setUploadingPdf] = useState(false);
	const [currentPdfKey, setCurrentPdfKey] = useState<string | null>(
		editTarget?.pdfKey ?? null,
	);
	const [pendingFile, setPendingFile] = useState<File | null>(null);

	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: editTarget?.name ?? "",
			nameES: editTarget?.nameES ?? "",
			applicantType:
				editTarget?.applicantType === "MENTOR" ? "MENTOR" : "STUDENT",
		},
	});

	const applicantType = watch("applicantType");

	async function uploadFile(itemId: string, file: File) {
		const { uploadUrl, fileKey } = await pdfUploadUrl.mutateAsync({
			id: itemId,
			organizationId,
		});
		const res = await fetch(uploadUrl, {
			method: "PUT",
			body: file,
			headers: { "Content-Type": "application/pdf" },
		});
		if (!res.ok) throw new Error("Upload failed");
		await updateItem.mutateAsync({
			id: itemId,
			organizationId,
			pdfKey: fileKey,
		});
		return fileKey;
	}

	async function onSubmit(values: FormValues) {
		try {
			if (isEditing && editTarget) {
				await updateItem.mutateAsync({
					id: editTarget.id,
					organizationId,
					name: values.name,
					nameES: values.nameES || null,
					applicantType: values.applicantType,
				});
				toastSuccess("Consent item updated.");
			} else {
				const created = await createItem.mutateAsync({
					organizationId,
					name: values.name,
					nameES: values.nameES || null,
					applicantType: values.applicantType,
				});
				if (pendingFile) {
					await uploadFile(created.id, pendingFile);
				}
				toastSuccess("Consent item created.");
			}
			onOpenChange(false);
		} catch {
			toastError("Failed to save consent item.");
		}
	}

	async function handleViewPdf() {
		if (!editTarget) return;
		try {
			const result = await pdfDownloadUrl.mutateAsync({
				id: editTarget.id,
				organizationId,
			});
			window.open(result.downloadUrl, "_blank");
		} catch {
			toastError("Failed to get PDF download URL.");
		}
	}

	async function handlePdfFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!isEditing) {
			setPendingFile(file);
			if (fileInputRef.current) fileInputRef.current.value = "";
			return;
		}

		if (!editTarget) return;
		setUploadingPdf(true);
		try {
			const fileKey = await uploadFile(editTarget.id, file);
			setCurrentPdfKey(fileKey);
			toastSuccess("PDF uploaded successfully.");
		} catch {
			toastError("Failed to upload PDF.");
		} finally {
			setUploadingPdf(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	}

	async function handleRemovePdf() {
		if (!editTarget) return;
		try {
			await updateItem.mutateAsync({
				id: editTarget.id,
				organizationId,
				pdfKey: null,
			});
			setCurrentPdfKey(null);
			toastSuccess("PDF removed.");
		} catch {
			toastError("Failed to remove PDF.");
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit consent item" : "Add consent item"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							placeholder="e.g. Photo Release"
							{...register("name")}
						/>
						{errors.name && (
							<p className="text-xs text-destructive">
								{errors.name.message}
							</p>
						)}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="nameES">Name (Spanish)</Label>
						<Input
							id="nameES"
							placeholder="e.g. Autorización de Fotos"
							{...register("nameES")}
						/>
					</div>

					<div className="space-y-1.5">
						<Label>Applicant Type</Label>
						<div className="flex rounded-md border overflow-hidden w-fit">
							{(["STUDENT", "MENTOR"] as const).map((type, i) => (
								<button
									key={type}
									type="button"
									onClick={() =>
										setValue("applicantType", type)
									}
									className={cn(
										"px-3 py-1.5 text-sm",
										i > 0 && "border-l",
										applicantType === type
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted",
									)}
								>
									{type.charAt(0) +
										type.slice(1).toLowerCase()}
								</button>
							))}
						</div>
					</div>

					{isEditing && editTarget ? (
						<div className="space-y-2">
							<Label>PDF Attachment</Label>
							{currentPdfKey ? (
								<div className="flex items-center gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleViewPdf}
										disabled={pdfDownloadUrl.isPending}
									>
										<FileTextIcon className="size-3.5" />
										View PDF
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											fileInputRef.current?.click()
										}
										disabled={uploadingPdf}
									>
										<UploadIcon className="size-3.5" />
										{uploadingPdf
											? "Uploading..."
											: "Replace"}
									</Button>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="text-destructive hover:text-destructive"
										onClick={handleRemovePdf}
										disabled={updateItem.isPending}
									>
										Remove
									</Button>
								</div>
							) : (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										fileInputRef.current?.click()
									}
									disabled={uploadingPdf}
								>
									<UploadIcon className="size-3.5" />
									{uploadingPdf
										? "Uploading..."
										: "Attach PDF"}
								</Button>
							)}
							<input
								ref={fileInputRef}
								type="file"
								accept="application/pdf"
								className="hidden"
								onChange={handlePdfFileChange}
							/>
						</div>
					) : (
						<div className="space-y-2">
							<Label>PDF Attachment</Label>
							{pendingFile ? (
								<div className="flex items-center gap-2">
									<span className="text-xs text-muted-foreground truncate max-w-[200px]">
										{pendingFile.name}
									</span>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="text-destructive hover:text-destructive"
										onClick={() => setPendingFile(null)}
									>
										Remove
									</Button>
								</div>
							) : (
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										fileInputRef.current?.click()
									}
								>
									<UploadIcon className="size-3.5" />
									Attach PDF
								</Button>
							)}
							<input
								ref={fileInputRef}
								type="file"
								accept="application/pdf"
								className="hidden"
								onChange={handlePdfFileChange}
							/>
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="primary"
							size="sm"
							loading={isSubmitting}
						>
							{isEditing ? "Save changes" : "Add consent"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
