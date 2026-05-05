"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { orpcClient } from "@shared/lib/orpc-client";
import { CheckCircleIcon, LoaderIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { ChildCard } from "./ChildCard";

const childSchema = z.object({
	firstName: z.string().min(1, "Required"),
	lastName: z.string().min(1, "Required"),
	birthday: z.string().optional(),
	grade: z.string().optional(),
	isPartOfChurch: z.boolean().optional(),
	observationConsent: z.literal(true),
	termsConsent: z.literal(true),
	photoVideoConsent: z.literal(true),
	photoUrl: z.string().optional(),
	profileFields: z.record(z.string(), z.string()).optional(),
	formFields: z.record(z.string(), z.string()).optional(),
});

export const applicationFormSchema = z.object({
	parentFirstName: z.string().min(1, "First name is required"),
	parentLastName: z.string().min(1, "Last name is required"),
	parentEmail: z.string().email().optional().or(z.literal("")),
	parentPhone: z.string().optional(),
	parentAddressLine1: z.string().optional(),
	parentCity: z.string().optional(),
	parentStateProvince: z.string().optional(),
	parentPostalCode: z.string().optional(),
	parentCountry: z.string().optional(),
	emergencyContactName: z.string().optional(),
	emergencyContactPhone: z.string().optional(),
	emergencyContactEmail: z.string().email().optional().or(z.literal("")),
	hasSpouse: z.boolean().optional(),
	spouseFirstName: z.string().optional(),
	spouseLastName: z.string().optional(),
	spouseEmail: z.string().email().optional().or(z.literal("")),
	spousePhone: z.string().optional(),
	children: z.array(childSchema),
});

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

const defaultChild = {
	firstName: "",
	lastName: "",
	isPartOfChurch: false,
	observationConsent: false as unknown as true,
	termsConsent: false as unknown as true,
	photoVideoConsent: false as unknown as true,
};

export interface ProfileField {
	id: string;
	name: string;
	type: string;
	required: boolean;
	options: string[];
}

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

interface ApplicationFormProps {
	siteSlug: string;
	siteName?: string;
	profileFields?: ProfileField[];
	formFields?: BasicFormField[];
}

export function ApplicationForm({ siteSlug, profileFields = [], formFields = [] }: ApplicationFormProps) {
	const t = useTranslations("application");
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm<ApplicationFormValues>({
		resolver: zodResolver(applicationFormSchema),
		defaultValues: {
			parentFirstName: "",
			parentLastName: "",
			parentEmail: "",
			parentPhone: "",
			parentAddressLine1: "",
			parentCity: "",
			parentStateProvince: "",
			parentPostalCode: "",
			parentCountry: "",
			emergencyContactName: "",
			emergencyContactPhone: "",
			emergencyContactEmail: "",
			hasSpouse: false,
			children: [{ ...defaultChild }],
		},
	});

	const { fields: childFields, append: appendChild, remove: removeChild } = useFieldArray({
		control: form.control,
		name: "children",
	});

	const hasSpouse = form.watch("hasSpouse");

	const onSubmit = async (values: ApplicationFormValues) => {
		setSubmitting(true);
		setServerError(null);
		try {
			await orpcClient.applications.submit({
				siteSlug,
				parentFirstName: values.parentFirstName,
				parentLastName: values.parentLastName,
				parentEmail: values.parentEmail || undefined,
				parentPhone: values.parentPhone || undefined,
				parentAddressLine1: values.parentAddressLine1 || undefined,
				parentCity: values.parentCity || undefined,
				parentStateProvince: values.parentStateProvince || undefined,
				parentPostalCode: values.parentPostalCode || undefined,
				parentCountry: values.parentCountry || undefined,
				spouseFirstName: values.hasSpouse ? values.spouseFirstName || undefined : undefined,
				spouseLastName: values.hasSpouse ? values.spouseLastName || undefined : undefined,
				spouseEmail: values.hasSpouse ? values.spouseEmail || undefined : undefined,
				spousePhone: values.hasSpouse ? values.spousePhone || undefined : undefined,
				children: values.children.map((child) => {
					const childProfileFieldValues = profileFields
						.map((f) => ({ customFieldId: f.id, value: child.profileFields?.[f.id] ?? "" }))
						.filter((v) => v.value !== "");
					const childFormFieldValues = formFields
						.map((f) => ({ formFieldId: f.id, value: child.formFields?.[f.id] ?? "" }))
						.filter((v) => v.value !== "");
					return {
						firstName: child.firstName,
						lastName: child.lastName,
						birthday: child.birthday || undefined,
						grade: child.grade || undefined,
						isPartOfChurch: child.isPartOfChurch,
						emergencyContactName: values.emergencyContactName || undefined,
						emergencyContactPhone: values.emergencyContactPhone || undefined,
						emergencyContactEmail: values.emergencyContactEmail || undefined,
						observationConsent: child.observationConsent,
						termsConsent: child.termsConsent,
						photoVideoConsent: child.photoVideoConsent,
						photoUrl: child.photoUrl || undefined,
						profileFieldValues: childProfileFieldValues.length ? childProfileFieldValues : undefined,
						formFieldValues: childFormFieldValues.length ? childFormFieldValues : undefined,
					};
				}),
			});
			setSubmitted(true);
		} catch (err: unknown) {
			const message = (err as { message?: string })?.message;
			if (message?.includes("not currently being accepted")) {
				setServerError(t("serverError.notAccepted"));
			} else {
				setServerError(t("serverError.generic"));
			}
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
						<CardTitle className="text-2xl">{t("submitted.title")}</CardTitle>
						<p className="mt-2 text-muted-foreground max-w-sm">
							{t("submitted.message")}
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				{/* Parent Information */}
				<Card>
					<CardHeader>
						<CardTitle>{t("parent.title")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="parentFirstName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("parent.firstName")} *</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="parentLastName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("parent.lastName")} *</FormLabel>
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
								name="parentEmail"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("parent.email")}</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="parentPhone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("parent.phone")}</FormLabel>
										<FormControl>
											<Input type="tel" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="parentAddressLine1"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("parent.address")}</FormLabel>
									<FormControl>
										<Input {...field} placeholder="Street address" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="parentCity"
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
								name="parentStateProvince"
								render={({ field }) => (
									<FormItem>
										<FormLabel>State / Province</FormLabel>
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
								name="parentPostalCode"
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
								name="parentCountry"
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

						{/* Emergency Contact */}
						<div className="space-y-4 border-t pt-4">
							<h3 className="font-semibold">{t("parent.emergencyContact.title")}</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="emergencyContactName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("parent.emergencyContact.name")}</FormLabel>
											<FormControl>
												<Input {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="emergencyContactPhone"
									render={({ field }) => (
										<FormItem>
											<FormLabel>{t("parent.emergencyContact.phone")}</FormLabel>
											<FormControl>
												<Input type="tel" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="emergencyContactEmail"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("parent.emergencyContact.email")}</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Spouse Information */}
				<Card>
					<CardHeader>
						<CardTitle>{t("spouse.title")}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="hasSpouse"
							render={({ field }) => (
								<FormItem className="flex items-center gap-3 space-y-0">
									<FormControl>
										<Checkbox
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormLabel className="font-normal">
										{t("spouse.addSpouse")}
									</FormLabel>
								</FormItem>
							)}
						/>
						{hasSpouse && (
							<div className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="spouseFirstName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("spouse.firstName")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="spouseLastName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("spouse.lastName")}</FormLabel>
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
										name="spouseEmail"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("spouse.email")}</FormLabel>
												<FormControl>
													<Input type="email" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="spousePhone"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("spouse.phone")}</FormLabel>
												<FormControl>
													<Input type="tel" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Children */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-bold">{t("children.sectionTitle")}</h2>
						<Button
							type="button"
							onClick={() => appendChild({ ...defaultChild })}
						>
							<PlusIcon className="size-4 mr-2" />
							{t("children.addChild")}
						</Button>
					</div>

					{childFields.map((childField, index) => (
						<ChildCard
							key={childField.id}
							index={index}
							canRemove={childFields.length > 1}
							onRemove={() => removeChild(index)}
							control={form.control}
							setValue={form.setValue}
							profileFields={profileFields}
							formFields={formFields}
							siteSlug={siteSlug}
						/>
					))}
				</div>

				{serverError && (
					<p className="text-sm text-destructive text-center">{serverError}</p>
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
								{t("submitting")}
							</>
						) : (
							t("submit")
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
