"use client";

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
import { Skeleton } from "@repo/ui/components/skeleton";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { DayPicker, GradePicker, RecurrenceSelect } from "./GroupFormFields";

interface Site {
	id: string;
	name: string;
}

interface GroupFormValues {
	name: string;
	siteId: string;
	description?: string;
	gradeLevel?: string;
	startDate?: string;
	endDate?: string;
	meetingDay?: string;
	meetingTime?: string;
	meetingEndTime?: string;
	meetingRecurrence?: string;
}

interface GroupDialogFieldsProps {
	control: Control<GroupFormValues>;
	sites: Site[] | undefined;
	sitesLoading: boolean;
}

export function GroupDialogFields({
	control,
	sites,
	sitesLoading,
}: GroupDialogFieldsProps) {
	const t = useTranslations();

	return (
		<>
			<FormField
				control={control}
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
				control={control}
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
					control={control}
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
					control={control}
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
				control={control}
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
				control={control}
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
					control={control}
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
					control={control}
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
					control={control}
					name="meetingRecurrence"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("launchclub.groups.form.meetingRecurrence")}
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
		</>
	);
}
