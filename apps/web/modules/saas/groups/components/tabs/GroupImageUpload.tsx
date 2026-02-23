"use client";

import { Spinner } from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { config as storageConfig } from "@repo/storage/config";
import { useUpdateGroup } from "@saas/groups/hooks/use-groups";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { CropImageDialog } from "../../../settings/components/CropImageDialog";

interface GroupImageUploadProps {
	groupId: string;
	name: string;
	image: string | null;
}

export function GroupImageUpload({ groupId, name, image }: GroupImageUploadProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const updateGroup = useUpdateGroup();
	const getImageUploadUrl = useMutation(orpc.groups.imageUploadUrl.mutationOptions());

	const [uploading, setUploading] = useState(false);
	const [cropDialogOpen, setCropDialogOpen] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);

	const { getRootProps, getInputProps } = useDropzone({
		onDrop: (acceptedFiles) => {
			if (acceptedFiles[0]) {
				setPendingFile(acceptedFiles[0]);
				setCropDialogOpen(true);
			}
		},
		accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
		multiple: false,
	});

	const handleCrop = async (croppedImageData: Blob | null) => {
		if (!croppedImageData) return;
		setUploading(true);
		try {
			const { signedUploadUrl, path } = await getImageUploadUrl.mutateAsync({ groupId });
			const response = await fetch(signedUploadUrl, {
				method: "PUT",
				body: croppedImageData,
				headers: { "Content-Type": "image/png" },
			});
			if (!response.ok) throw new Error("Upload failed");
			await updateGroup.mutateAsync({ id: groupId, image: path });
			await queryClient.invalidateQueries(
				orpc.groups.get.queryOptions({ input: { id: groupId } }),
			);
			toastSuccess(t("launchclub.groups.form.notifications.updated"));
		} catch {
			toastError(t("launchclub.groups.form.notifications.error"));
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">Group Image</p>
			<div
				{...(getRootProps() as React.HTMLAttributes<HTMLDivElement>)}
				className="relative flex h-32 w-48 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted transition-colors hover:border-primary/50"
			>
				<input {...getInputProps()} />
				{image ? (
					<img
						src={`/image-proxy/${storageConfig.bucketNames.avatars}/${image}`}
						alt={name}
						className="h-full w-full object-cover"
					/>
				) : (
					<span className="text-4xl font-bold text-muted-foreground/30">
						{name.charAt(0).toUpperCase()}
					</span>
				)}
				{uploading && (
					<div className="absolute inset-0 flex items-center justify-center bg-card/80">
						<Spinner className="size-6" />
					</div>
				)}
			</div>
			<p className="text-xs text-muted-foreground">Click or drop an image to upload</p>

			<CropImageDialog
				image={pendingFile}
				open={cropDialogOpen}
				onOpenChange={setCropDialogOpen}
				onCrop={handleCrop}
				aspectRatio={1280 / 1080}
				maxWidth={1280}
				maxHeight={1080}
			/>
		</div>
	);
}
