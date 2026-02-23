"use client";

import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { PlusCircleIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAddGuardian, useRemoveGuardian } from "../hooks/use-guardians";

interface Guardian {
	person: {
		id: string;
		firstName: string;
		lastName: string;
	};
	relation?: string | null;
}

interface Kid {
	id: string;
	firstName: string;
	lastName: string;
	guardians: Guardian[];
}

interface GuardianManagerProps {
	kid: Kid;
}

function getInitials(firstName: string, lastName: string): string {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function GuardianManager({ kid }: GuardianManagerProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const addGuardian = useAddGuardian();
	const removeGuardian = useRemoveGuardian();

	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [selectedPersonId, setSelectedPersonId] = useState("");
	const [relation, setRelation] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { data: adults, isLoading: adultsLoading } = useQuery(
		orpc.people.list.queryOptions({
			input: {
				organizationId: activeOrganization?.id ?? "",
				isChild: false,
			},
		}),
	);

	const existingGuardianIds = new Set(kid.guardians.map((g) => g.person.id));
	const availableAdults = adults?.filter(
		(adult) => !existingGuardianIds.has(adult.id),
	);

	const handleRemove = async (personId: string) => {
		try {
			await removeGuardian.mutateAsync({ personId, kidId: kid.id });
			toastSuccess(t("launchclub.guardians.remove"));
		} catch {
			toastError(t("launchclub.people.form.notifications.error"));
		}
	};

	const handleAdd = async () => {
		if (!selectedPersonId) return;
		setIsSubmitting(true);
		try {
			await addGuardian.mutateAsync({
				personId: selectedPersonId,
				kidId: kid.id,
				relation: relation || undefined,
			});
			toastSuccess(t("launchclub.guardians.add"));
			setAddDialogOpen(false);
			setSelectedPersonId("");
			setRelation("");
		} catch {
			toastError(t("launchclub.people.form.notifications.error"));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				{kid.guardians.length === 0 && (
					<p className="text-sm text-muted-foreground">
						No guardians assigned.
					</p>
				)}
				{kid.guardians.map((guardian) => (
					<div
						key={guardian.person.id}
						className="flex items-center justify-between rounded-lg border p-3"
					>
						<div className="flex items-center gap-3">
							<Avatar className="size-8">
								<AvatarFallback className="text-xs">
									{getInitials(
										guardian.person.firstName,
										guardian.person.lastName,
									)}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="text-sm font-medium">
									{guardian.person.firstName}{" "}
									{guardian.person.lastName}
								</p>
								{guardian.relation && (
									<p className="text-xs text-muted-foreground">
										{guardian.relation}
									</p>
								)}
							</div>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => handleRemove(guardian.person.id)}
							aria-label={t("launchclub.guardians.remove")}
						>
							<TrashIcon className="size-4 text-destructive" />
						</Button>
					</div>
				))}
			</div>

			<Button
				variant="outline"
				onClick={() => setAddDialogOpen(true)}
				className="gap-2"
			>
				<PlusCircleIcon className="size-4" />
				{t("launchclub.guardians.add")}
			</Button>

			<Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("launchclub.guardians.add")}</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						<div className="space-y-2">
							<p className="text-sm font-medium leading-none">Person</p>
							{adultsLoading ? (
								<Skeleton className="h-10 w-full" />
							) : (
								<Select
									value={selectedPersonId}
									onValueChange={setSelectedPersonId}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{availableAdults?.map((adult) => (
											<SelectItem key={adult.id} value={adult.id}>
												{adult.firstName} {adult.lastName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium leading-none">
								{t("launchclub.guardians.relation")}
							</p>
							<Input
								value={relation}
								onChange={(e) => setRelation(e.target.value)}
								placeholder={t("launchclub.guardians.relationPlaceholder")}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setAddDialogOpen(false);
								setSelectedPersonId("");
								setRelation("");
							}}
						>
							{t("common.confirmation.cancel")}
						</Button>
						<Button
							onClick={handleAdd}
							disabled={!selectedPersonId}
							loading={isSubmitting}
						>
							{t("launchclub.guardians.add")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
