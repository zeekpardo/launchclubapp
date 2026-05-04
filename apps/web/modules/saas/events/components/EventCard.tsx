"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useDeleteEvent } from "@saas/events/hooks/use-events";
import {
	CalendarCheckIcon,
	CalendarIcon,
	ClockIcon,
	PencilIcon,
	TrashIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EventDialog } from "./EventDialog";

interface EventGroup {
	group: { id: string; name: string; _count?: { personGroups: number } };
}

interface EventCardProps {
	event: {
		id: string;
		name: string;
		description?: string | null;
		startsAt: Date | string;
		endsAt?: Date | string | null;
		_count?: { attendance: number };
		eventGroups: EventGroup[];
	};
	organizationId: string;
}

export function EventCard({ event, organizationId }: EventCardProps) {
	const t = useTranslations();
	const deleteEvent = useDeleteEvent();
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);

	const startsAt = new Date(event.startsAt);

	const dayLabel = new Intl.DateTimeFormat(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
	}).format(startsAt);

	const timeLabel = new Intl.DateTimeFormat(undefined, {
		hour: "2-digit",
		minute: "2-digit",
	}).format(startsAt);

	const totalMembers = event.eventGroups.reduce(
		(sum, eg) => sum + (eg.group._count?.personGroups ?? 0),
		0,
	);

	const primaryGroup = event.eventGroups[0]?.group;
	const extraGroups = event.eventGroups.length - 1;

	const handleDelete = async () => {
		try {
			await deleteEvent.mutateAsync({ id: event.id });
			toastSuccess(t("launchclub.events.form.notifications.deleted"));
		} catch {
			toastError(t("launchclub.events.form.notifications.error"));
		} finally {
			setDeleteOpen(false);
		}
	};

	return (
		<>
			<Card className="flex flex-col gap-3 p-4 transition-shadow hover:shadow-md">
				{/* Header row: name + actions */}
				<div className="flex items-start justify-between gap-2">
					<p className="font-semibold text-base leading-tight">{event.name}</p>
					<div className="flex shrink-0 gap-0.5">
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={() => setEditOpen(true)}
							aria-label={t("launchclub.events.edit")}
						>
							<PencilIcon className="size-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-7"
							onClick={() => setDeleteOpen(true)}
							aria-label={t("launchclub.events.delete")}
						>
							<TrashIcon className="size-3.5 text-destructive" />
						</Button>
					</div>
				</div>

				{/* Groups */}
				{primaryGroup && (
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<UsersIcon className="size-3.5 shrink-0" />
						<span>{primaryGroup.name}</span>
						{extraGroups > 0 && (
							<span className="text-xs text-muted-foreground">+{extraGroups} more</span>
						)}
					</div>
				)}

				{/* Date / time */}
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<CalendarIcon className="size-3.5 shrink-0" />
						{dayLabel}
					</span>
					<span className="flex items-center gap-1.5">
						<ClockIcon className="size-3.5 shrink-0" />
						{timeLabel}
					</span>
				</div>

				{/* Description */}
				{event.description && (
					<p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
						{event.description}
					</p>
				)}

				{/* Footer: attendance */}
				<div className="mt-auto pt-1">
					<Badge
						status={totalMembers > 0 ? "success" : "info"}
						className="flex w-fit items-center gap-1"
					>
						<CalendarCheckIcon className="size-3" />
						{t("launchclub.events.attendanceCount", {
							count: totalMembers,
						})}
					</Badge>
				</div>
			</Card>

			<EventDialog
				open={editOpen}
				onOpenChange={setEditOpen}
				event={{
					id: event.id,
					name: event.name,
					description: event.description,
					startsAt: event.startsAt,
					endsAt: event.endsAt,
					eventGroups: event.eventGroups,
				}}
				organizationId={organizationId}
			/>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("launchclub.events.confirmDelete.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("launchclub.events.confirmDelete.message")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							{t("launchclub.events.confirmDelete.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
