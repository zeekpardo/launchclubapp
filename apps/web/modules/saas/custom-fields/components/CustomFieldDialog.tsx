"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CUSTOM_FIELD_TYPES } from "@repo/api/modules/custom-fields/types";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
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
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	useCreateCustomField,
	useUpdateCustomField,
} from "../hooks/use-custom-fields";

const FIELD_TYPES = CUSTOM_FIELD_TYPES;

const formSchema = z.object({
	name: z.string().min(1),
	nameEs: z.string().optional(),
	type: z.enum(FIELD_TYPES),
	required: z.boolean(),
	options: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface CustomFieldDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	field?: {
		id: string;
		name: string;
		nameEs?: string | null;
		type: (typeof FIELD_TYPES)[number];
		required: boolean;
		options: string[];
		order: number;
	};
}

export function CustomFieldDialog({
	open,
	onOpenChange,
	organizationId,
	field,
}: CustomFieldDialogProps) {
	const t = useTranslations();
	const createField = useCreateCustomField(organizationId);
	const updateField = useUpdateCustomField(organizationId);
	const isEditing = Boolean(field);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: field?.name ?? "",
			nameEs: field?.nameEs ?? "",
			type: field?.type ?? "TEXT",
			required: field?.required ?? false,
			options: field?.options.join("\n") ?? "",
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: field?.name ?? "",
				nameEs: field?.nameEs ?? "",
				type: field?.type ?? "TEXT",
				required: field?.required ?? false,
				options: field?.options.join("\n") ?? "",
			});
		}
	}, [open, field, form]);

	const watchType = form.watch("type");

	async function onSubmit(values: FormValues) {
		const options = values.options
			.split("\n")
			.map((o) => o.trim())
			.filter(Boolean);

		try {
			if (isEditing && field) {
				await updateField.mutateAsync({
					id: field.id,
					name: values.name,
					nameEs: values.nameEs || null,
					required: values.required,
					options,
				});
				toastSuccess(
					t("launchclub.customFields.notifications.updated"),
				);
			} else {
				await createField.mutateAsync({
					organizationId,
					name: values.name,
					nameEs: values.nameEs || null,
					type: values.type,
					required: values.required,
					options,
					order: field?.order ?? 0,
				});
				toastSuccess(
					t("launchclub.customFields.notifications.created"),
				);
			}
			onOpenChange(false);
		} catch {
			toastError(t("launchclub.customFields.notifications.error"));
		}
	}

	const isPending = createField.isPending || updateField.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEditing
							? t("launchclub.customFields.edit")
							: t("launchclub.customFields.new")}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field: f }) => (
								<FormItem>
									<FormLabel>
										{t("launchclub.customFields.form.name")}
									</FormLabel>
									<FormControl>
										<Input {...f} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="nameEs"
							render={({ field: f }) => (
								<FormItem>
									<FormLabel>
										{t(
											"launchclub.customFields.form.nameEs",
										)}
									</FormLabel>
									<FormControl>
										<Input {...f} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="type"
							render={({ field: f }) => (
								<FormItem>
									<FormLabel>
										{t("launchclub.customFields.form.type")}
									</FormLabel>
									<Select
										onValueChange={f.onChange}
										value={f.value}
										disabled={isEditing}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{FIELD_TYPES.map((type) => (
												<SelectItem
													key={type}
													value={type}
												>
													{t(
														`launchclub.customFields.form.types.${type}`,
													)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{isEditing && (
										<p className="text-xs text-muted-foreground">
											{t(
												"launchclub.customFields.form.typeLockedHint",
											)}
										</p>
									)}
									<FormMessage />
								</FormItem>
							)}
						/>
						{watchType === "SELECT" && (
							<FormField
								control={form.control}
								name="options"
								render={({ field: f }) => (
									<FormItem>
										<FormLabel>
											{t(
												"launchclub.customFields.form.options",
											)}
										</FormLabel>
										<FormControl>
											<Textarea
												{...f}
												rows={4}
												placeholder="Option 1&#10;Option 2&#10;Option 3"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						<FormField
							control={form.control}
							name="required"
							render={({ field: f }) => (
								<FormItem className="flex items-center gap-2 space-y-0">
									<FormControl>
										<Checkbox
											checked={f.value}
											onCheckedChange={f.onChange}
										/>
									</FormControl>
									<FormLabel className="font-normal cursor-pointer">
										{t(
											"launchclub.customFields.form.required",
										)}
									</FormLabel>
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type="submit" loading={isPending}>
								{t("launchclub.customFields.form.save")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
