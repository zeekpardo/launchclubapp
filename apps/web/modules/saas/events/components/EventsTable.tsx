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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useDeleteEvent } from "@saas/events/hooks/use-events";
import { AttendanceDialog } from "@shared/components/AttendanceDialog";
import { CalendarCheckIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EventDialog } from "./EventDialog";

interface EventGroup {
	group: { id: string; name: string; _count?: { personGroups: number } };
}

interface EventRow {
	id: string;
	name: string;
	description?: string | null;
	eventType?: "regular" | "guest" | "family_site_visit" | null;
	guestName?: string | null;
	guestCompany?: string | null;
	guestIndustry?: string | null;
	startsAt: Date | string;
	endsAt?: Date | string | null;
	_count?: { attendance: number };
	eventGroups: EventGroup[];
}

interface EventsTableProps {
	events: EventRow[];
	organizationId: string;
}

function EventTableRow({
	event,
	organizationId,
}: { event: EventRow; organizationId: string }) {
	const t = useTranslations();
	const deleteEvent = useDeleteEvent();
	const [editOpen, setEditOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [attendanceOpen, setAttendanceOpen] = useState(false);

	const startsAt = new Date(event.startsAt);
	const dateLabel = new Intl.DateTimeFormat(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
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
			<TableRow>
				<TableCell className="font-medium">{event.name}</TableCell>
				<TableCell className="text-muted-foreground">
					{primaryGroup ? (
						<span>
							{primaryGroup.name}
							{extraGroups > 0 && (
								<span className="ml-1 text-xs">+{extraGroups}</span>
							)}
						</span>
					) : "—"}
				</TableCell>
				<TableCell className="text-muted-foreground whitespace-nowrap">
					{dateLabel}
				</TableCell>
				<TableCell className="text-muted-foreground whitespace-nowrap">
					{timeLabel}
				</TableCell>
				<TableCell>
					<Badge
						status={totalMembers > 0 ? "success" : "info"}
						className="flex w-fit cursor-pointer items-center gap-1 whitespace-nowrap"
						onClick={() => primaryGroup && setAttendanceOpen(true)}
					>
						<CalendarCheckIcon className="size-3" />
						{t("launchclub.events.attendanceCount", {
							count: totalMembers,
						})}
					</Badge>
				</TableCell>
				<TableCell className="text-muted-foreground max-w-xs truncate">
					{event.description ?? "—"}
				</TableCell>
				<TableCell className="text-right">
					<div className="flex justify-end gap-0.5">
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
				</TableCell>
			</TableRow>

			<EventDialog
				open={editOpen}
				onOpenChange={setEditOpen}
				event={{
					id: event.id,
					name: event.name,
					description: event.description,
					eventType: event.eventType,
					guestName: event.guestName,
					guestCompany: event.guestCompany,
					guestIndustry: event.guestIndustry,
					startsAt: event.startsAt,
					endsAt: event.endsAt,
					eventGroups: event.eventGroups,
				}}
				organizationId={organizationId}
			/>

			{primaryGroup && (
				<AttendanceDialog
					eventId={event.id}
					groupId={primaryGroup.id}
					open={attendanceOpen}
					onOpenChange={setAttendanceOpen}
				/>
			)}

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
						<AlertDialogCancel>{t("launchclub.events.form.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							{t("launchclub.events.confirmDelete.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

export function EventsTable({ events, organizationId }: EventsTableProps) {
	const t = useTranslations();
	return (
		<div className="rounded-xl border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{t("launchclub.events.table.event")}</TableHead>
						<TableHead>{t("launchclub.events.table.group")}</TableHead>
						<TableHead>{t("launchclub.events.table.date")}</TableHead>
						<TableHead>{t("launchclub.events.table.time")}</TableHead>
						<TableHead>{t("launchclub.events.table.attendance")}</TableHead>
						<TableHead>{t("launchclub.events.table.description")}</TableHead>
						<TableHead />
					</TableRow>
				</TableHeader>
				<TableBody>
					{events.map((event) => (
						<EventTableRow
							key={event.id}
							event={event}
							organizationId={organizationId}
						/>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
