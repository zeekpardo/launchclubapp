"use client";

import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@repo/ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ChevronDownIcon,
	HomeIcon,
	LogOutIcon,
	MailIcon,
	MapPinIcon,
	PencilIcon,
	PhoneIcon,
	PlusIcon,
	UserPlusIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useUpdatePerson } from "../hooks/use-people";
import { HouseholdDialog } from "./HouseholdDialog";

interface HouseholdPanelProps {
	personId: string;
	householdId?: string | null;
}

function getInitials(firstName: string, lastName: string) {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function HouseholdPanel({ personId, householdId }: HouseholdPanelProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const queryClient = useQueryClient();
	const updatePerson = useUpdatePerson();

	const [collapsed, setCollapsed] = useState(false);
	const [householdDialogOpen, setHouseholdDialogOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [assignDialogOpen, setAssignDialogOpen] = useState(false);
	const [addPersonDialogOpen, setAddPersonDialogOpen] = useState(false);
	const [selectedPersonId, setSelectedPersonId] = useState("");
	const [selectedHouseholdId, setSelectedHouseholdId] = useState("");

	const { data: household, isLoading } = useQuery({
		...orpc.households.get.queryOptions({ input: { id: householdId ?? "" } }),
		enabled: !!householdId,
	});

	const { data: allHouseholds } = useQuery(
		orpc.households.list.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
			enabled: !!activeOrganization?.id && assignDialogOpen,
		}),
	);

	const { data: allPeople } = useQuery(
		orpc.people.list.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
			enabled: !!activeOrganization?.id && addPersonDialogOpen,
		}),
	);

	const householdMemberIds = new Set(household?.people.map((p) => p.id) ?? []);
	const availablePeople = allPeople?.filter((p) => !householdMemberIds.has(p.id));
	const otherHouseholds = allHouseholds?.filter((h) => h.id !== householdId);

	const invalidateAll = () => {
		queryClient.invalidateQueries(
			orpc.people.get.queryOptions({ input: { id: personId, organizationId: activeOrganization?.id ?? "" } }),
		);
		if (householdId) {
			queryClient.invalidateQueries(
				orpc.households.get.queryOptions({ input: { id: householdId } }),
			);
		}
	};

	const handleAssign = async () => {
		if (!selectedHouseholdId) return;
		try {
			await updatePerson.mutateAsync({ id: personId, householdId: selectedHouseholdId });
			invalidateAll();
			toastSuccess(t("launchclub.households.notifications.assigned"));
			setAssignDialogOpen(false);
			setSelectedHouseholdId("");
		} catch {
			toastError(t("launchclub.households.notifications.assignError"));
		}
	};

	const handleLeave = async () => {
		try {
			await updatePerson.mutateAsync({ id: personId, householdId: null });
			invalidateAll();
			toastSuccess(t("launchclub.households.notifications.removed"));
		} catch {
			toastError(t("launchclub.households.notifications.removeError"));
		}
	};

	const handleAddPerson = async () => {
		if (!householdId || !selectedPersonId) return;
		try {
			await updatePerson.mutateAsync({ id: selectedPersonId, householdId });
			queryClient.invalidateQueries(
				orpc.households.get.queryOptions({ input: { id: householdId } }),
			);
			toastSuccess(t("launchclub.households.notifications.personAdded"));
			setAddPersonDialogOpen(false);
			setSelectedPersonId("");
		} catch {
			toastError(t("launchclub.households.notifications.personAddError"));
		}
	};

	const handleRemoveMember = async (memberId: string) => {
		try {
			await updatePerson.mutateAsync({ id: memberId, householdId: null });
			if (householdId) {
				queryClient.invalidateQueries(
					orpc.households.get.queryOptions({ input: { id: householdId } }),
				);
			}
			toastSuccess(t("launchclub.households.notifications.removed"));
		} catch {
			toastError(t("launchclub.households.notifications.removeError"));
		}
	};

	const handleHouseholdCreated = async (newHouseholdId: string) => {
		try {
			await updatePerson.mutateAsync({ id: personId, householdId: newHouseholdId });
			queryClient.invalidateQueries(
				orpc.people.get.queryOptions({ input: { id: personId, organizationId: activeOrganization?.id ?? "" } }),
			);
			queryClient.invalidateQueries(
				orpc.households.get.queryOptions({ input: { id: newHouseholdId } }),
			);
		} catch {
			toastError(t("launchclub.households.notifications.autoAssignError"));
		}
	};

	return (
		<>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-3">
					<CardTitle className="flex items-center gap-2 text-sm font-semibold">
						<HomeIcon className="size-4" />
						{t("launchclub.households.cardTitle")}
					</CardTitle>
					<div className="flex items-center gap-1">
						{household && !collapsed && (
							<Button
								size="icon"
								variant="ghost"
								className="size-7"
								onClick={() => {
									setIsCreating(false);
									setHouseholdDialogOpen(true);
								}}
							>
								<PencilIcon className="size-3.5" />
							</Button>
						)}
						<Button size="icon" variant="ghost" className="size-7" onClick={() => setCollapsed((c) => !c)}>
							<ChevronDownIcon className={`size-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
						</Button>
					</div>
				</CardHeader>

				{!collapsed && <CardContent className="space-y-4">
					{isLoading ? (
						<div className="space-y-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-48" />
						</div>
					) : !household ? (
						<div className="space-y-3">
							<p className="text-sm text-muted-foreground">
								{t("launchclub.households.notAssigned")}
							</p>
							<div className="flex flex-col gap-2">
								<Button
									size="sm"
									variant="outline"
									className="w-full"
									onClick={() => {
										setIsCreating(true);
										setHouseholdDialogOpen(true);
									}}
								>
									<PlusIcon className="mr-2 size-3.5" />
									{t("launchclub.households.createNew")}
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="w-full"
									onClick={() => setAssignDialogOpen(true)}
								>
									{t("launchclub.households.assignToExisting")}
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							{/* Household info */}
							<div className="space-y-1.5">
								<p className="font-medium text-sm">{household.name}</p>

								{(household.addressLine1 || household.city || household.stateProvince) && (
									<div className="flex items-start gap-1.5 text-xs text-muted-foreground">
										<MapPinIcon className="size-3.5 mt-0.5 shrink-0" />
										<div>
											{household.addressLine1 && <p>{household.addressLine1}</p>}
											{(household.city || household.stateProvince || household.postalCode) && (
												<p>
													{[household.city, household.stateProvince, household.postalCode]
														.filter(Boolean)
														.join(", ")}
												</p>
											)}
											{household.country && <p>{household.country}</p>}
										</div>
									</div>
								)}

								{household.phone && (
									<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
										<PhoneIcon className="size-3.5 shrink-0" />
										<span>{household.phone}</span>
									</div>
								)}

								{household.email && (
									<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
										<MailIcon className="size-3.5 shrink-0" />
										<span className="truncate">{household.email}</span>
									</div>
								)}
							</div>

							{/* Members */}
							<div className="space-y-1">
								<p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
									{t("launchclub.households.members")}
								</p>
								{household.people.map((member) => (
									<div
										key={member.id}
										className="flex items-center justify-between py-1"
									>
										<div className="flex items-center gap-2">
											<Avatar className="size-6">
												<AvatarFallback className="text-[10px]">
													{getInitials(member.firstName, member.lastName)}
												</AvatarFallback>
											</Avatar>
											<span className="text-sm">
												{member.firstName} {member.lastName}
											</span>
											{member.isChild && (
												<span className="text-[10px] text-muted-foreground">
													{t("launchclub.households.child")}
												</span>
											)}
										</div>
										{member.id !== personId && (
											<Button
												size="icon"
												variant="ghost"
												className="size-6 text-muted-foreground hover:text-destructive"
												onClick={() => handleRemoveMember(member.id)}
											>
												<XIcon className="size-3" />
											</Button>
										)}
									</div>
								))}

								<Button
									size="sm"
									variant="outline"
									className="mt-2 w-full"
									onClick={() => setAddPersonDialogOpen(true)}
								>
									<UserPlusIcon className="mr-2 size-3.5" />
									{t("launchclub.households.addPerson")}
								</Button>
							</div>

							{/* Leave */}
							<Button
								size="sm"
								variant="ghost"
								className="w-full text-muted-foreground"
								onClick={handleLeave}
							>
								<LogOutIcon className="mr-2 size-3.5" />
								{t("launchclub.households.removeFromHousehold")}
							</Button>
						</div>
					)}
				</CardContent>}
			</Card>

			{/* Create / Edit household */}
			<HouseholdDialog
				open={householdDialogOpen}
				onOpenChange={setHouseholdDialogOpen}
				household={isCreating ? undefined : household ?? undefined}
				onCreated={handleHouseholdCreated}
			/>

			{/* Assign to existing household */}
			<Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("launchclub.households.assignDialog.title")}</DialogTitle>
					</DialogHeader>
					<Select value={selectedHouseholdId} onValueChange={setSelectedHouseholdId}>
						<SelectTrigger>
							<SelectValue placeholder={t("launchclub.households.assignDialog.selectPlaceholder")} />
						</SelectTrigger>
						<SelectContent>
							{otherHouseholds?.map((h) => (
								<SelectItem key={h.id} value={h.id}>
									{h.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setAssignDialogOpen(false);
								setSelectedHouseholdId("");
							}}
						>
							{t("launchclub.households.assignDialog.cancel")}
						</Button>
						<Button
							onClick={handleAssign}
							disabled={!selectedHouseholdId || updatePerson.isPending}
						>
							{t("launchclub.households.assignDialog.assign")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Add existing person to household */}
			<Dialog open={addPersonDialogOpen} onOpenChange={setAddPersonDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("launchclub.households.addPersonDialog.title")}</DialogTitle>
					</DialogHeader>
					<Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
						<SelectTrigger>
							<SelectValue placeholder={t("launchclub.households.addPersonDialog.selectPlaceholder")} />
						</SelectTrigger>
						<SelectContent>
							{availablePeople?.map((p) => (
								<SelectItem key={p.id} value={p.id}>
									{p.firstName} {p.lastName}
									{p.isChild ? ` ${t("launchclub.households.addPersonDialog.childLabel")}` : ""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setAddPersonDialogOpen(false);
								setSelectedPersonId("");
							}}
						>
							{t("launchclub.households.addPersonDialog.cancel")}
						</Button>
						<Button
							onClick={handleAddPerson}
							disabled={!selectedPersonId || updatePerson.isPending}
						>
							{t("launchclub.households.addPersonDialog.add")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
