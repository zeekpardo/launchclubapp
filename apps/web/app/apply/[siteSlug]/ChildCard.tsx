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
import { orpcClient } from "@shared/lib/orpc-client";
import { ImageIcon, TrashIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { Control, UseFormSetValue } from "react-hook-form";
import type { ApplicationFormValues, BasicFormField, ProfileField } from "./ApplicationForm";

interface ChildCardProps {
	index: number;
	canRemove: boolean;
	onRemove: () => void;
	control: Control<ApplicationFormValues>;
	setValue: UseFormSetValue<ApplicationFormValues>;
	profileFields?: ProfileField[];
	formFields?: BasicFormField[];
	siteSlug: string;
}

export function ChildCard({ index, canRemove, onRemove, control, setValue, profileFields = [], formFields = [] as BasicFormField[], siteSlug }: ChildCardProps) {
	const t = useTranslations("application.children");
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
				<div className="space-y-3 border-t pt-4">
					<h4 className="font-semibold">{t("consents.title")}</h4>
					{(
						[
							{
								name: `children.${index}.observationConsent` as const,
								label: t("consents.observation"),
							},
							{
								name: `children.${index}.termsConsent` as const,
								label: t("consents.terms"),
							},
							{
								name: `children.${index}.photoVideoConsent` as const,
								label: t("consents.photoVideo"),
							},
						] as const
					).map(({ name, label }) => (
						<FormField
							key={name}
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
										<FormMessage />
									</div>
								</FormItem>
							)}
						/>
					))}
				</div>

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
											{pf.name}
											{pf.required && " *"}
										</FormLabel>
										<FormControl>
											{pf.type === "TEXTAREA" ? (
												<Textarea
													rows={3}
													{...field}
													value={field.value ?? ""}
												/>
											) : pf.type === "SELECT" && pf.options?.length > 0 ? (
												<Select
													value={field.value ?? ""}
													onValueChange={field.onChange}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select an option" />
													</SelectTrigger>
													<SelectContent>
														{pf.options.map((opt) => (
															<SelectItem key={opt} value={opt}>
																{opt}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											) : pf.type === "CHECKBOX" ? (
												<Checkbox
													checked={field.value === "true"}
													onCheckedChange={(v) =>
														field.onChange(v ? "true" : "false")
													}
												/>
											) : pf.type === "DATE" ? (
												<Input
													type="date"
													{...field}
													value={field.value ?? ""}
												/>
											) : pf.type === "NUMBER" ? (
												<Input
													type="number"
													{...field}
													value={field.value ?? ""}
												/>
											) : (
												<Input {...field} value={field.value ?? ""} />
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
