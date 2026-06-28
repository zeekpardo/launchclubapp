"use client";

import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
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

	const [dialogOpen, setDialogOpen] = useState(false);

	if (isLoading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 3 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
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
					onClick={() => setDialogOpen(true)}
					className="gap-2"
				>
					<PlusCircleIcon className="size-4" />
					{t("launchclub.events.new")}
				</Button>
			</div>

			{events && events.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
					<CalendarIcon className="mb-3 size-10 opacity-40" />
					<p className="text-sm">
						No events yet. Create one to get started.
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{events?.map((event) => (
						<EventCard
							key={event.id}
							event={event}
							organizationId={organizationId}
						/>
					))}
				</div>
			)}

			<EventDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				organizationId={organizationId}
				defaultGroupId={groupId}
			/>
		</>
	);
}
