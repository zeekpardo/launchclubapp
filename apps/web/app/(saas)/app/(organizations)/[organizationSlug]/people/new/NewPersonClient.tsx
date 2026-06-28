"use client";

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
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { PersonForm } from "@saas/people/components/PersonForm";
import { useRouter } from "@shared/hooks/router";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, HomeIcon, PlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

interface NewPersonClientProps {
	organizationId: string;
}

type HouseholdMode =
	| { type: "none" }
	| { type: "existing"; id: string; name: string }
	| { type: "new"; name: string };

export function NewPersonClient({ organizationId }: NewPersonClientProps) {
	const t = useTranslations();
	const router = useRouter();
	const params = useParams<{ organizationSlug: string }>();
	const { activeOrganization } = useActiveOrganization();
	const basePath = `/app/${params.organizationSlug}/people`;

	const [household, setHousehold] = useState<HouseholdMode>({ type: "none" });
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [newHouseholdName, setNewHouseholdName] = useState("");
	const [assignDialogOpen, setAssignDialogOpen] = useState(false);
	const [selectedAssignId, setSelectedAssignId] = useState("");

	const createHousehold = useMutation(
		orpc.households.create.mutationOptions(),
	);

	const { data: allHouseholds } = useQuery(
		orpc.households.list.queryOptions({
			input: { organizationId: activeOrganization?.id ?? "" },
			enabled: !!activeOrganization?.id && assignDialogOpen,
		}),
	);

	const getHouseholdId = useCallback(async (): Promise<
		string | undefined
	> => {
		if (household.type === "existing") return household.id;
		if (household.type === "new") {
			const created = await createHousehold.mutateAsync({
				organizationId,
				name: household.name,
			});
			return created.id;
		}
		return undefined;
	}, [household, createHousehold, organizationId]);

	const handleConfirmCreate = () => {
		if (!newHouseholdName.trim()) return;
		setHousehold({ type: "new", name: newHouseholdName.trim() });
		setCreateDialogOpen(false);
		setNewHouseholdName("");
	};

	const handleAssignConfirm = () => {
		if (!selectedAssignId) return;
		const found = allHouseholds?.find((h) => h.id === selectedAssignId);
		setHousehold({
			type: "existing",
			id: selectedAssignId,
			name: found?.name ?? t("launchclub.households.cardTitle"),
		});
		setAssignDialogOpen(false);
		setSelectedAssignId("");
	};

	const handleSuccess = (personId?: string) => {
		if (personId) router.push(`${basePath}/${personId}`);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button asChild variant="ghost" size="icon">
					<Link href={basePath}>
						<ArrowLeftIcon className="size-4" />
					</Link>
				</Button>
				<h1 className="text-3xl font-bold text-foreground">
					{t("launchclub.people.new")}
				</h1>
			</div>

			{/* 3-col grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main form — col-span-2 */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>
							{t("launchclub.people.personDetails")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<PersonForm
							organizationId={organizationId}
							onSuccess={handleSuccess}
							backHref={basePath}
							getHouseholdId={getHouseholdId}
						/>
					</CardContent>
				</Card>

				{/* Right sidebar */}
				<div className="lg:col-span-1 space-y-6">
					{/* Groups placeholder */}
					<Card>
						<CardHeader className="pb-3">
							<CardTitle className="text-base">
								{t("launchclub.people.groups")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								{t(
									"launchclub.people.groupsAvailableAfterSaving",
								)}
							</p>
						</CardContent>
					</Card>

					{/* Household card */}
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-3">
							<CardTitle className="flex items-center gap-2 text-base">
								<HomeIcon className="size-4" />
								{t("launchclub.households.cardTitle")}
							</CardTitle>
							{household.type !== "none" && (
								<Button
									size="icon"
									variant="ghost"
									className="size-7"
									type="button"
									onClick={() =>
										setHousehold({ type: "none" })
									}
								>
									<XIcon className="size-3.5" />
								</Button>
							)}
						</CardHeader>
						<CardContent className="space-y-3">
							{household.type !== "none" ? (
								<div className="rounded-lg border p-3 space-y-1">
									<p className="font-medium text-sm">
										{household.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{household.type === "new"
											? t(
													"launchclub.households.willBeCreated",
												)
											: t(
													"launchclub.households.willBeAssigned",
												)}
									</p>
								</div>
							) : (
								<div className="flex flex-col gap-2">
									<Button
										size="sm"
										variant="outline"
										className="w-full"
										type="button"
										onClick={() =>
											setCreateDialogOpen(true)
										}
									>
										<PlusIcon className="mr-2 size-3.5" />
										{t("launchclub.households.createNew")}
									</Button>
									<Button
										size="sm"
										variant="ghost"
										className="w-full"
										type="button"
										onClick={() =>
											setAssignDialogOpen(true)
										}
									>
										{t(
											"launchclub.households.assignToExisting",
										)}
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Create household dialog — collects name only, no API call yet */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("launchclub.households.new")}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="new-household-name">
							{t("launchclub.households.form.householdName")}
						</Label>
						<Input
							id="new-household-name"
							value={newHouseholdName}
							onChange={(e) =>
								setNewHouseholdName(e.target.value)
							}
							onKeyDown={(e) =>
								e.key === "Enter" && handleConfirmCreate()
							}
							placeholder={t(
								"launchclub.households.form.namePlaceholder",
							)}
							autoFocus
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setCreateDialogOpen(false);
								setNewHouseholdName("");
							}}
						>
							{t("launchclub.households.assignDialog.cancel")}
						</Button>
						<Button
							onClick={handleConfirmCreate}
							disabled={!newHouseholdName.trim()}
						>
							{t("launchclub.households.form.confirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Assign to existing dialog */}
			<Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("launchclub.households.assignDialog.title")}
						</DialogTitle>
					</DialogHeader>
					<Select
						value={selectedAssignId}
						onValueChange={setSelectedAssignId}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={t(
									"launchclub.households.assignDialog.selectPlaceholder",
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							{allHouseholds?.map((h) => (
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
								setSelectedAssignId("");
							}}
						>
							{t("launchclub.households.assignDialog.cancel")}
						</Button>
						<Button
							onClick={handleAssignConfirm}
							disabled={!selectedAssignId}
						>
							{t("launchclub.households.assignDialog.assign")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
