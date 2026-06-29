"use client";

import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	type GroupDetail,
	useChangeMemberGroup,
	useGroups,
	useRemoveMember,
} from "@saas/groups/hooks/use-groups";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQueryClient } from "@tanstack/react-query";
import {
	ArrowRightLeftIcon,
	DownloadIcon,
	MailIcon,
	PlusIcon,
	PrinterIcon,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AddMemberDialog } from "../AddMemberDialog";

interface GroupMembersTabProps {
	groupId: string;
	group: GroupDetail;
}

export function GroupMembersTab({ groupId, group }: GroupMembersTabProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const removeMember = useRemoveMember();
	const changeMemberGroup = useChangeMemberGroup();
	const { data: allGroups } = useGroups();

	const [memberSearch, setMemberSearch] = useState("");
	const [addMemberOpen, setAddMemberOpen] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [moveMember, setMoveMember] = useState<{
		personId: string;
		name: string;
	} | null>(null);
	const [moveTargetId, setMoveTargetId] = useState("");

	const moveTargetGroups = useMemo(
		() => (allGroups ?? []).filter((g) => g.id !== groupId),
		[allGroups, groupId],
	);

	const handleMoveMember = async () => {
		if (!moveMember || !moveTargetId) return;
		try {
			await changeMemberGroup.mutateAsync({
				personId: moveMember.personId,
				fromGroupId: groupId,
				toGroupId: moveTargetId,
			});
			await invalidateGroup();
			toastSuccess(`${moveMember.name} moved to the selected group.`);
			setMoveMember(null);
			setMoveTargetId("");
		} catch (err) {
			toastError(
				err instanceof Error
					? err.message
					: t("launchclub.groups.form.notifications.error"),
			);
		}
	};

	const invalidateGroup = () =>
		queryClient.invalidateQueries(
			orpc.groups.get.queryOptions({ input: { id: groupId } }),
		);

	const handleRemoveMember = async (personId: string) => {
		try {
			await removeMember.mutateAsync({ groupId, personId });
			setSelectedIds((prev) => {
				const next = new Set(prev);
				next.delete(personId);
				return next;
			});
			await invalidateGroup();
			toastSuccess(t("launchclub.groups.members.remove"));
		} catch {
			toastError(t("launchclub.groups.form.notifications.error"));
		}
	};

	const memberCount = group.personGroups.length;
	const organizationId = group.site?.area?.organizationId ?? "";

	const filteredMembers = useMemo(
		() =>
			group.personGroups.filter(({ person }) => {
				if (!memberSearch) return true;
				const fullName =
					`${person.firstName} ${person.lastName}`.toLowerCase();
				return fullName.includes(memberSearch.toLowerCase());
			}),
		[group.personGroups, memberSearch],
	);

	// ── Selection helpers ──────────────────────────────────────────────────────

	const filteredIds = useMemo(
		() => filteredMembers.map(({ person }) => person.id),
		[filteredMembers],
	);

	const allSelected =
		filteredIds.length > 0 &&
		filteredIds.every((id) => selectedIds.has(id));
	const someSelected = filteredIds.some((id) => selectedIds.has(id));

	const toggleAll = () => {
		if (allSelected) {
			setSelectedIds((prev) => {
				const next = new Set(prev);
				for (const id of filteredIds) next.delete(id);
				return next;
			});
		} else {
			setSelectedIds((prev) => new Set([...prev, ...filteredIds]));
		}
	};

	const toggleOne = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	// ── Effective selection: all filtered, or all if nothing selected ──────────

	const activeMembers = useMemo(
		() =>
			selectedIds.size > 0
				? filteredMembers.filter(({ person }) =>
						selectedIds.has(person.id),
					)
				: filteredMembers,
		[filteredMembers, selectedIds],
	);

	// ── Email action ───────────────────────────────────────────────────────────

	const handleEmail = () => {
		const emailSet = new Set<string>();

		for (const { person } of activeMembers) {
			if (person.personType === "STUDENT") {
				// Email guardians/parents instead
				for (const guardian of person.guardians ?? []) {
					if (guardian.person?.email) {
						emailSet.add(guardian.person.email);
					}
				}
			} else if (person.email) {
				emailSet.add(person.email);
			}
		}

		if (emailSet.size === 0) {
			toastError("No email addresses found for the selected members.");
			return;
		}

		const subject = encodeURIComponent(`${group.name} – Update`);
		const bcc = encodeURIComponent(Array.from(emailSet).join(","));
		window.open(`mailto:?subject=${subject}&bcc=${bcc}`, "_blank");
	};

	// ── CSV download ───────────────────────────────────────────────────────────

	const handleDownload = () => {
		const headers = [
			"First Name",
			"Last Name",
			"Role",
			"Email",
			"Phone",
			"Is Child",
			"Guardian Emails",
			"Member Since",
		];

		const rows = activeMembers.map(({ person, role, joinedAt }) => {
			const guardianEmails = (person.guardians ?? [])
				.map((g) => g.person?.email)
				.filter(Boolean)
				.join("; ");

			return [
				person.firstName,
				person.lastName,
				role,
				person.email ?? "",
				person.phone ?? "",
				person.personType,
				guardianEmails,
				new Date(joinedAt).toLocaleDateString(),
			];
		});

		const csvContent = [headers, ...rows]
			.map((row) =>
				row
					.map(
						(cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`,
					)
					.join(","),
			)
			.join("\n");

		const blob = new Blob([csvContent], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${group.name.replace(/\s+/g, "_")}_members.csv`;
		link.click();
		URL.revokeObjectURL(url);

		toastSuccess(
			`Downloaded ${activeMembers.length} member${activeMembers.length === 1 ? "" : "s"}.`,
		);
	};

	// ── Render ─────────────────────────────────────────────────────────────────

	return (
		<div className="space-y-4">
			<div className="max-w-md">
				<Input
					placeholder={t(
						"launchclub.groups.members.searchPlaceholder",
					)}
					value={memberSearch}
					onChange={(e) => setMemberSearch(e.target.value)}
				/>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-lg font-medium">
						{memberCount} {t("launchclub.groups.tabs.members")}
					</span>
					{selectedIds.size > 0 && (
						<span className="text-sm text-muted-foreground">
							({selectedIds.size} selected)
						</span>
					)}
					<Button
						variant="ghost"
						size="icon"
						onClick={handleEmail}
						title={
							selectedIds.size > 0
								? "Email selected members (parents for children)"
								: "Email all members (parents for children)"
						}
					>
						<MailIcon className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" title="Print">
						<PrinterIcon className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={handleDownload}
						title={
							selectedIds.size > 0
								? "Download selected as CSV"
								: "Download all as CSV"
						}
					>
						<DownloadIcon className="h-4 w-4" />
					</Button>
				</div>
				<Button onClick={() => setAddMemberOpen(true)}>
					<PlusIcon className="mr-2 h-4 w-4" />
					{t("launchclub.groups.members.add")}
				</Button>
			</div>

			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12">
								<Checkbox
									checked={
										allSelected
											? true
											: someSelected
												? "indeterminate"
												: false
									}
									onCheckedChange={toggleAll}
									aria-label="Select all"
								/>
							</TableHead>
							<TableHead className="w-12" />
							<TableHead>
								{t(
									"launchclub.groups.members.columns.firstName",
								)}
							</TableHead>
							<TableHead>
								{t(
									"launchclub.groups.members.columns.lastName",
								)}
							</TableHead>
							<TableHead>
								{t("launchclub.groups.members.columns.role")}
							</TableHead>
							<TableHead>
								{t("launchclub.groups.members.columns.email")}
							</TableHead>
							<TableHead>
								{t("launchclub.groups.members.columns.phone")}
							</TableHead>
							<TableHead>
								{t(
									"launchclub.groups.members.columns.memberSince",
								)}
							</TableHead>
							<TableHead className="w-12" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredMembers.map(({ person, role, joinedAt }) => {
							const initials =
								`${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();
							const isSelected = selectedIds.has(person.id);

							const guardianEmails = (person.guardians ?? [])
								.map((g) => g.person?.email)
								.filter(Boolean);

							return (
								<TableRow
									key={person.id}
									data-state={
										isSelected ? "selected" : undefined
									}
									className={
										isSelected ? "bg-muted/40" : undefined
									}
								>
									<TableCell>
										<Checkbox
											checked={isSelected}
											onCheckedChange={() =>
												toggleOne(person.id)
											}
											aria-label={`Select ${person.firstName} ${person.lastName}`}
										/>
									</TableCell>
									<TableCell>
										<Avatar className="h-8 w-8 rounded-full">
											<AvatarFallback className="rounded-full">
												{initials}
											</AvatarFallback>
										</Avatar>
									</TableCell>
									<TableCell className="cursor-pointer font-medium transition-colors hover:text-primary">
										{person.firstName}
									</TableCell>
									<TableCell className="cursor-pointer transition-colors hover:text-primary">
										{person.lastName}
									</TableCell>
									<TableCell>
										<span className="capitalize">
											{role.toLowerCase()}
										</span>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{person.personType === "STUDENT" &&
										guardianEmails.length > 0 ? (
											<span
												title={`Parent: ${guardianEmails.join(", ")}`}
											>
												{guardianEmails[0]}
												{guardianEmails.length > 1 && (
													<span className="ml-1 text-xs">
														+
														{guardianEmails.length -
															1}
													</span>
												)}
											</span>
										) : (
											(person.email ?? "-")
										)}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{person.phone ?? "-"}
									</TableCell>
									<TableCell className="text-muted-foreground">
										{new Date(
											joinedAt,
										).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<div className="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												title="Move to another group"
												onClick={() => {
													setMoveTargetId("");
													setMoveMember({
														personId: person.id,
														name: `${person.firstName} ${person.lastName}`,
													});
												}}
											>
												<ArrowRightLeftIcon className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive hover:text-destructive"
												onClick={() =>
													handleRemoveMember(
														person.id,
													)
												}
											>
												<XIcon className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
						{filteredMembers.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={9}
									className="py-12 text-center text-muted-foreground"
								>
									{t("launchclub.groups.members.noResults")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{organizationId && (
				<AddMemberDialog
					groupId={groupId}
					groupName={group.name}
					organizationId={organizationId}
					siteId={group.site?.id}
					existingMemberIds={group.personGroups.map(
						({ person }) => person.id,
					)}
					open={addMemberOpen}
					onOpenChange={setAddMemberOpen}
					onSuccess={invalidateGroup}
				/>
			)}

			<Dialog
				open={!!moveMember}
				onOpenChange={(open) => {
					if (!open) {
						setMoveMember(null);
						setMoveTargetId("");
					}
				}}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Move to another group</DialogTitle>
						<DialogDescription>
							Move {moveMember?.name} out of {group.name} and into
							the group you select. Their role is preserved.
						</DialogDescription>
					</DialogHeader>
					<div className="py-2">
						<Select
							value={moveTargetId}
							onValueChange={setMoveTargetId}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a group…" />
							</SelectTrigger>
							<SelectContent>
								{moveTargetGroups.length === 0 ? (
									<div className="px-3 py-2 text-muted-foreground text-sm">
										No other groups available.
									</div>
								) : (
									moveTargetGroups.map((g) => (
										<SelectItem key={g.id} value={g.id}>
											{g.site?.name
												? `${g.site.name} — ${g.name}`
												: g.name}
										</SelectItem>
									))
								)}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setMoveMember(null);
								setMoveTargetId("");
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleMoveMember}
							disabled={!moveTargetId}
							loading={changeMemberGroup.isPending}
						>
							Move
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
