"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError } from "@repo/ui/components/toast";
import { orpcClient } from "@shared/lib/orpc-client";
import {
	CheckCircleIcon,
	DownloadIcon,
	LoaderIcon,
	PaperclipIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

export interface BasicFormField {
	id: string;
	label: string;
	fieldKey: string;
	type: string;
	placeholder?: string | null;
	helpText?: string | null;
	required: boolean;
	options?: { label: string; value: string }[] | null;
}

const mentorFormSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email("A valid email is required"),
	phone: z.string().optional(),
	addressLine1: z.string().optional(),
	city: z.string().optional(),
	stateProvince: z.string().optional(),
	postalCode: z.string().optional(),
	country: z.string().optional(),
	contractAcknowledged: z.boolean().optional(),
	clearanceAcknowledged: z.boolean().optional(),
	formFields: z.record(z.string(), z.string()).optional(),
	profileFields: z.record(z.string(), z.string()).optional(),
});

export interface ProfileField {
	id: string;
	name: string;
	nameEs?: string | null;
	type: string;
	required: boolean;
	options: string[];
}

type MentorFormValues = z.infer<typeof mentorFormSchema>;

interface MentorApplicationFormProps {
	orgSlug: string;
	formFields?: BasicFormField[];
	profileFields?: ProfileField[];
	mentorContractUrl?: string | null;
	mentorSecurityClearanceUrl?: string | null;
	showMentorContract?: boolean;
	showMentorSecurityClearance?: boolean;
	enableMentorDocumentUpload?: boolean;
}

// ── File Upload Field ──────────────────────────────────────────────────────────

interface FileUploadFieldProps {
	label: string;
	downloadUrl?: string | null;
	value: string | null;
	onChange: (path: string | null) => void;
	orgSlug: string;
	showUpload?: boolean;
}

function FileUploadField({
	label,
	downloadUrl,
	value,
	onChange,
	orgSlug,
	showUpload = true,
}: FileUploadFieldProps) {
	const [uploading, setUploading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const allowed = [
			"application/pdf",
			"image/jpeg",
			"image/jpg",
			"image/png",
		];
		if (!allowed.includes(file.type)) {
			toastError("Only PDF or image files are allowed.");
			return;
		}

		setUploading(true);
		try {
			const { signedUploadUrl, path } =
				await orpcClient.mentorApplications.fileUploadUrl({
					contentType: file.type as
						| "application/pdf"
						| "image/jpeg"
						| "image/jpg"
						| "image/png",
					orgSlug,
				});
			const res = await fetch(signedUploadUrl, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type },
			});
			if (!res.ok) throw new Error("Upload failed");
			onChange(path);
		} catch {
			toastError("Upload failed. Please try again.");
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	}

	return (
		<div className="space-y-2">
			{label && <Label>{label}</Label>}
			{downloadUrl && (
				<a
					href={downloadUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
				>
					<DownloadIcon className="size-3.5" />
					Download template to sign
				</a>
			)}
			{showUpload && (
				<div className="flex items-center gap-3">
					<input
						ref={inputRef}
						type="file"
						accept="application/pdf,image/jpeg,image/jpg,image/png"
						className="hidden"
						onChange={handleFile}
					/>
					{value ? (
						<>
							<span className="text-sm text-green-600 font-medium">
								File uploaded ✓
							</span>
							<button
								type="button"
								onClick={() => inputRef.current?.click()}
								disabled={uploading}
								className="text-xs text-muted-foreground hover:text-foreground transition-colors"
							>
								Replace
							</button>
						</>
					) : (
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							disabled={uploading}
							className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
						>
							<PaperclipIcon className="size-4" />
							{uploading ? "Uploading…" : "Upload signed copy"}
						</button>
					)}
				</div>
			)}
		</div>
	);
}

// ── Main form ──────────────────────────────────────────────────────────────────

export function MentorApplicationForm({
	orgSlug,
	formFields = [],
	profileFields = [],
	mentorContractUrl,
	mentorSecurityClearanceUrl,
	showMentorContract = false,
	showMentorSecurityClearance = false,
	enableMentorDocumentUpload = false,
}: MentorApplicationFormProps) {
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
	const [contractFileUrl, setContractFileUrl] = useState<string | null>(null);
	const [clearanceFileUrl, setClearanceFileUrl] = useState<string | null>(
		null,
	);

	const form = useForm<MentorFormValues>({
		resolver: zodResolver(mentorFormSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phone: "",
			addressLine1: "",
			city: "",
			stateProvince: "",
			postalCode: "",
			country: "",
			contractAcknowledged: false,
			clearanceAcknowledged: false,
			formFields: {},
			profileFields: {},
		},
	});

	const [contractAcknowledged, clearanceAcknowledged] = useWatch({
		control: form.control,
		name: ["contractAcknowledged", "clearanceAcknowledged"],
	});

	const visibleFormFields = formFields.filter((f) => f.type !== "HEADER");

	const onSubmit = async (values: MentorFormValues) => {
		setSubmitting(true);
		setServerError(null);
		try {
			const formFieldValues = visibleFormFields
				.map((f) => ({
					formFieldId: f.id,
					value: values.formFields?.[f.id] ?? "",
				}))
				.filter((v) => v.value !== "");

			const profileFieldValues = profileFields
				.map((f) => ({
					customFieldId: f.id,
					value: values.profileFields?.[f.id] ?? "",
				}))
				.filter((v) => v.value !== "");

			await orpcClient.mentorApplications.submit({
				orgSlug,
				firstName: values.firstName,
				lastName: values.lastName,
				email: values.email,
				phone: values.phone || undefined,
				addressLine1: values.addressLine1 || undefined,
				city: values.city || undefined,
				stateProvince: values.stateProvince || undefined,
				postalCode: values.postalCode || undefined,
				country: values.country || undefined,
				mentorContractFileUrl: contractFileUrl || undefined,
				mentorSecurityClearanceFileUrl: clearanceFileUrl || undefined,
				formFieldValues: formFieldValues.length
					? formFieldValues
					: undefined,
				profileFieldValues: profileFieldValues.length
					? profileFieldValues
					: undefined,
			});
			setSubmitted(true);
		} catch {
			setServerError(
				"Something went wrong. Please try again or contact us for help.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	if (submitted) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center gap-4 py-16 text-center">
					<CheckCircleIcon className="size-14 text-green-500" />
					<div>
						<h2 className="text-2xl font-bold">
							Application Submitted
						</h2>
						<p className="mt-2 text-muted-foreground max-w-sm">
							Thank you for applying! We will review your
							application and be in touch soon.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				{/* Personal Information */}
				<Card>
					<CardHeader>
						<CardTitle>Personal Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>First Name *</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Last Name *</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email *</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Phone</FormLabel>
										<FormControl>
											<Input type="tel" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Address */}
						<div className="border-t pt-4 space-y-4">
							<p className="text-sm font-semibold">Address</p>
							<FormField
								control={form.control}
								name="addressLine1"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Street Address</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="123 Main St"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="city"
									render={({ field }) => (
										<FormItem>
											<FormLabel>City</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="stateProvince"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												State / Province
											</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="postalCode"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Postal Code</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="country"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Country</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Required Documents */}
				{(showMentorContract || showMentorSecurityClearance) && (
					<Card>
						<CardHeader>
							<CardTitle>Required Documents</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{(
								[
									{
										name: "contractAcknowledged" as const,
										label: "I agree to sign the Mentor Contract",
										show: showMentorContract,
										downloadUrl: mentorContractUrl,
										acknowledged: contractAcknowledged,
										fileValue: contractFileUrl,
										onFileChange: setContractFileUrl,
									},
									{
										name: "clearanceAcknowledged" as const,
										label: "I agree to complete the Security Clearance",
										show: showMentorSecurityClearance,
										downloadUrl: mentorSecurityClearanceUrl,
										acknowledged: clearanceAcknowledged,
										fileValue: clearanceFileUrl,
										onFileChange: setClearanceFileUrl,
									},
								] as const
							)
								.filter(({ show }) => show)
								.map(
									({
										name,
										label,
										downloadUrl,
										acknowledged,
										fileValue,
										onFileChange,
									}) => (
										<div key={name} className="space-y-2">
											<FormField
												control={form.control}
												name={name}
												render={({ field }) => (
													<FormItem className="flex items-start gap-3 space-y-0">
														<FormControl>
															<Checkbox
																checked={
																	field.value as boolean
																}
																onCheckedChange={
																	field.onChange
																}
															/>
														</FormControl>
														<div className="space-y-1">
															<FormLabel className="font-normal">
																{label}
															</FormLabel>
															{downloadUrl && (
																<a
																	href={
																		downloadUrl
																	}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="flex items-center gap-1 text-xs text-primary hover:underline w-fit"
																>
																	<DownloadIcon className="size-3" />
																	Download to
																	sign
																</a>
															)}
															<FormMessage />
														</div>
													</FormItem>
												)}
											/>
											{enableMentorDocumentUpload &&
												acknowledged && (
													<div className="pl-7">
														<FileUploadField
															label=""
															value={fileValue}
															onChange={
																onFileChange
															}
															orgSlug={orgSlug}
														/>
													</div>
												)}
										</div>
									),
								)}
						</CardContent>
					</Card>
				)}

				{/* Custom profile fields */}
				{profileFields.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Profile Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{profileFields.map((field) => (
								<FormField
									key={field.id}
									control={form.control}
									name={`profileFields.${field.id}`}
									render={({ field: f }) => (
										<FormItem>
											<FormLabel>
												{field.name}
												{field.required && " *"}
											</FormLabel>
											<FormControl>
												{field.type === "TEXTAREA" ? (
													<Textarea
														{...f}
														value={f.value ?? ""}
														rows={3}
													/>
												) : field.type === "SELECT" &&
													field.options.length > 0 ? (
													<Select
														value={f.value ?? ""}
														onValueChange={
															f.onChange
														}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select…" />
														</SelectTrigger>
														<SelectContent>
															{field.options.map(
																(opt) => (
																	<SelectItem
																		key={
																			opt
																		}
																		value={
																			opt
																		}
																	>
																		{opt}
																	</SelectItem>
																),
															)}
														</SelectContent>
													</Select>
												) : field.type ===
													"CHECKBOX" ? (
													<div className="flex items-center gap-2">
														<Checkbox
															checked={
																f.value ===
																"true"
															}
															onCheckedChange={(
																checked,
															) =>
																f.onChange(
																	checked
																		? "true"
																		: "false",
																)
															}
														/>
													</div>
												) : field.type === "DATE" ? (
													<Input
														type="date"
														{...f}
														value={f.value ?? ""}
													/>
												) : field.type === "NUMBER" ? (
													<Input
														type="number"
														{...f}
														value={f.value ?? ""}
													/>
												) : (
													<Input
														{...f}
														value={f.value ?? ""}
													/>
												)}
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							))}
						</CardContent>
					</Card>
				)}

				{/* Custom org form questions */}
				{formFields.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Additional Questions</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{formFields.map((field) => {
								if (field.type === "HEADER") {
									return (
										<p
											key={field.id}
											className="text-sm font-semibold pt-2 first:pt-0"
										>
											{field.label}
										</p>
									);
								}

								if (field.type === "CHECKBOX") {
									return (
										<FormField
											key={field.id}
											control={form.control}
											name={`formFields.${field.id}`}
											render={({ field: f }) => (
												<FormItem className="flex items-start gap-3 space-y-0">
													<FormControl>
														<Checkbox
															checked={
																f.value ===
																"true"
															}
															onCheckedChange={(
																checked,
															) =>
																f.onChange(
																	checked
																		? "true"
																		: "false",
																)
															}
														/>
													</FormControl>
													<div className="space-y-1 leading-none">
														<FormLabel>
															{field.label}
															{field.required &&
																" *"}
														</FormLabel>
														{field.helpText && (
															<FormDescription>
																{field.helpText}
															</FormDescription>
														)}
													</div>
												</FormItem>
											)}
										/>
									);
								}

								if (field.type === "SELECT" && field.options) {
									const opts = field.options;
									return (
										<FormField
											key={field.id}
											control={form.control}
											name={`formFields.${field.id}`}
											render={({ field: f }) => (
												<FormItem>
													<FormLabel>
														{field.label}
														{field.required && " *"}
													</FormLabel>
													<Select
														value={f.value ?? ""}
														onValueChange={
															f.onChange
														}
													>
														<FormControl>
															<SelectTrigger>
																<SelectValue
																	placeholder={
																		field.placeholder ??
																		"Select…"
																	}
																/>
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{opts.map((opt) => (
																<SelectItem
																	key={
																		opt.value
																	}
																	value={
																		opt.value
																	}
																>
																	{opt.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													{field.helpText && (
														<FormDescription>
															{field.helpText}
														</FormDescription>
													)}
													<FormMessage />
												</FormItem>
											)}
										/>
									);
								}

								if (field.type === "TEXTAREA") {
									return (
										<FormField
											key={field.id}
											control={form.control}
											name={`formFields.${field.id}`}
											render={({ field: f }) => (
												<FormItem>
													<FormLabel>
														{field.label}
														{field.required && " *"}
													</FormLabel>
													<FormControl>
														<Textarea
															{...f}
															placeholder={
																field.placeholder ??
																""
															}
															rows={3}
														/>
													</FormControl>
													{field.helpText && (
														<FormDescription>
															{field.helpText}
														</FormDescription>
													)}
													<FormMessage />
												</FormItem>
											)}
										/>
									);
								}

								// Default: TEXT / RADIO / etc.
								return (
									<FormField
										key={field.id}
										control={form.control}
										name={`formFields.${field.id}`}
										render={({ field: f }) => (
											<FormItem>
												<FormLabel>
													{field.label}
													{field.required && " *"}
												</FormLabel>
												<FormControl>
													<Input
														{...f}
														placeholder={
															field.placeholder ??
															""
														}
													/>
												</FormControl>
												{field.helpText && (
													<FormDescription>
														{field.helpText}
													</FormDescription>
												)}
												<FormMessage />
											</FormItem>
										)}
									/>
								);
							})}
						</CardContent>
					</Card>
				)}

				{serverError && (
					<p className="text-sm text-destructive text-center">
						{serverError}
					</p>
				)}

				<div className="flex justify-center">
					<Button
						type="submit"
						variant="primary"
						size="lg"
						className="px-12"
						disabled={submitting}
					>
						{submitting ? (
							<>
								<LoaderIcon className="mr-2 size-4 animate-spin" />
								Submitting…
							</>
						) : (
							"Submit Application"
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
