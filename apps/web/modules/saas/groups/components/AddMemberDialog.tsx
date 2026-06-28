"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@repo/ui/components/form";
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
import { cn } from "@repo/ui/lib";
import { useAddMember } from "@saas/groups/hooks/use-groups";
import { useCreatePerson } from "@saas/people/hooks/use-people";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BadgeCheckIcon, ShieldIcon, UserPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type TabMode = "existing" | "new-member" | "new-leader";
type InviteMode = "invite" | "add";

// ── Tab: Existing Person ──────────────────────────────────────────────────────

function ExistingPersonTab({
	groupId,
	organizationId,
	onSuccess,
}: {
	groupId: string;
	organizationId: string;
	onSuccess: () => void;
}) {
	const t = useTranslations();
	const addMember = useAddMember();
	const [personId, setPersonId] = useState("");
	const [role, setRole] = useState<"MEMBER" | "LEADER">("MEMBER");
	const [submitting, setSubmitting] = useState(false);

	const { data: people, isLoading } = useQuery(
		orpc.people.list.queryOptions({ input: { organizationId } }),
	);

	const handleSubmit = async () => {
		if (!personId) return;
		setSubmitting(true);
		try {
			await addMember.mutateAsync({ groupId, personId, role });
			toastSuccess(t("launchclub.groups.members.add"));
			onSuccess();
		} catch {
			toastError(t("launchclub.groups.form.notifications.error"));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<label className="font-medium text-sm">
					{t("launchclub.people.title")}
				</label>
				{isLoading ? (
					<Skeleton className="h-10 w-full" />
				) : (
					<Select value={personId} onValueChange={setPersonId}>
						<SelectTrigger>
							<SelectValue placeholder="Select a person…" />
						</SelectTrigger>
						<SelectContent>
							{(people ?? []).map((p) => (
								<SelectItem key={p.id} value={p.id}>
									{p.firstName} {p.lastName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</div>

			<div className="space-y-2">
				<label className="font-medium text-sm">Role</label>
				<Select
					value={role}
					onValueChange={(v) => setRole(v as "MEMBER" | "LEADER")}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="MEMBER">
							{t("launchclub.groups.members.role.MEMBER")}
						</SelectItem>
						<SelectItem value="LEADER">
							{t("launchclub.groups.members.role.LEADER")}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<DialogFooter>
				<Button
					onClick={handleSubmit}
					disabled={!personId || submitting}
					loading={submitting}
				>
					{t("launchclub.groups.members.add")}
				</Button>
			</DialogFooter>
		</div>
	);
}

// ── Tab: New Member (no system access) ───────────────────────────────────────

const newMemberSchema = z.object({
	firstName: z.string().min(1, "Required"),
	lastName: z.string().min(1, "Required"),
	email: z.string().email("Invalid email").optional().or(z.literal("")),
	phone: z.string().optional(),
});

type NewMemberValues = z.infer<typeof newMemberSchema>;

function NewMemberTab({
	groupId,
	organizationId,
	onSuccess,
}: {
	groupId: string;
	organizationId: string;
	onSuccess: () => void;
}) {
	const createPerson = useCreatePerson();
	const addMember = useAddMember();

	const form = useForm<NewMemberValues>({
		resolver: zodResolver(newMemberSchema),
		defaultValues: { firstName: "", lastName: "", email: "", phone: "" },
	});

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const person = await createPerson.mutateAsync({
				organizationId,
				firstName: values.firstName,
				lastName: values.lastName,
				email: values.email || undefined,
				phone: values.phone || undefined,
			});
			await addMember.mutateAsync({
				groupId,
				personId: person.id,
				role: "MEMBER",
			});
			toastSuccess(
				`${values.firstName} ${values.lastName} added to the group.`,
			);
			onSuccess();
		} catch {
			toastError("Failed to add member. Please try again.");
		}
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} className="space-y-4">
				<div className="flex gap-3">
					<FormField
						control={form.control}
						name="firstName"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel>First Name</FormLabel>
								<FormControl>
									<Input placeholder="Jane" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="lastName"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel>Last Name</FormLabel>
								<FormControl>
									<Input placeholder="Smith" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Email{" "}
								<span className="text-muted-foreground font-normal">
									(optional)
								</span>
							</FormLabel>
							<FormControl>
								<Input
									type="email"
									placeholder="jane@example.com"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="phone"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Phone{" "}
								<span className="text-muted-foreground font-normal">
									(optional)
								</span>
							</FormLabel>
							<FormControl>
								<Input
									type="tel"
									placeholder="555-000-0000"
									{...field}
								/>
							</FormControl>
						</FormItem>
					)}
				/>

				<p className="text-muted-foreground text-xs">
					Creates a people record and adds them to this group. No
					system login access is granted.
				</p>

				<DialogFooter>
					<Button type="submit" loading={form.formState.isSubmitting}>
						Add Member
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}

// ── Tab: New Leader (org access + Person record) ──────────────────────────────

const newLeaderSchema = z.object({
	firstName: z.string().min(1, "Required"),
	lastName: z.string().min(1, "Required"),
	email: z.string().email("Invalid email"),
});

type NewLeaderValues = z.infer<typeof newLeaderSchema>;

function NewLeaderTab({
	groupId,
	groupName,
	organizationId,
	onSuccess,
}: {
	groupId: string;
	groupName: string;
	organizationId: string;
	onSuccess: () => void;
}) {
	const [inviteMode, setInviteMode] = useState<InviteMode>("add");
	const createPerson = useCreatePerson();
	const addMember = useAddMember();
	const createMember = useMutation(
		orpc.organizations.createMember.mutationOptions(),
	);
	const saveAssignment = useMutation(
		orpc.organizations.saveInvitationAssignment.mutationOptions(),
	);

	const form = useForm<NewLeaderValues>({
		resolver: zodResolver(newLeaderSchema),
		defaultValues: { firstName: "", lastName: "", email: "" },
	});

	const onSubmit = form.handleSubmit(async (values) => {
		const fullName = `${values.firstName} ${values.lastName}`;

		try {
			if (inviteMode === "add") {
				// Add directly: create org member + person + group membership
				await createMember.mutateAsync({
					organizationId,
					name: fullName,
					email: values.email,
					lcRole: "group-leader",
					groupIds: [groupId],
				});
			} else {
				// Send invitation
				const { error, data } =
					await authClient.organization.inviteMember({
						email: values.email,
						role: "member",
						organizationId,
					});
				if (error) throw error;
				if (data?.id) {
					await saveAssignment.mutateAsync({
						organizationId,
						invitationId: data.id,
						lcRole: "group-leader",
						siteIds: [],
						groupIds: [groupId],
					});
				}
			}

			// Always create a Person record + add as LEADER in this group
			const person = await createPerson.mutateAsync({
				organizationId,
				firstName: values.firstName,
				lastName: values.lastName,
				email: values.email,
			});
			await addMember.mutateAsync({
				groupId,
				personId: person.id,
				role: "LEADER",
			});

			toastSuccess(
				inviteMode === "add"
					? `${fullName} added as group leader. They'll receive a magic link to sign in.`
					: `Invitation sent to ${values.email}. They've been added as group leader.`,
			);
			onSuccess();
		} catch (err: any) {
			const message =
				err?.message === "User is already a member of this organization"
					? "This person is already a member of this organization."
					: "Failed to add leader. Please try again.";
			toastError(message);
		}
	});

	return (
		<div className="space-y-5">
			{/* Group lock indicator */}
			<div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
				<ShieldIcon className="size-3.5 shrink-0 text-muted-foreground" />
				<span className="text-muted-foreground">
					Will be added as <strong>Group Leader</strong> in{" "}
					<strong>{groupName}</strong>
				</span>
			</div>

			{/* Invite mode toggle */}
			<div className="flex gap-1 rounded-lg border p-1 w-fit">
				<button
					type="button"
					onClick={() => setInviteMode("add")}
					className={cn(
						"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
						inviteMode === "add"
							? "bg-primary text-primary-foreground shadow-sm"
							: "text-foreground/70 hover:text-foreground",
					)}
				>
					Add Directly
				</button>
				<button
					type="button"
					onClick={() => setInviteMode("invite")}
					className={cn(
						"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
						inviteMode === "invite"
							? "bg-primary text-primary-foreground shadow-sm"
							: "text-foreground/70 hover:text-foreground",
					)}
				>
					Send Invitation
				</button>
			</div>

			<Form {...form}>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="flex gap-3">
						<FormField
							control={form.control}
							name="firstName"
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel>First Name</FormLabel>
									<FormControl>
										<Input placeholder="Jane" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="lastName"
							render={({ field }) => (
								<FormItem className="flex-1">
									<FormLabel>Last Name</FormLabel>
									<FormControl>
										<Input placeholder="Smith" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="jane@example.com"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<p className="text-muted-foreground text-xs">
						{inviteMode === "add"
							? "Creates an account immediately and sends a magic link to sign in."
							: "Sends an invitation email. They'll have group leader access once accepted."}
					</p>

					<DialogFooter>
						<Button
							type="submit"
							loading={form.formState.isSubmitting}
						>
							{inviteMode === "add"
								? "Add Leader"
								: "Send Invitation"}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</div>
	);
}

// ── Main Dialog ───────────────────────────────────────────────────────────────

interface AddMemberDialogProps {
	groupId: string;
	groupName: string;
	organizationId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

const TABS: { value: TabMode; label: string; icon: React.ElementType }[] = [
	{ value: "existing", label: "Existing Person", icon: UserPlusIcon },
	{ value: "new-member", label: "New Member", icon: UserPlusIcon },
	{ value: "new-leader", label: "New Leader", icon: BadgeCheckIcon },
];

export function AddMemberDialog({
	groupId,
	groupName,
	organizationId,
	open,
	onOpenChange,
	onSuccess,
}: AddMemberDialogProps) {
	const [tab, setTab] = useState<TabMode>("existing");

	const handleSuccess = () => {
		onOpenChange(false);
		onSuccess?.();
		setTab("existing");
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				onOpenChange(v);
				if (!v) setTab("existing");
			}}
		>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Add Member</DialogTitle>
				</DialogHeader>

				{/* Tab strip */}
				<div className="flex gap-1 rounded-lg border p-1">
					{TABS.map(({ value, label }) => (
						<button
							key={value}
							type="button"
							onClick={() => setTab(value)}
							className={cn(
								"flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
								tab === value
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-foreground/70 hover:text-foreground",
							)}
						>
							{label}
						</button>
					))}
				</div>

				{tab === "existing" && (
					<ExistingPersonTab
						groupId={groupId}
						organizationId={organizationId}
						onSuccess={handleSuccess}
					/>
				)}
				{tab === "new-member" && (
					<NewMemberTab
						groupId={groupId}
						organizationId={organizationId}
						onSuccess={handleSuccess}
					/>
				)}
				{tab === "new-leader" && (
					<NewLeaderTab
						groupId={groupId}
						groupName={groupName}
						organizationId={organizationId}
						onSuccess={handleSuccess}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
