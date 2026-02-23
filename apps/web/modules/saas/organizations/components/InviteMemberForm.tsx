"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { Button } from "@repo/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { cn } from "@repo/ui/lib";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { fullOrganizationQueryKey } from "@saas/organizations/lib/api";
import { Card } from "@repo/ui/components/card";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Mode = "invite" | "add";
type LcRole = "admin" | "site-leader" | "group-leader";

const LC_ROLES: { value: LcRole; label: string; description: string }[] = [
	{
		value: "admin",
		label: "Admin",
		description:
			"Full access to everything across the organization: people, groups, events, applications, and settings.",
	},
	{
		value: "site-leader",
		label: "Site Leader",
		description:
			"Access to all groups, people, and data within assigned sites. Can approve purchase requests and applications.",
	},
	{
		value: "group-leader",
		label: "Group Leader",
		description:
			"Access only to assigned groups. Can take attendance, manage events, submit purchase orders, and add resources.",
	},
];

// Shared site picker with area filter
function SitePicker({
	sites,
	selectedSiteIds,
	onToggle,
	error,
}: {
	sites: { id: string; name: string; area?: { id: string; name: string } | null }[];
	selectedSiteIds: string[];
	onToggle: (siteId: string) => void;
	error?: string;
}) {
	const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

	const areas = useMemo(() => {
		const map = new Map<string, string>();
		for (const site of sites) {
			if (site.area) map.set(site.area.id, site.area.name);
		}
		return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
	}, [sites]);

	const toggleArea = (areaId: string, sitesInArea: string[]) => {
		const isChecked = selectedAreaIds.includes(areaId);
		setSelectedAreaIds((prev) =>
			isChecked ? prev.filter((x) => x !== areaId) : [...prev, areaId],
		);
		// Deselect any sites in this area when unchecking
		if (isChecked) {
			for (const siteId of sitesInArea) {
				if (selectedSiteIds.includes(siteId)) onToggle(siteId);
			}
		}
	};

	const visibleSites =
		selectedAreaIds.length === 0
			? sites
			: sites.filter((s) => s.area && selectedAreaIds.includes(s.area.id));

	return (
		<div className="space-y-3">
			{/* Area filter */}
			{areas.length > 1 && (
				<div>
					<p className="mb-1.5 font-medium text-foreground/60 text-xs uppercase tracking-wide">
						Filter by Area
					</p>
					<div className="flex flex-wrap gap-2">
						{areas.map((area) => {
							const sitesInArea = sites
								.filter((s) => s.area?.id === area.id)
								.map((s) => s.id);
							const checked = selectedAreaIds.includes(area.id);
							return (
								<label
									key={area.id}
									className={cn(
										"flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
										checked
											? "border-primary bg-primary/10 text-primary"
											: "hover:bg-muted/50",
									)}
								>
									<input
										type="checkbox"
										className="sr-only"
										checked={checked}
										onChange={() => toggleArea(area.id, sitesInArea)}
									/>
									{area.name}
								</label>
							);
						})}
					</div>
				</div>
			)}

			{/* Site checkboxes */}
			<div className="grid gap-2 sm:grid-cols-2">
				{visibleSites.map((site) => (
					<label
						key={site.id}
						className={cn(
							"flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
							selectedSiteIds.includes(site.id)
								? "border-primary bg-primary/5"
								: "hover:bg-muted/50",
						)}
					>
						<input
							type="checkbox"
							className="mt-0.5 accent-primary"
							checked={selectedSiteIds.includes(site.id)}
							onChange={() => onToggle(site.id)}
						/>
						<div>
							<p className="font-medium text-sm">{site.name}</p>
							{site.area && (
								<p className="text-foreground/60 text-xs">{site.area.name}</p>
							)}
						</div>
					</label>
				))}
			</div>

			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	);
}

// Shared group picker with area + site filter
function GroupPicker({
	groups,
	selectedGroupIds,
	onToggle,
	error,
}: {
	groups: {
		id: string;
		name: string;
		siteId: string;
		site?: { id: string; name: string; area?: { id: string; name: string } | null } | null;
	}[];
	selectedGroupIds: string[];
	onToggle: (groupId: string) => void;
	error?: string;
}) {
	const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
	const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);

	const areas = useMemo(() => {
		const map = new Map<string, string>();
		for (const g of groups) {
			if (g.site?.area) map.set(g.site.area.id, g.site.area.name);
		}
		return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
	}, [groups]);

	const visibleSites = useMemo(() => {
		const map = new Map<string, { id: string; name: string; areaId: string }>();
		for (const g of groups) {
			if (!g.site) continue;
			if (selectedAreaIds.length > 0 && (!g.site.area || !selectedAreaIds.includes(g.site.area.id))) continue;
			if (!map.has(g.site.id)) {
				map.set(g.site.id, { id: g.site.id, name: g.site.name, areaId: g.site.area?.id ?? "" });
			}
		}
		return Array.from(map.values());
	}, [groups, selectedAreaIds]);

	const visibleGroups = useMemo(() => {
		return groups.filter((g) => {
			if (selectedAreaIds.length > 0 && (!g.site?.area || !selectedAreaIds.includes(g.site.area.id))) return false;
			if (selectedSiteIds.length > 0 && !selectedSiteIds.includes(g.siteId)) return false;
			return true;
		});
	}, [groups, selectedAreaIds, selectedSiteIds]);

	// Groups organised by site name for display
	const groupsBySite = useMemo(() => {
		const map = new Map<string, { siteName: string; groups: typeof visibleGroups }>();
		for (const g of visibleGroups) {
			const key = g.siteId;
			if (!map.has(key)) {
				map.set(key, { siteName: g.site?.name ?? "Unknown Site", groups: [] });
			}
			map.get(key)!.groups.push(g);
		}
		return Array.from(map.values());
	}, [visibleGroups]);

	const toggleArea = (areaId: string) => {
		const removing = selectedAreaIds.includes(areaId);
		const newAreaIds = removing
			? selectedAreaIds.filter((x) => x !== areaId)
			: [...selectedAreaIds, areaId];
		setSelectedAreaIds(newAreaIds);

		if (removing) {
			// Remove sites in this area from the site filter
			const sitesInArea = groups
				.filter((g) => g.site?.area?.id === areaId)
				.map((g) => g.siteId);
			setSelectedSiteIds((prev) => prev.filter((s) => !sitesInArea.includes(s)));
			// Deselect groups in this area
			for (const g of groups.filter((g) => g.site?.area?.id === areaId)) {
				if (selectedGroupIds.includes(g.id)) onToggle(g.id);
			}
		}
	};

	const toggleSite = (siteId: string) => {
		const removing = selectedSiteIds.includes(siteId);
		setSelectedSiteIds((prev) =>
			removing ? prev.filter((x) => x !== siteId) : [...prev, siteId],
		);
		if (removing) {
			// Deselect groups in this site
			for (const g of groups.filter((g) => g.siteId === siteId)) {
				if (selectedGroupIds.includes(g.id)) onToggle(g.id);
			}
		}
	};

	return (
		<div className="space-y-3">
			{/* Area filter */}
			{areas.length > 1 && (
				<div>
					<p className="mb-1.5 font-medium text-foreground/60 text-xs uppercase tracking-wide">
						Filter by Area
					</p>
					<div className="flex flex-wrap gap-2">
						{areas.map((area) => {
							const checked = selectedAreaIds.includes(area.id);
							return (
								<label
									key={area.id}
									className={cn(
										"flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
										checked
											? "border-primary bg-primary/10 text-primary"
											: "hover:bg-muted/50",
									)}
								>
									<input
										type="checkbox"
										className="sr-only"
										checked={checked}
										onChange={() => toggleArea(area.id)}
									/>
									{area.name}
								</label>
							);
						})}
					</div>
				</div>
			)}

			{/* Site filter */}
			{visibleSites.length > 1 && (
				<div>
					<p className="mb-1.5 font-medium text-foreground/60 text-xs uppercase tracking-wide">
						Filter by Site
					</p>
					<div className="flex flex-wrap gap-2">
						{visibleSites.map((site) => {
							const checked = selectedSiteIds.includes(site.id);
							return (
								<label
									key={site.id}
									className={cn(
										"flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
										checked
											? "border-primary bg-primary/10 text-primary"
											: "hover:bg-muted/50",
									)}
								>
									<input
										type="checkbox"
										className="sr-only"
										checked={checked}
										onChange={() => toggleSite(site.id)}
									/>
									{site.name}
								</label>
							);
						})}
					</div>
				</div>
			)}

			{/* Groups by site */}
			<div className="space-y-4">
				{groupsBySite.map(({ siteName, groups: siteGroups }) => (
					<div key={siteName}>
						<p className="mb-1.5 font-medium text-foreground/70 text-xs uppercase tracking-wide">
							{siteName}
						</p>
						<div className="grid gap-2 sm:grid-cols-2">
							{siteGroups.map((group) => (
								<label
									key={group.id}
									className={cn(
										"flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
										selectedGroupIds.includes(group.id)
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50",
									)}
								>
									<input
										type="checkbox"
										className="accent-primary"
										checked={selectedGroupIds.includes(group.id)}
										onChange={() => onToggle(group.id)}
									/>
									<span className="text-sm">{group.name}</span>
								</label>
							))}
						</div>
					</div>
				))}
			</div>

			{error && <p className="text-destructive text-xs">{error}</p>}
		</div>
	);
}

// --- Invite sub-form ---

const inviteSchema = z
	.object({
		email: z.string().email(),
		lcRole: z.enum(["admin", "site-leader", "group-leader"]),
		siteIds: z.array(z.string()),
		groupIds: z.array(z.string()),
	})
	.superRefine((d, ctx) => {
		if (d.lcRole === "site-leader" && d.siteIds.length === 0) {
			ctx.addIssue({ code: "custom", message: "Select at least one site", path: ["siteIds"] });
		}
		if (d.lcRole === "group-leader" && d.groupIds.length === 0) {
			ctx.addIssue({ code: "custom", message: "Select at least one group", path: ["groupIds"] });
		}
	});

function InviteForm({ organizationId }: { organizationId: string }) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const form = useForm({
		resolver: zodResolver(inviteSchema),
		defaultValues: {
			email: "",
			lcRole: "admin" as LcRole,
			siteIds: [] as string[],
			groupIds: [] as string[],
		},
	});

	const lcRole = form.watch("lcRole");
	const selectedSiteIds = form.watch("siteIds");
	const selectedGroupIds = form.watch("groupIds");

	const { data: sites = [] } = useQuery(
		orpc.organizations.listSites.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: groups } = useQuery(
		orpc.organizations.listGroups.queryOptions({
			input: { organizationId },
		}),
	);

	const saveAssignment = useMutation(
		orpc.organizations.saveInvitationAssignment.mutationOptions(),
	);

	const toggleId = (field: "siteIds" | "groupIds", id: string, current: string[]) => {
		form.setValue(
			field,
			current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
			{ shouldValidate: true },
		);
	};

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const orgRole = values.lcRole === "admin" ? "admin" : "member";

			const { error, data } = await authClient.organization.inviteMember({
				email: values.email,
				role: orgRole as "admin" | "member" | "owner",
				organizationId,
			});

			if (error) throw error;

			// Store site/group intent so it can be applied when the invite is accepted
			if (data?.id && values.lcRole !== "admin") {
				await saveAssignment.mutateAsync({
					organizationId,
					invitationId: data.id,
					lcRole: values.lcRole,
					siteIds: values.siteIds,
					groupIds: values.groupIds,
				});
			}

			form.reset();
			queryClient.invalidateQueries({
				queryKey: fullOrganizationQueryKey(organizationId),
			});
			toastSuccess(
				t("organizations.settings.members.inviteMember.notifications.success.title"),
			);
		} catch {
			toastError(
				t("organizations.settings.members.inviteMember.notifications.error.title"),
			);
		}
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} className="space-y-5">
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								{t("organizations.settings.members.inviteMember.email")}
							</FormLabel>
							<FormControl>
								<Input type="email" {...field} />
							</FormControl>
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="lcRole"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Role</FormLabel>
							<FormControl>
								<Select
									value={field.value}
									onValueChange={(val) => {
										field.onChange(val);
										form.setValue("siteIds", []);
										form.setValue("groupIds", []);
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{LC_ROLES.map((role) => (
											<SelectItem key={role.value} value={role.value}>
												{role.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
						</FormItem>
					)}
				/>

				{/* Site picker with area filter — Site Leader */}
				{lcRole === "site-leader" && (
					<FormField
						control={form.control}
						name="siteIds"
						render={() => (
							<FormItem>
								<FormLabel>Assign Sites</FormLabel>
								<SitePicker
									sites={sites}
									selectedSiteIds={selectedSiteIds}
									onToggle={(id) => toggleId("siteIds", id, selectedSiteIds)}
									error={
										form.formState.errors.siteIds
											? String(form.formState.errors.siteIds.message)
											: undefined
									}
								/>
							</FormItem>
						)}
					/>
				)}

				{/* Group picker with area + site filter — Group Leader */}
				{lcRole === "group-leader" && (
					<FormField
						control={form.control}
						name="groupIds"
						render={() => (
							<FormItem>
								<FormLabel>Assign Groups</FormLabel>
								<GroupPicker
									groups={groups ?? []}
									selectedGroupIds={selectedGroupIds}
									onToggle={(id) => toggleId("groupIds", id, selectedGroupIds)}
									error={
										form.formState.errors.groupIds
											? String(form.formState.errors.groupIds.message)
											: undefined
									}
								/>
							</FormItem>
						)}
					/>
				)}

				<div className="flex justify-end">
					<Button type="submit" loading={form.formState.isSubmitting}>
						{t("organizations.settings.members.inviteMember.submit")}
					</Button>
				</div>
			</form>
		</Form>
	);
}

// --- Add directly sub-form ---

const addSchema = z
	.object({
		name: z.string().min(1, "Name is required"),
		email: z.string().email(),
		lcRole: z.enum(["admin", "site-leader", "group-leader"]),
		siteIds: z.array(z.string()),
		groupIds: z.array(z.string()),
	})
	.superRefine((d, ctx) => {
		if (d.lcRole === "site-leader" && d.siteIds.length === 0) {
			ctx.addIssue({ code: "custom", message: "Select at least one site", path: ["siteIds"] });
		}
		if (d.lcRole === "group-leader" && d.groupIds.length === 0) {
			ctx.addIssue({ code: "custom", message: "Select at least one group", path: ["groupIds"] });
		}
	});

function DirectAddForm({ organizationId }: { organizationId: string }) {
	const queryClient = useQueryClient();

	const form = useForm({
		resolver: zodResolver(addSchema),
		defaultValues: {
			name: "",
			email: "",
			lcRole: "admin" as LcRole,
			siteIds: [] as string[],
			groupIds: [] as string[],
		},
	});

	const lcRole = form.watch("lcRole");
	const selectedSiteIds = form.watch("siteIds");
	const selectedGroupIds = form.watch("groupIds");

	const { data: sites = [] } = useQuery(
		orpc.organizations.listSites.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: groups } = useQuery(
		orpc.organizations.listGroups.queryOptions({
			input: { organizationId },
		}),
	);

	const createMember = useMutation(
		orpc.organizations.createMember.mutationOptions(),
	);

	const toggleId = (field: "siteIds" | "groupIds", id: string, current: string[]) => {
		form.setValue(
			field,
			current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
			{ shouldValidate: true },
		);
	};

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			await createMember.mutateAsync({ organizationId, ...values });
			form.reset();
			queryClient.invalidateQueries({
				queryKey: fullOrganizationQueryKey(organizationId),
			});
			toastSuccess("Member added. They will receive a magic link to sign in.");
		} catch (err: any) {
			const message =
				err?.message === "User is already a member of this organization"
					? "This user is already a member of this organization."
					: "Failed to add member. Please try again.";
			toastError(message);
		}
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit} className="space-y-5">
				{/* Name + Email */}
				<div className="flex flex-col gap-3 sm:flex-row">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel>Full Name</FormLabel>
								<FormControl>
									<Input type="text" placeholder="Jane Smith" {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem className="flex-1">
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input type="email" {...field} />
								</FormControl>
							</FormItem>
						)}
					/>
				</div>

				<FormField
					control={form.control}
					name="lcRole"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Role</FormLabel>
							<FormControl>
								<Select
									value={field.value}
									onValueChange={(val) => {
										field.onChange(val);
										form.setValue("siteIds", []);
										form.setValue("groupIds", []);
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{LC_ROLES.map((role) => (
											<SelectItem key={role.value} value={role.value}>
												{role.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
						</FormItem>
					)}
				/>

				{/* Site picker with area filter — Site Leader */}
				{lcRole === "site-leader" && (
					<FormField
						control={form.control}
						name="siteIds"
						render={() => (
							<FormItem>
								<FormLabel>Assign Sites</FormLabel>
								<SitePicker
									sites={sites}
									selectedSiteIds={selectedSiteIds}
									onToggle={(id) => toggleId("siteIds", id, selectedSiteIds)}
									error={
										form.formState.errors.siteIds
											? String(form.formState.errors.siteIds.message)
											: undefined
									}
								/>
							</FormItem>
						)}
					/>
				)}

				{/* Group picker with area + site filter — Group Leader */}
				{lcRole === "group-leader" && (
					<FormField
						control={form.control}
						name="groupIds"
						render={() => (
							<FormItem>
								<FormLabel>Assign Groups</FormLabel>
								<GroupPicker
									groups={groups ?? []}
									selectedGroupIds={selectedGroupIds}
									onToggle={(id) => toggleId("groupIds", id, selectedGroupIds)}
									error={
										form.formState.errors.groupIds
											? String(form.formState.errors.groupIds.message)
											: undefined
									}
								/>
							</FormItem>
						)}
					/>
				)}

				<p className="text-muted-foreground text-xs">
					The user is added immediately and sent a magic link to sign in.
				</p>

				<div className="flex justify-end">
					<Button type="submit" loading={form.formState.isSubmitting}>
						Add Member
					</Button>
				</div>
			</form>
		</Form>
	);
}

// --- Parent component with toggle ---

export function InviteMemberForm({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations();
	const [mode, setMode] = useState<Mode>("invite");

	return (
		<Card className="p-4 md:p-6">
			<div className="flex flex-col gap-4">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div className="flex flex-col gap-1.5">
						<h3 className="m-0 font-semibold leading-tight">
							{t("organizations.settings.members.inviteMember.title")}
						</h3>
						<p className="m-0 text-foreground/60 text-xs">
							{t("organizations.settings.members.inviteMember.description")}
						</p>
					</div>
					<div className="flex gap-1 rounded-lg border p-1 self-start sm:self-auto">
						<button
							type="button"
							onClick={() => setMode("invite")}
							className={cn(
								"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
								mode === "invite"
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-foreground/70 hover:text-foreground",
							)}
						>
							Send Invitation
						</button>
						<button
							type="button"
							onClick={() => setMode("add")}
							className={cn(
								"rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
								mode === "add"
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-foreground/70 hover:text-foreground",
							)}
						>
							Add Directly
						</button>
					</div>
				</div>

				{mode === "invite" ? (
					<InviteForm organizationId={organizationId} />
				) : (
					<DirectAddForm organizationId={organizationId} />
				)}
			</div>
		</Card>
	);
}
