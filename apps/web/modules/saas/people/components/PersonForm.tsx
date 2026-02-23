"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
	Form,
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
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { CustomFieldInput } from "@saas/custom-fields/components/CustomFieldInput";
import type { CustomFieldType } from "@repo/api/modules/custom-fields/types";
import {
	useCreatePerson,
	useUpdatePerson,
} from "../hooks/use-people";
import { PersonAvatarUpload } from "./PersonAvatarUpload";

const GRADES = [
	"Pre-K",
	"Kindergarten",
	"1st Grade",
	"2nd Grade",
	"3rd Grade",
	"4th Grade",
	"5th Grade",
	"6th Grade",
	"7th Grade",
	"8th Grade",
	"9th Grade",
	"10th Grade",
	"11th Grade",
	"12th Grade",
];

const personFormSchema = z.object({
	isChild: z.boolean(),
	firstName: z.string().min(1),
	lastName: z.string().min(1),
	email: z.string().email().optional().or(z.literal("")),
	phone: z.string().optional(),
	dateOfBirth: z.string().optional(),
	gender: z.string().optional(),
	grade: z.string().optional(),
	notes: z.string().optional(),
});

type PersonFormValues = z.infer<typeof personFormSchema>;

interface PersonData {
	id: string;
	firstName: string;
	lastName: string;
	email?: string | null;
	phone?: string | null;
	dateOfBirth?: Date | string | null;
	gender?: string | null;
	isChild?: boolean | null;
	grade?: string | null;
	householdId?: string | null;
	notes?: string | null;
	avatarUrl?: string | null;
}

interface PersonFormProps {
	person?: PersonData;
	organizationId: string;
	onSuccess: (personId?: string) => void;
	backHref?: string;
	householdId?: string;
	getHouseholdId?: () => Promise<string | undefined>;
}

export function PersonForm({ person, organizationId, onSuccess, backHref, householdId, getHouseholdId }: PersonFormProps) {
	const t = useTranslations();
	const createPerson = useCreatePerson();
	const updatePerson = useUpdatePerson();
	const setCustomFieldValue = useMutation(orpc.customFields.setValue.mutationOptions());

	const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

	const { data: customFields = [] } = useQuery(
		orpc.customFields.list.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);

	const formatDateForInput = (date?: Date | string | null): string => {
		if (!date) return "";
		const d = typeof date === "string" ? new Date(date) : date;
		if (Number.isNaN(d.getTime())) return "";
		return d.toISOString().slice(0, 10);
	};

	const form = useForm<PersonFormValues>({
		resolver: zodResolver(personFormSchema),
		defaultValues: {
			isChild: person?.isChild ?? false,
			firstName: person?.firstName ?? "",
			lastName: person?.lastName ?? "",
			email: person?.email ?? "",
			phone: person?.phone ?? "",
			dateOfBirth: formatDateForInput(person?.dateOfBirth),
			gender: person?.gender ?? "",
			grade: person?.grade ?? "",
			notes: person?.notes ?? "",
		},
	});

	const isChild = useWatch({ control: form.control, name: "isChild" });

	const saveCustomFields = async (personId: string) => {
		const filled = customFields.filter(
			(f) => customFieldValues[f.id] !== undefined && customFieldValues[f.id] !== "",
		);
		await Promise.all(
			filled.map((f) =>
				setCustomFieldValue.mutateAsync({
					organizationId,
					customFieldId: f.id,
					personId,
					value: customFieldValues[f.id],
				}),
			),
		);
	};

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const dateOfBirth = values.dateOfBirth
				? new Date(values.dateOfBirth).toISOString()
				: undefined;

			const resolvedHouseholdId = getHouseholdId
				? await getHouseholdId()
				: householdId;

			const payload = {
				isChild: values.isChild,
				firstName: values.firstName,
				lastName: values.lastName,
				email: values.email || undefined,
				phone: values.phone || undefined,
				dateOfBirth,
				gender: values.gender || undefined,
				grade: values.isChild ? (values.grade || undefined) : undefined,
				householdId: resolvedHouseholdId || undefined,
				notes: values.notes || undefined,
			};

			if (person) {
				await updatePerson.mutateAsync({ id: person.id, ...payload });
				await saveCustomFields(person.id);
				toastSuccess(t("launchclub.people.form.notifications.updated"));
				onSuccess();
			} else {
				const created = await createPerson.mutateAsync({ organizationId, ...payload });
				await saveCustomFields(created.id);
				toastSuccess(t("launchclub.people.form.notifications.created"));
				onSuccess(created.id);
			}
		} catch {
			toastError(t("launchclub.people.form.notifications.error"));
		}
	});

	const isPending = createPerson.isPending || updatePerson.isPending || setCustomFieldValue.isPending;

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} className="space-y-6">

				{/* Avatar — only in edit mode */}
				{person && (
					<PersonAvatarUpload
						personId={person.id}
						firstName={form.getValues("firstName") || person.firstName}
						lastName={form.getValues("lastName") || person.lastName}
						avatarUrl={person.avatarUrl ?? null}
					/>
				)}

				{/* Name */}
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="firstName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("launchclub.people.form.firstName")}</FormLabel>
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
								<FormLabel>{t("launchclub.people.form.lastName")}</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Gender / DOB / Phone */}
				<div className="grid gap-4 md:grid-cols-3">
					<FormField
						control={form.control}
						name="gender"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("launchclub.people.form.gender")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="male">
											{t("launchclub.people.form.genderOptions.male")}
										</SelectItem>
										<SelectItem value="female">
											{t("launchclub.people.form.genderOptions.female")}
										</SelectItem>
										<SelectItem value="other">
											{t("launchclub.people.form.genderOptions.other")}
										</SelectItem>
										<SelectItem value="preferNotToSay">
											{t("launchclub.people.form.genderOptions.preferNotToSay")}
										</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="dateOfBirth"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("launchclub.people.form.dateOfBirth")}</FormLabel>
								<FormControl>
									<Input type="date" {...field} />
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
								<FormLabel>{t("launchclub.people.form.phone")}</FormLabel>
								<FormControl>
									<Input type="tel" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Email */}
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("launchclub.people.form.email")}</FormLabel>
							<FormControl>
								<Input type="email" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* isChild toggle */}
				<div className="grid gap-4 md:grid-cols-2">
					<FormField
						control={form.control}
						name="isChild"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
								<FormLabel className="text-base font-medium">
									{t("launchclub.people.form.isChild")}
								</FormLabel>
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				{/* Grade — child only */}
				{isChild && (
					<FormField
						control={form.control}
						name="grade"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("launchclub.people.form.grade")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder={t("launchclub.people.form.gradePlaceholder")} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{GRADES.map((g) => (
											<SelectItem key={g} value={g}>
												{g}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}

				{/* Notes */}
				<FormField
					control={form.control}
					name="notes"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t("launchclub.people.form.notes")}</FormLabel>
							<FormControl>
								<Textarea rows={3} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Custom fields */}
				{customFields.length > 0 && (
					<div className="space-y-4 border-t pt-4">
						<p className="text-sm font-medium text-muted-foreground">
							{t("launchclub.customFields.title")}
						</p>
						{customFields.map((field) => (
							<div key={field.id} className="space-y-1">
								<label className="text-sm font-medium">
									{field.name}
									{field.required && (
										<span className="ml-1 text-destructive">*</span>
									)}
								</label>
								<CustomFieldInput
									type={field.type as CustomFieldType}
									value={customFieldValues[field.id] ?? null}
									options={field.options}
									onChange={(val) =>
										setCustomFieldValues((prev) => ({
											...prev,
											[field.id]: val ?? "",
										}))
									}
								/>
							</div>
						))}
					</div>
				)}

				{/* Actions */}
				<div className="flex gap-4">
					{backHref ? (
						<Button asChild variant="outline" type="button">
							<Link href={backHref}>{t("launchclub.people.form.cancel")}</Link>
						</Button>
					) : (
						<Button variant="outline" type="button" onClick={() => onSuccess()}>
							{t("launchclub.people.form.cancel")}
						</Button>
					)}
					<Button type="submit" loading={isPending}>
						{t("launchclub.people.form.save")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
