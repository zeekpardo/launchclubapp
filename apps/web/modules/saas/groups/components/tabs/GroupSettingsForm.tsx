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
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	type GroupDetail,
	useUpdateGroup,
} from "@saas/groups/hooks/use-groups";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DayPicker, GradePicker, RecurrenceSelect } from "../GroupFormFields";

const settingsSchema = z.object({
	name: z.string().min(1),
	siteId: z.string().min(1),
	description: z.string().optional(),
	gradeLevel: z.string().optional(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	meetingDay: z.string().optional(),
	meetingTime: z.string().optional(),
	meetingEndTime: z.string().optional(),
	meetingRecurrence: z.string().optional(),
});
type SettingsValues = z.infer<typeof settingsSchema>;

interface GroupSettingsFormProps {
	groupId: string;
	group: GroupDetail;
}

export function GroupSettingsForm({ groupId, group }: GroupSettingsFormProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const updateGroup = useUpdateGroup();

	const { data: sites, isLoading: sitesLoading } = useQuery(
		orpc.sites.list.queryOptions({
			input: { organizationId: group.site?.area?.organizationId ?? "" },
			enabled: !!group.site?.area?.organizationId,
		}),
	);

	const form = useForm<SettingsValues>({
		resolver: zodResolver(settingsSchema),
		defaultValues: {
			name: "",
			siteId: "",
			description: "",
			gradeLevel: "",
			startDate: "",
			endDate: "",
			meetingDay: "",
			meetingTime: "",
			meetingEndTime: "",
			meetingRecurrence: "",
		},
	});

	useEffect(() => {
		if (group) {
			form.reset({
				name: group.name,
				siteId: group.siteId,
				description: group.description ?? "",
				gradeLevel: group.gradeLevel ?? "",
				startDate: group.startDate
					? new Date(group.startDate).toISOString().slice(0, 10)
					: "",
				endDate: group.endDate
					? new Date(group.endDate).toISOString().slice(0, 10)
					: "",
				meetingDay: group.meetingDay ?? "",
				meetingTime: group.meetingTime ?? "",
				meetingEndTime: group.meetingEndTime ?? "",
				meetingRecurrence: group.meetingRecurrence ?? "",
			});
		}
	}, [group, form]);

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			await updateGroup.mutateAsync({
				id: groupId,
				...values,
				startDate: values.startDate
					? new Date(values.startDate).toISOString()
					: undefined,
				endDate: values.endDate
					? new Date(values.endDate).toISOString()
					: undefined,
			});
			await queryClient.invalidateQueries(
				orpc.groups.get.queryOptions({ input: { id: groupId } }),
			);
			toastSuccess(t("launchclub.groups.form.notifications.updated"));
		} catch {
			toastError(t("launchclub.groups.form.notifications.error"));
		}
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} className="space-y-4">
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("launchclub.groups.form.name")}
							</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="siteId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("launchclub.groups.form.site")}
							</FormLabel>
							<FormControl>
								{sitesLoading ? (
									<Skeleton className="h-10 w-full" />
								) : (
									<Select
										value={field.value}
										onValueChange={field.onChange}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{sites?.map((site) => (
												<SelectItem
													key={site.id}
													value={site.id}
												>
													{site.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="startDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Start date</FormLabel>
								<FormControl>
									<Input
										type="date"
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="endDate"
						render={({ field }) => (
							<FormItem>
								<FormLabel>End date</FormLabel>
								<FormControl>
									<Input
										type="date"
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="gradeLevel"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("launchclub.groups.columns.gradeLevel")}
							</FormLabel>
							<FormControl>
								<GradePicker
									value={field.value ?? ""}
									onChange={field.onChange}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="meetingDay"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("launchclub.groups.columns.meetingDays")}
							</FormLabel>
							<FormControl>
								<DayPicker
									value={field.value ?? ""}
									onChange={field.onChange}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div className="grid grid-cols-3 gap-3">
					<FormField
						control={form.control}
						name="meetingTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Start time</FormLabel>
								<FormControl>
									<Input
										type="time"
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="meetingEndTime"
						render={({ field }) => (
							<FormItem>
								<FormLabel>End time</FormLabel>
								<FormControl>
									<Input
										type="time"
										{...field}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="meetingRecurrence"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									{t(
										"launchclub.groups.form.meetingRecurrence",
									)}
								</FormLabel>
								<FormControl>
									<RecurrenceSelect
										value={field.value ?? ""}
										onChange={field.onChange}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<div className="flex justify-end">
					<Button type="submit" loading={form.formState.isSubmitting}>
						{t("launchclub.groups.form.save")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
