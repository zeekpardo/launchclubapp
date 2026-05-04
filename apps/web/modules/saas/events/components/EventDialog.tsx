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
import {
	EventDialogFields,
	RECURRENCE_OPTIONS,
	type EventFormValues,
} from "@saas/groups/components/EventDialogFields";
import { GroupPicker } from "@shared/components/GroupPicker";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const recurrenceValues = RECURRENCE_OPTIONS.map((o) => o.value) as [
	(typeof RECURRENCE_OPTIONS)[number]["value"],
	...(typeof RECURRENCE_OPTIONS)[number]["value"][],
];

const createSchema = z
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

function toDatetimeLocal(dateStr: string | Date | null | undefined): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface EventDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	event?: {
		id: string;
		name: string;
		description?: string | null;
		eventType?: "regular" | "guest" | "family_site_visit" | null;
		guestName?: string | null;
		guestCompany?: string | null;
		guestIndustry?: string | null;
		startsAt: string | Date;
		endsAt?: string | Date | null;
		eventGroups?: { group: { id: string; name: string } }[];
	};
	organizationId: string;
	defaultGroupId?: string;
}

// ─── Edit Mode ────────────────────────────────────────────────────────────────

function EditEventForm({
	event,
	organizationId,
	onClose,
}: {
	event: NonNullable<EventDialogProps["event"]>;
	organizationId: string;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const updateEvent = useMutation(orpc.events.update.mutationOptions());

	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
		() => event.eventGroups?.map(({ group }) => group.id) ?? [],
	);
	const [groupError, setGroupError] = useState<string>();

	const { data: groups = [] } = useQuery(
		orpc.groups.list.queryOptions({ input: { organizationId } }),
	);

	const toggleGroup = (groupId: string) => {
		setGroupError(undefined);
		setSelectedGroupIds((prev) =>
			prev.includes(groupId) ? prev.filter((x) => x !== groupId) : [...prev, groupId],
		);
	};

	const dtStart = toDatetimeLocal(event.startsAt);
	const dtEnd = toDatetimeLocal(event.endsAt);
	const [startDate, startTime] = dtStart ? dtStart.split("T") : ["", ""];
	const endTime = dtEnd ? dtEnd.split("T")[1] : "";

	const form = useForm<EventFormValues>({
		resolver: zodResolver(createSchema),
		defaultValues: {
			name: event.name,
			description: event.description ?? "",
			eventType: event.eventType ?? "regular",
			guestName: event.guestName ?? "",
			guestCompany: event.guestCompany ?? "",
			guestIndustry: event.guestIndustry ?? "",
			recurrence: "never",
			startDate,
			endDate: startDate,
			startTime,
			endTime,
		},
	});

	const watchedValues = useWatch({ control: form.control });
	const eventType = watchedValues.eventType ?? "regular";
	const today = new Date().toISOString().slice(0, 10);

	const onSubmit = form.handleSubmit(async (values) => {
		if (selectedGroupIds.length === 0) {
			setGroupError("Select at least one group");
			return;
		}
		try {
			await updateEvent.mutateAsync({
				id: event.id,
				groupIds: selectedGroupIds,
				name: values.name,
				description: values.description || undefined,
				eventType: values.eventType,
				guestName: values.guestName || undefined,
				guestCompany: values.guestCompany || undefined,
				guestIndustry: values.guestIndustry || undefined,
				startsAt: new Date(`${values.startDate}T${values.startTime}`).toISOString(),
				endsAt: values.endTime
					? new Date(`${values.startDate}T${values.endTime}`).toISOString()
					: undefined,
			});
			await queryClient.invalidateQueries({ queryKey: orpc.events.listByOrg.key() });
			await queryClient.invalidateQueries({ queryKey: orpc.events.list.key() });
			toastSuccess("Event updated.");
			onClose();
		} catch {
			toastError("Failed to update event.");
		}
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} className="space-y-4">
				<EventDialogFields
					control={form.control}
					eventType={eventType}
					isNever={true}
					startDate={watchedValues.startDate ?? today}
					today={today}
					hideRecurrence={true}
				/>

				<div className="space-y-1.5">
					<p className="text-sm font-medium">Groups</p>
					<GroupPicker
						groups={groups}
						selectedGroupIds={selectedGroupIds}
						onToggle={toggleGroup}
						error={groupError}
					/>
				</div>

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
					<Button type="submit" loading={form.formState.isSubmitting}>Save</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}

// ─── Create Mode ──────────────────────────────────────────────────────────────

function CreateEventForm({
	organizationId,
	defaultGroupId,
	onClose,
}: {
	organizationId: string;
	defaultGroupId?: string;
	onClose: () => void;
}) {
	const queryClient = useQueryClient();
	const createSeries = useMutation(orpc.events.createSeries.mutationOptions());
	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
		defaultGroupId ? [defaultGroupId] : [],
	);
	const [groupError, setGroupError] = useState<string>();

	const { data: groups = [] } = useQuery(
		orpc.groups.list.queryOptions({
			input: { organizationId },
			enabled: !defaultGroupId,
		}),
	);

	const today = new Date().toISOString().slice(0, 10);

	const form = useForm<EventFormValues>({
		resolver: zodResolver(createSchema),
		defaultValues: {
			name: "",
			description: "",
			eventType: "regular",
			guestName: "",
			guestCompany: "",
			guestIndustry: "",
			recurrence: "never",
			startDate: today,
			endDate: today,
			startTime: "",
			endTime: "",
		},
	});

	const watchedValues = useWatch({ control: form.control });
	const recurrence = watchedValues.recurrence ?? "never";
	const eventType = watchedValues.eventType ?? "regular";
	const eventCount = countSeriesEvents(watchedValues);
	const isNever = recurrence === "never";

	const toggleGroup = (groupId: string) => {
		setGroupError(undefined);
		setSelectedGroupIds((prev) =>
			prev.includes(groupId) ? prev.filter((x) => x !== groupId) : [...prev, groupId],
		);
	};

	const handleSubmit = form.handleSubmit(async (values) => {
		if (selectedGroupIds.length === 0) {
			setGroupError("Select at least one group");
			return;
		}
		try {
			const result = await createSeries.mutateAsync({
				groupIds: selectedGroupIds,
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
			await queryClient.invalidateQueries({ queryKey: orpc.events.listByOrg.key() });
			await queryClient.invalidateQueries({ queryKey: orpc.events.list.key() });
			toastSuccess(result.count === 1 ? "Event created." : `${result.count} events created.`);
			form.reset();
			setSelectedGroupIds(defaultGroupId ? [defaultGroupId] : []);
			onClose();
		} catch {
			toastError("Failed to create events. Please try again.");
		}
	});

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit} className="space-y-4">
				<EventDialogFields
					control={form.control}
					eventType={eventType}
					isNever={isNever}
					startDate={watchedValues.startDate ?? today}
					today={today}
				/>

				{!defaultGroupId && (
					<div className="space-y-1.5">
						<p className="text-sm font-medium">Groups</p>
						<GroupPicker
							groups={groups}
							selectedGroupIds={selectedGroupIds}
							onToggle={toggleGroup}
							error={groupError}
						/>
					</div>
				)}

				<DialogFooter className="flex items-center gap-3 pt-2">
					{eventCount > 0 && (
						<p className="mr-auto text-sm text-muted-foreground">
							{eventCount === 1 ? "1 event will be created" : `${eventCount} events will be created`}
						</p>
					)}
					<Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
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
	);
}

// ─── Dialog wrapper ───────────────────────────────────────────────────────────

export function EventDialog({
	open,
	onOpenChange,
	event,
	organizationId,
	defaultGroupId,
}: EventDialogProps) {
	const isEditing = Boolean(event);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{isEditing ? "Edit Event" : "Create Event"}</DialogTitle>
				</DialogHeader>

				{isEditing && event ? (
					<EditEventForm event={event} organizationId={organizationId} onClose={() => onOpenChange(false)} />
				) : (
					<CreateEventForm
						organizationId={organizationId}
						defaultGroupId={defaultGroupId}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
