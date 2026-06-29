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
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { EventDialog } from "@saas/events/components/EventDialog";
import type { GroupDetail } from "@saas/groups/hooks/use-groups";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CalendarClockIcon,
	CalendarIcon,
	PencilIcon,
	PlusIcon,
	TrashIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface GroupEventsTabProps {
	groupId: string;
	group: GroupDetail;
}

export function GroupEventsTab({ groupId, group }: GroupEventsTabProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";

	const [eventDialogOpen, setEventDialogOpen] = useState(false);
	const [editEvent, setEditEvent] = useState<{
		id: string;
		name: string;
		description?: string | null;
		startsAt: string | Date;
		endsAt?: string | Date | null;
		eventGroups?: { group: { id: string; name: string } }[];
	} | null>(null);
	const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

	const { data: events, isLoading: eventsLoading } = useQuery(
		orpc.events.list.queryOptions({ input: { groupId } }),
	);

	const deleteEvent = useMutation(orpc.events.delete.mutationOptions());

	const generateEvents = useMutation(
		orpc.events.createFromGroupSchedule.mutationOptions(),
	);

	const handleGenerateEvents = async () => {
		try {
			const res = await generateEvents.mutateAsync({ groupId });
			queryClient.invalidateQueries(
				orpc.events.list.queryOptions({ input: { groupId } }),
			);
			if (res.count === 0) {
				toastSuccess(
					`All ${res.skipped} scheduled event(s) already exist — nothing to add.`,
				);
			} else {
				toastSuccess(
					`Created ${res.count} event(s) from the meeting schedule${res.skipped ? ` (${res.skipped} already existed)` : ""}.`,
				);
			}
		} catch (err) {
			toastError(
				err instanceof Error
					? err.message
					: t("launchclub.groups.form.notifications.error"),
			);
		}
	};

	const handleDeleteEvent = async () => {
		if (!deleteEventId) return;
		try {
			await deleteEvent.mutateAsync({ id: deleteEventId });
			queryClient.invalidateQueries(
				orpc.events.list.queryOptions({ input: { groupId } }),
			);
			toastSuccess(t("launchclub.events.form.notifications.deleted"));
		} catch {
			toastError(t("launchclub.groups.form.notifications.error"));
		}
		setDeleteEventId(null);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">
					{t("launchclub.events.title")}
				</h2>
				<div className="flex items-center gap-2">
					{group.meetingDay && (
						<Button
							variant="outline"
							onClick={handleGenerateEvents}
							loading={generateEvents.isPending}
							title="Create attendance events from this group's meeting schedule"
						>
							<CalendarClockIcon className="mr-2 h-4 w-4" />
							Generate from schedule
						</Button>
					)}
					<Button onClick={() => setEventDialogOpen(true)}>
						<PlusIcon className="mr-2 h-4 w-4" />
						{t("launchclub.events.new")}
					</Button>
				</div>
			</div>

			{eventsLoading ? (
				<div className="space-y-2">
					{Array.from({ length: 3 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
						<Skeleton key={i} className="h-16 w-full" />
					))}
				</div>
			) : (
				<div className="space-y-2">
					{events?.map((event) => (
						<div
							key={event.id}
							className="flex items-center justify-between rounded-lg border p-4"
						>
							<div>
								<div className="flex items-center gap-2">
									<p className="font-medium">{event.name}</p>
									{event.description && (
										<Badge
											status="info"
											className="normal-case"
										>
											{event.description}
										</Badge>
									)}
								</div>
								<p className="mt-0.5 text-muted-foreground text-sm">
									{new Date(
										event.startsAt,
									).toLocaleDateString()}{" "}
									·{" "}
									{new Date(
										event.startsAt,
									).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
									{event.endsAt &&
										` - ${new Date(event.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
								</p>
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={() =>
										setEditEvent({
											id: event.id,
											name: event.name,
											description: event.description,
											startsAt: event.startsAt,
											endsAt: event.endsAt,
											eventGroups: event.eventGroups,
										})
									}
								>
									<PencilIcon className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-destructive hover:text-destructive"
									onClick={() => setDeleteEventId(event.id)}
								>
									<TrashIcon className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}
					{events?.length === 0 && (
						<div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
							<CalendarIcon className="size-8 opacity-40" />
							<p className="text-sm">
								{t("launchclub.events.empty")}
							</p>
						</div>
					)}
				</div>
			)}

			<EventDialog
				open={eventDialogOpen}
				onOpenChange={setEventDialogOpen}
				organizationId={organizationId}
				defaultGroupId={groupId}
			/>

			<EventDialog
				open={!!editEvent}
				onOpenChange={(open) => {
					if (!open) setEditEvent(null);
				}}
				organizationId={organizationId}
				event={editEvent ?? undefined}
			/>

			<AlertDialog
				open={!!deleteEventId}
				onOpenChange={(open) => {
					if (!open) setDeleteEventId(null);
				}}
			>
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
						<AlertDialogCancel>
							{t("launchclub.groups.form.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteEvent}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("launchclub.events.confirmDelete.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
