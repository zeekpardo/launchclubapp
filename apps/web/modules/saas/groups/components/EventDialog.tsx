"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Form } from "@repo/ui/components/form";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
	type EventFormValues,
	EventDialogFields,
	RECURRENCE_OPTIONS,
} from "./EventDialogFields";

// ─── Schema ───────────────────────────────────────────────────────────────────

const recurrenceValues = RECURRENCE_OPTIONS.map((o) => o.value) as [
	(typeof RECURRENCE_OPTIONS)[number]["value"],
	...(typeof RECURRENCE_OPTIONS)[number]["value"][],
];

const formSchema = z
	.object({
		name: z.string().min(1, "Title is required"),
		description: z.string().optional(),
		eventType: z.enum(["regular", "guest", "family_site_visit"] as const),
		guestName: z.string().optional(),
		guestCompany: z.string().optional(),
		guestIndustry: z.string().optional(),
		recurrence: z.enum(recurrenceValues),
		startDate: z.string().min(1, "Start date is required"),
		endDate: z.string().min(1, "End date is required"),
		startTime: z.string().min(1, "Start time is required"),
		endTime: z.string().optional(),
	})
	.refine((d) => d.recurrence === "never" || d.endDate >= d.startDate, {
		message: "End date must be on or after start date",
		path: ["endDate"],
	});

// ─── Series count (mirrors server logic) ─────────────────────────────────────

function getMonthlyWeekdayDate(from: Date): Date {
	const dayOfWeek = from.getDay();
	const nthOccurrence = Math.ceil(from.getDate() / 7);
	const next = new Date(from.getFullYear(), from.getMonth() + 1, 1);
	while (next.getDay() !== dayOfWeek) next.setDate(next.getDate() + 1);
	next.setDate(next.getDate() + (nthOccurrence - 1) * 7);
	return next;
}

function countSeriesEvents(values: Partial<EventFormValues>): number {
	const { startDate, endDate, recurrence } = values;
	if (!startDate || !endDate || !recurrence) return 0;
	if (recurrence === "never") return 1;

	const [sy, sm, sd] = startDate.split("-").map(Number);
	const endLimit = new Date(endDate + "T23:59:59");
	let count = 0;
	let current = new Date(sy, sm - 1, sd);

	while (current <= endLimit && count < 200) {
		count++;
		const next = new Date(current);
		if (recurrence === "daily") {
			next.setDate(next.getDate() + 1);
		} else if (recurrence === "weekday") {
			do { next.setDate(next.getDate() + 1); } while (next.getDay() === 0 || next.getDay() === 6);
		} else if (recurrence === "weekly") {
			next.setDate(next.getDate() + 7);
		} else if (recurrence === "biweekly") {
			next.setDate(next.getDate() + 14);
		} else if (recurrence === "monthly_weekday") {
			next.setTime(getMonthlyWeekdayDate(next).getTime());
		} else if (recurrence === "monthly_date") {
			next.setMonth(next.getMonth() + 1);
		} else if (recurrence === "yearly") {
			next.setFullYear(next.getFullYear() + 1);
		}
		current = next;
	}
	return count;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Recurrence = EventFormValues["recurrence"];

interface EventDialogProps {
	groupIds: string[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultStartTime?: string;
	defaultEndTime?: string;
	defaultRecurrence?: Recurrence;
}

export function EventDialog({
	groupIds,
	open,
	onOpenChange,
	defaultStartTime = "",
	defaultEndTime = "",
	defaultRecurrence = "never",
}: EventDialogProps) {
	const queryClient = useQueryClient();
	const createSeries = useMutation(orpc.events.createSeries.mutationOptions());

	const today = new Date().toISOString().slice(0, 10);

	const form = useForm<EventFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			eventType: "regular",
			guestName: "",
			guestCompany: "",
			guestIndustry: "",
			recurrence: defaultRecurrence,
			startDate: today,
			endDate: today,
			startTime: defaultStartTime,
			endTime: defaultEndTime,
		},
	});

	const watchedValues = useWatch({ control: form.control });
	const recurrence = watchedValues.recurrence ?? "never";
	const eventType = watchedValues.eventType ?? "regular";
	const eventCount = countSeriesEvents(watchedValues);
	const isNever = recurrence === "never";

	const handleSubmit = form.handleSubmit(async (values) => {
		try {
			const result = await createSeries.mutateAsync({
				groupIds,
				name: values.name,
				description: values.description || undefined,
				eventType: values.eventType,
				guestName: values.guestName || undefined,
				guestCompany: values.guestCompany || undefined,
				guestIndustry: values.guestIndustry || undefined,
				startDate: values.startDate,
				endDate: isNever ? values.startDate : values.endDate,
				startTime: values.startTime,
				endTime: values.endTime || undefined,
				recurrence: values.recurrence,
			});
			for (const gId of groupIds) {
				queryClient.invalidateQueries(
					orpc.events.list.queryOptions({ input: { groupId: gId } }),
				);
			}
			toastSuccess(
				result.count === 1 ? "Event created." : `${result.count} events created.`,
			);
			form.reset();
			onOpenChange(false);
		} catch {
			toastError("Failed to create events. Please try again.");
		}
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Create Event</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={handleSubmit} className="space-y-4">
						<EventDialogFields
							control={form.control}
							eventType={eventType}
							isNever={isNever}
							startDate={watchedValues.startDate ?? today}
							today={today}
						/>

						<DialogFooter className="flex items-center gap-3 pt-2">
							{eventCount > 0 && (
								<p className="mr-auto text-sm text-muted-foreground">
									{eventCount === 1
										? "1 event will be created"
										: `${eventCount} events will be created`}
								</p>
							)}
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={eventCount === 0}
								loading={form.formState.isSubmitting}
							>
								{eventCount <= 1 ? "Save Event" : `Create ${eventCount} Events`}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
