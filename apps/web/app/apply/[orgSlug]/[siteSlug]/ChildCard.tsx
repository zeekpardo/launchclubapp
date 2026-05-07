"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { CustomFieldInput } from "@saas/custom-fields/components/CustomFieldInput";
import type { CustomFieldType } from "@repo/api/modules/custom-fields/types";
import { orpcClient } from "@shared/lib/orpc-client";
import { DownloadIcon, ImageIcon, PaperclipIcon, TrashIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import type { ApplicationFormValues, BasicFormField, ConsentConfig, ProfileField } from "./ApplicationForm";

interface ChildCardProps {
	index: number;
	canRemove: boolean;
	onRemove: () => void;
	control: Control<ApplicationFormValues>;
	setValue: UseFormSetValue<ApplicationFormValues>;
	profileFields?: ProfileField[];
	formFields?: BasicFormField[];
	siteSlug: string;
	enableConsentFileUpload?: boolean;
	consentConfig?: ConsentConfig;
}

const FILE_FIELD_ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"] as const;
const FILE_FIELD_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

interface FileFieldUploadProps {
	fieldId: string;
	siteSlug: string;
	value: string;
	onChange: (url: string) => void;
	uploadUrlProcedure?: "formField" | "consentSignature";
}

function FileFieldUpload({ fieldId, siteSlug, value, onChange, uploadUrlProcedure = "formField" }: FileFieldUploadProps) {
	const t = useTranslations("application.children");
	const [uploading, setUploading] = useState(false);
	const [fileName, setFileName] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const ref = useRef<HTMLInputElement>(null);

	const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!(FILE_FIELD_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
			setError(t("photo.error"));
			return;
		}
		if (file.size > FILE_FIELD_MAX_BYTES) {
			setError(t("photo.error"));
			return;
		}
		setUploading(true);
		setError(null);
		try {
			const contentType = file.type as (typeof FILE_FIELD_ALLOWED_TYPES)[number];
			const { signedUploadUrl, path } = uploadUrlProcedure === "consentSignature"
				? await orpcClient.applications.consentSignatureUploadUrl({ contentType, siteSlug })
				: await orpcClient.applications.formFieldFileUploadUrl({ contentType, siteSlug });
			const res = await fetch(signedUploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": contentType },
			});
			if (!res.ok) throw new Error("Upload failed");
			onChange(path);
			setFileName(file.name);
		} catch {
			setError(t("photo.error"));
		} finally {
			setUploading(false);
		}
	};

	const handleRemove = () => {
		onChange("");
		setFileName(null);
		setError(null);
		if (ref.current) ref.current.value = "";
	};

	return (
		<div className="space-y-2">
			<input
				ref={ref}
				type="file"
				accept="image/png,image/jpeg,image/jpg,application/pdf"
				className="hidden"
				onChange={handleChange}
			/>
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={uploading}
					onClick={() => ref.current?.click()}
				>
					<PaperclipIcon className="size-4 mr-1.5" />
					{uploading ? t("photo.uploading") : value ? t("photo.change") : t("fileField.upload")}
				</Button>
				{value && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-8"
						onClick={handleRemove}
					>
						<XIcon className="size-4" />
					</Button>
				)}
			</div>
			{fileName && !error && (
				<p className="text-xs text-muted-foreground">{fileName}</p>
			)}
			{error && <p className="text-xs text-destructive">{error}</p>}
			<p className="text-xs text-muted-foreground">{t("fileField.hint")}</p>
		</div>
	);
}

const DEFAULT_CONSENT_CONFIG: ConsentConfig = { showObservation: true, showTerms: true, showPhotoVideo: true };

export function ChildCard({ index, canRemove, onRemove, control, setValue, profileFields = [], formFields = [] as BasicFormField[], siteSlug, enableConsentFileUpload = false, consentConfig = DEFAULT_CONSENT_CONFIG }: ChildCardProps) {
	const t = useTranslations("application.children");
	const locale = useLocale();
	const [obsChecked, termsChecked, photoChecked] = useWatch({
		control,
		name: [
			`children.${index}.observationConsent`,
			`children.${index}.termsConsent`,
			`children.${index}.photoVideoConsent`,
		],
	});
	const [uploading, setUploading] = useState(false);
	const [preview, setPreview] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"] as const;
	const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
			setUploadError(t("photo.error"));
			return;
		}
		if (file.size > MAX_BYTES) {
			setUploadError(t("photo.error"));
			return;
		}

		setUploading(true);
		setUploadError(null);
		try {
			const contentType = file.type as (typeof ALLOWED_TYPES)[number];
			const { signedUploadUrl, path } = await orpcClient.applications.childPhotoUploadUrl({ contentType, siteSlug });

			const response = await fetch(signedUploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": contentType },
			});
			if (!response.ok) throw new Error("Upload failed");

			setValue(`children.${index}.photoUrl`, path);
			setPreview(URL.createObjectURL(file));
		} catch {
			setUploadError(t("photo.error"));
		} finally {
			setUploading(false);
		}
	};

	const handleRemovePhoto = () => {
		setValue(`children.${index}.photoUrl`, "");
		setPreview(null);
		setUploadError(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle>{t("childNumber", { number: index + 1 })}</CardTitle>
					{canRemove && (
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onRemove}
						>
							<TrashIcon className="size-4 text-destructive" />
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Photo Upload */}
				<div className="space-y-2">
					<p className="text-sm font-medium">{t("photo.label")}</p>
					<div className="flex items-center gap-4">
						<div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted">
							{preview ? (
								<img src={preview} alt="Child" className="h-full w-full object-cover" />
							) : (
								<ImageIcon className="size-8 text-muted-foreground/40" />
							)}
						</div>
						<div className="space-y-2">
							<input
								ref={fileInputRef}
								type="file"
								accept="image/png,image/jpeg,image/jpg"
								className="hidden"
								onChange={handleFileChange}
							/>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={uploading}
									onClick={() => fileInputRef.current?.click()}
								>
									{uploading ? t("photo.uploading") : preview ? t("photo.change") : t("photo.upload")}
								</Button>
								{preview && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="size-8"
										onClick={handleRemovePhoto}
									>
										<XIcon className="size-4" />
									</Button>
								)}
							</div>
							{uploadError && (
								<p className="text-xs text-destructive">{uploadError}</p>
							)}
							<p className="text-xs text-muted-foreground">
								{t("photo.hint")}
							</p>
						</div>
					</div>
				</div>

				{/* Name */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={control}
						name={`children.${index}.firstName`}
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("firstName")} *</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name={`children.${index}.lastName`}
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("lastName")} *</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Birthday + Grade */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={control}
						name={`children.${index}.birthday`}
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("birthday")}</FormLabel>
								<FormControl>
									<Input
										type="date"
										value={field.value ?? ""}
										onChange={(e) =>
											field.onChange(e.target.value || undefined)
										}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name={`children.${index}.grade`}
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("grade")}</FormLabel>
								<FormControl>
									<Input placeholder={t("gradePlaceholder")} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Church */}
				<FormField
					control={control}
					name={`children.${index}.isPartOfChurch`}
					render={({ field }) => (
						<FormItem className="flex items-center gap-3 space-y-0">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							</FormControl>
							<FormLabel className="font-normal">
								{t("isPartOfChurch")}
							</FormLabel>
						</FormItem>
					)}
				/>

				{/* Consents */}
				{(consentConfig.showObservation || consentConfig.showTerms || consentConfig.showPhotoVideo) && <div className="space-y-3 border-t pt-4">
					<h4 className="font-semibold">{t("consents.title")}</h4>
					{(
						[
							{
								name: `children.${index}.observationConsent` as const,
								label: t("consents.observation"),
								fileFieldName: `children.${index}.observationConsentFileUrl` as const,
								checked: obsChecked,
								show: consentConfig.showObservation,
								formUrl: consentConfig.observationFormUrl ?? null,
							},
							{
								name: `children.${index}.termsConsent` as const,
								label: t("consents.terms"),
								fileFieldName: `children.${index}.termsConsentFileUrl` as const,
								checked: termsChecked,
								show: consentConfig.showTerms,
								formUrl: consentConfig.termsFormUrl ?? null,
							},
							{
								name: `children.${index}.photoVideoConsent` as const,
								label: t("consents.photoVideo"),
								fileFieldName: `children.${index}.photoVideoConsentFileUrl` as const,
								checked: photoChecked,
								show: consentConfig.showPhotoVideo,
								formUrl: consentConfig.photoVideoFormUrl ?? null,
							},
						] as const
					).filter(({ show }) => show).map(({ name, label, fileFieldName, checked, formUrl }) => (
						<div key={name} className="space-y-2">
							<FormField
								control={control}
								name={name}
								render={({ field }) => (
									<FormItem className="flex items-start gap-3 space-y-0">
										<FormControl>
											<Checkbox
												checked={field.value as boolean}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
										<div className="space-y-1">
											<FormLabel className="font-normal">{label}</FormLabel>
											{formUrl && (
												<a
													href={formUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-1 text-xs text-primary hover:underline w-fit"
												>
													<DownloadIcon className="size-3" />
													Download form to sign
												</a>
											)}
											<FormMessage />
										</div>
									</FormItem>
								)}
							/>
							{enableConsentFileUpload && checked && (
								<FormField
									control={control}
									name={fileFieldName}
									render={({ field }) => (
										<FormItem className="pl-7">
											<FormControl>
												<FileFieldUpload
													fieldId={`${fileFieldName}-${index}`}
													siteSlug={siteSlug}
													value={field.value ?? ""}
													onChange={field.onChange}
													uploadUrlProcedure="consentSignature"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</div>
					))}
				</div>}

				{/* Per-child basic form fields */}
				{formFields.length > 0 && (
					<div className="space-y-4 border-t pt-4">
						<h4 className="font-semibold">{t("additionalInfo")}</h4>
						{formFields.map((ff) =>
							ff.type === "HEADER" ? (
								<div key={ff.id} className="pt-2">
									<h4 className="font-semibold text-base">{ff.label}</h4>
									{ff.helpText && (
										<p className="text-sm text-muted-foreground mt-0.5">{ff.helpText}</p>
									)}
								</div>
							) : (
								<FormField
									key={ff.id}
									control={control}
									name={`children.${index}.formFields.${ff.id}`}
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{ff.label}
												{ff.required && " *"}
											</FormLabel>
											{ff.helpText && (
												<p className="text-xs text-muted-foreground">{ff.helpText}</p>
											)}
											{ff.type === "FILE" ? (
												<FileFieldUpload
													fieldId={ff.id}
													siteSlug={siteSlug}
													value={field.value ?? ""}
													onChange={field.onChange}
												/>
											) : (
												<FormControl>
													{ff.type === "TEXTAREA" ? (
														<Textarea
															rows={3}
															placeholder={ff.placeholder ?? undefined}
															{...field}
															value={field.value ?? ""}
														/>
													) : ff.type === "SELECT" && Array.isArray(ff.options) && ff.options.length > 0 ? (
														<Select
															value={field.value ?? ""}
															onValueChange={field.onChange}
														>
															<SelectTrigger>
																<SelectValue placeholder={ff.placeholder ?? "Select an option"} />
															</SelectTrigger>
															<SelectContent>
																{ff.options.map((opt: { label: string; value: string }) => (
																	<SelectItem key={opt.value} value={opt.value}>
																		{opt.label}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													) : ff.type === "CHECKBOX" ? (
														<Checkbox
															checked={field.value === "true"}
															onCheckedChange={(v) =>
																field.onChange(v ? "true" : "false")
															}
														/>
													) : ff.type === "DATE" ? (
														<Input
															type="date"
															placeholder={ff.placeholder ?? undefined}
															{...field}
															value={field.value ?? ""}
														/>
													) : ff.type === "NUMBER" ? (
														<Input
															type="number"
															placeholder={ff.placeholder ?? undefined}
															{...field}
															value={field.value ?? ""}
														/>
													) : (
														<Input
															placeholder={ff.placeholder ?? undefined}
															{...field}
															value={field.value ?? ""}
														/>
													)}
												</FormControl>
											)}
											<FormMessage />
										</FormItem>
									)}
								/>
							)
						)}
					</div>
				)}

				{/* Per-child profile fields */}
				{profileFields.length > 0 && (
					<div className="space-y-4 border-t pt-4">
						<h4 className="font-semibold">{t("additionalInfo")}</h4>
						{profileFields.map((pf) => (
							<FormField
								key={pf.id}
								control={control}
								name={`children.${index}.profileFields.${pf.id}`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{(locale === "es" && pf.nameEs) || pf.name}
											{pf.required && " *"}
										</FormLabel>
										<FormControl>
											{pf.type === "FILE" ? (
												<FileFieldUpload
													fieldId={pf.id}
													siteSlug={siteSlug}
													value={field.value ?? ""}
													onChange={(val) => field.onChange(val)}
												/>
											) : (
												<CustomFieldInput
													type={pf.type as CustomFieldType}
													value={field.value ?? null}
													options={pf.options}
													onChange={(val) => field.onChange(val ?? "")}
												/>
											)}
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
