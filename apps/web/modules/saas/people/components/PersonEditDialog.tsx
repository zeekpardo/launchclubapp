"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useTranslations } from "next-intl";
import { usePerson } from "../hooks/use-people";
import { PersonForm } from "./PersonForm";

interface PersonEditDialogProps {
	personId: string;
	organizationId: string;
	onClose: () => void;
}

export function PersonEditDialog({ personId, organizationId, onClose }: PersonEditDialogProps) {
	const t = useTranslations();
	const { data: person, isLoading } = usePerson(personId);

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>{t("launchclub.people.edit")}</DialogTitle>
				</DialogHeader>
				{isLoading ? (
					<div className="space-y-4">
						<Skeleton className="h-9 w-full" />
						<Skeleton className="h-9 w-full" />
						<Skeleton className="h-9 w-full" />
					</div>
				) : person ? (
					<PersonForm
						person={person}
						organizationId={organizationId}
						onSuccess={onClose}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
