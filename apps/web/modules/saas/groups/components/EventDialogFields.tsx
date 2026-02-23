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
import { type Control } from "react-hook-form";

// ─── Options ─────────────────────────────────────────────────────────────────

export const EVENT_TYPE_OPTIONS = [
	{ value: "regular", label: "Regular" },
	{ value: "guest", label: "Guest" },
	{ value: "family_site_visit", label: "Family Site Visit" },
] as const;

export const RECURRENCE_OPTIONS = [
	{ value: "never", label: "Does not repeat" },
	{ value: "daily", label: "Daily" },
	{ value: "weekday", label: "Every weekday (Mon–Fri)" },
	{ value: "weekly", label: "Weekly" },
	{ value: "biweekly", label: "Every 2 weeks" },
	{ value: "monthly_weekday", label: "Monthly (same weekday)" },
	{ value: "monthly_date", label: "Monthly (same date)" },
	{ value: "yearly", label: "Yearly" },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventFormValues {
	name: string;
	description?: string;
	eventType: "regular" | "guest" | "family_site_visit";
	guestName?: string;
	guestCompany?: string;
	guestIndustry?: string;
	recurrence: "never" | "daily" | "weekday" | "weekly" | "biweekly" | "monthly_weekday" | "monthly_date" | "yearly";
	startDate: string;
	endDate: string;
	startTime: string;
	endTime?: string;
}

interface EventDialogFieldsProps {
	control: Control<EventFormValues>;
	eventType: string;
	isNever: boolean;
	startDate: string;
	today: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EventDialogFields({
	control,
	eventType,
	isNever,
	startDate,
	today,
}: EventDialogFieldsProps) {
	const isGuest = eventType === "guest";

	return (
		<>
			{/* Title */}
			<FormField
				control={control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Title</FormLabel>
						<FormControl>
							<Input placeholder="Title" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Event Type */}
			<FormField
				control={control}
				name="eventType"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Event Type</FormLabel>
						<Select value={field.value} onValueChange={field.onChange}>
							<FormControl>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{EVENT_TYPE_OPTIONS.map(({ value, label }) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Guest fields — only shown when event type is "guest" */}
			{isGuest && (
				<>
					<FormField
						control={control}
						name="guestName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Guest Name</FormLabel>
								<FormControl>
									<Input placeholder="Guest Name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="guestCompany"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Company Name</FormLabel>
								<FormControl>
									<Input placeholder="Company Name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={control}
						name="guestIndustry"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Industry</FormLabel>
								<FormControl>
									<Input placeholder="Industry" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			)}

			{/* Description */}
			<FormField
				control={control}
				name="description"
				render={({ field }) => (
					<FormItem>
						<FormLabel>
							Description{" "}
							<span className="font-normal text-muted-foreground">(optional)</span>
						</FormLabel>
						<FormControl>
							<Input placeholder="Description" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Date */}
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={control}
					name="startDate"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Date</FormLabel>
							<FormControl>
								<Input type="date" {...field} />
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
							<FormLabel>End Date</FormLabel>
							<FormControl>
								<Input
									type="date"
									disabled={isNever}
									{...field}
									value={isNever ? (startDate || today) : field.value}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			{/* Times */}
			<div className="grid grid-cols-2 gap-4">
				<FormField
					control={control}
					name="startTime"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Start Time</FormLabel>
							<FormControl>
								<Input type="time" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name="endTime"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								End Time{" "}
								<span className="font-normal text-muted-foreground">(optional)</span>
							</FormLabel>
							<FormControl>
								<Input type="time" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			{/* Recurrence */}
			<FormField
				control={control}
				name="recurrence"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Recurrence</FormLabel>
						<Select value={field.value} onValueChange={field.onChange}>
							<FormControl>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{RECURRENCE_OPTIONS.map(({ value, label }) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}
