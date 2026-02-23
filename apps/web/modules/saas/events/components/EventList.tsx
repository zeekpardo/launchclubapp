"use client";

import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, PlusCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useEvents } from "../hooks/use-events";
import { EventCard } from "./EventCard";
import { EventDialog } from "./EventDialog";

interface EventListProps {
	groupId: string;
}

export function EventList({ groupId }: EventListProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";

	const { data: events, isLoading } = useEvents(groupId);

	const { data: groups } = useQuery(
		orpc.groups.list.queryOptions({
			input: { organizationId },
			enabled: !!organizationId,
		}),
	);

	const groupName = groups?.find((g) => g.id === groupId)?.name;

	const [dialogOpen, setDialogOpen] = useState(false);

	const handleNewEvent = () => {
		setDialogOpen(true);
	};

	const handleDialogOpenChange = (open: boolean) => {
		setDialogOpen(open);
	};

	if (isLoading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-24 w-full rounded-xl" />
				))}
			</div>
		);
	}

	return (
		<>
			<div className="mb-4">
				<Button
					variant="primary"
					onClick={handleNewEvent}
					className="gap-2"
				>
					<PlusCircleIcon className="size-4" />
					{t("launchclub.events.new")}
				</Button>
			</div>

			{events && events.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
					<CalendarIcon className="mb-3 size-10 opacity-40" />
					<p className="text-sm">No events yet. Create one to get started.</p>
				</div>
			) : (
				<div className="space-y-3">
					{events?.map((event) => (
						<EventCard
							key={event.id}
							event={event}
							groupName={groupName}
							organizationId={organizationId}
						/>
					))}
				</div>
			)}

			<EventDialog
				open={dialogOpen}
				onOpenChange={handleDialogOpenChange}
				organizationId={organizationId}
				defaultGroupId={groupId}
			/>
		</>
	);
}
