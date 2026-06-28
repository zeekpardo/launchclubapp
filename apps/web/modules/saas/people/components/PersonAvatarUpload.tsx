"use client";

import { config as storageConfig } from "@repo/storage/config";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { CropImageDialog } from "../../settings/components/CropImageDialog";
import { useUpdatePerson } from "../hooks/use-people";

interface PersonAvatarUploadProps {
	personId: string;
	firstName: string;
	lastName: string;
	avatarUrl: string | null;
}

export function PersonAvatarUpload({
	personId,
	firstName,
	lastName,
	avatarUrl,
}: PersonAvatarUploadProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const queryClient = useQueryClient();
	const updatePerson = useUpdatePerson();
	const getAvatarUploadUrl = useMutation(
		orpc.people.avatarUploadUrl.mutationOptions(),
	);

	const [uploading, setUploading] = useState(false);
	const [cropDialogOpen, setCropDialogOpen] = useState(false);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const initials =
		`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setPendingFile(file);
			setCropDialogOpen(true);
		}
		e.target.value = "";
	};

	const handleCrop = async (croppedImageData: Blob | null) => {
		if (!croppedImageData) return;
		setUploading(true);
		try {
			const { signedUploadUrl, path } =
				await getAvatarUploadUrl.mutateAsync({ personId });
			const response = await fetch(signedUploadUrl, {
				method: "PUT",
				body: croppedImageData,
				headers: { "Content-Type": "image/png" },
			});
			if (!response.ok) throw new Error("Upload failed");
			await updatePerson.mutateAsync({ id: personId, avatarUrl: path });
			await queryClient.invalidateQueries(
				orpc.people.get.queryOptions({
					input: {
						id: personId,
						organizationId: activeOrganization?.id ?? "",
					},
				}),
			);
			toastSuccess(t("launchclub.people.avatar.notifications.updated"));
		} catch {
			toastError(t("launchclub.people.avatar.notifications.error"));
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-muted/30">
			<Avatar className="size-32">
				{avatarUrl && (
					<AvatarImage
						src={`/image-proxy/${storageConfig.bucketNames.avatars}/${avatarUrl}`}
						alt={`${firstName} ${lastName}`}
					/>
				)}
				<AvatarFallback className="text-4xl">{initials}</AvatarFallback>
			</Avatar>

			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={uploading}
					onClick={() => inputRef.current?.click()}
				>
					<UploadIcon className="mr-2 size-4" />
					{uploading
						? t("launchclub.people.avatar.uploading")
						: t("launchclub.people.avatar.upload")}
				</Button>
				<input
					ref={inputRef}
					type="file"
					accept="image/jpeg,image/jpg,image/png,image/webp"
					className="hidden"
					onChange={handleFileChange}
				/>
			</div>

			<p className="text-xs text-muted-foreground text-center">
				{t("launchclub.people.avatar.hint")}
			</p>

			<CropImageDialog
				image={pendingFile}
				open={cropDialogOpen}
				onOpenChange={setCropDialogOpen}
				onCrop={handleCrop}
			/>
		</div>
	);
}
