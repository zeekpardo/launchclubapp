"use client";

import type { OrganizationMemberRole } from "@repo/auth";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@repo/ui/components/select";
import { cn } from "@repo/ui/lib";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

type LcRole = "site-leader" | "group-leader" | "member" | "admin" | "owner";
type LcAccessRole = "site-leader" | "group-leader";

// ── Site Picker ───────────────────────────────────────────────────────────────

function SitePicker({
	sites,
	selectedSiteIds,
	onToggle,
}: {
	sites: { id: string; name: string; area?: { id: string; name: string } | null }[];
	selectedSiteIds: string[];
	onToggle: (id: string) => void;
}) {
	const [filterAreaId, setFilterAreaId] = useState<string | null>(null);

	const areas = useMemo(() => {
		const map = new Map<string, string>();
		for (const s of sites) {
			if (s.area) map.set(s.area.id, s.area.name);
		}
		return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
	}, [sites]);

	const visible = filterAreaId
		? sites.filter((s) => s.area?.id === filterAreaId)
		: sites;

	return (
		<div className="space-y-3">
			{areas.length > 1 && (
				<div className="flex flex-wrap gap-1.5">
					{areas.map((a) => (
						<button
							key={a.id}
							type="button"
							onClick={() => setFilterAreaId(filterAreaId === a.id ? null : a.id)}
							className={cn(
								"rounded-full border px-3 py-0.5 text-xs font-medium transition-colors",
								filterAreaId === a.id
									? "border-primary bg-primary/10 text-primary"
									: "hover:bg-muted/50",
							)}
						>
							{a.name}
						</button>
					))}
				</div>
			)}
			<div className="grid gap-2 sm:grid-cols-2">
				{visible.map((site) => (
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
		</div>
	);
}

// ── Group Picker ──────────────────────────────────────────────────────────────

function GroupPicker({
	groups,
	selectedGroupIds,
	onToggle,
}: {
	groups: {
		id: string;
		name: string;
		siteId: string;
		site?: { id: string; name: string; area?: { id: string; name: string } | null } | null;
	}[];
	selectedGroupIds: string[];
	onToggle: (id: string) => void;
}) {
	const [filterAreaId, setFilterAreaId] = useState<string | null>(null);
	const [filterSiteId, setFilterSiteId] = useState<string | null>(null);

	const areas = useMemo(() => {
		const map = new Map<string, string>();
		for (const g of groups) {
			if (g.site?.area) map.set(g.site.area.id, g.site.area.name);
		}
		return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
	}, [groups]);

	const visibleSites = useMemo(() => {
		const map = new Map<string, string>();
		for (const g of groups) {
			if (!g.site) continue;
			if (filterAreaId && g.site.area?.id !== filterAreaId) continue;
			map.set(g.site.id, g.site.name);
		}
		return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
	}, [groups, filterAreaId]);

	const visible = groups.filter((g) => {
		if (filterAreaId && g.site?.area?.id !== filterAreaId) return false;
		if (filterSiteId && g.siteId !== filterSiteId) return false;
		return true;
	});

	const bySite = useMemo(() => {
		const map = new Map<string, { siteName: string; items: typeof visible }>();
		for (const g of visible) {
			if (!map.has(g.siteId)) {
				map.set(g.siteId, { siteName: g.site?.name ?? "Unknown", items: [] });
			}
			map.get(g.siteId)!.items.push(g);
		}
		return Array.from(map.values());
	}, [visible]);

	return (
		<div className="space-y-3">
			{areas.length > 1 && (
				<div className="flex flex-wrap gap-1.5">
					{areas.map((a) => (
						<button
							key={a.id}
							type="button"
							onClick={() => {
								setFilterAreaId(filterAreaId === a.id ? null : a.id);
								setFilterSiteId(null);
							}}
							className={cn(
								"rounded-full border px-3 py-0.5 text-xs font-medium transition-colors",
								filterAreaId === a.id
									? "border-primary bg-primary/10 text-primary"
									: "hover:bg-muted/50",
							)}
						>
							{a.name}
						</button>
					))}
				</div>
			)}
			{visibleSites.length > 1 && (
				<div className="flex flex-wrap gap-1.5">
					{visibleSites.map((s) => (
						<button
							key={s.id}
							type="button"
							onClick={() => setFilterSiteId(filterSiteId === s.id ? null : s.id)}
							className={cn(
								"rounded-full border px-3 py-0.5 text-xs font-medium transition-colors",
								filterSiteId === s.id
									? "border-primary bg-primary/10 text-primary"
									: "hover:bg-muted/50",
							)}
						>
							{s.name}
						</button>
					))}
				</div>
			)}
			<div className="space-y-4">
				{bySite.map(({ siteName, items }) => (
					<div key={siteName}>
						<p className="mb-1.5 font-medium text-foreground/70 text-xs uppercase tracking-wide">
							{siteName}
						</p>
						<div className="grid gap-2 sm:grid-cols-2">
							{items.map((g) => (
								<label
									key={g.id}
									className={cn(
										"flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
										selectedGroupIds.includes(g.id)
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50",
									)}
								>
									<input
										type="checkbox"
										className="accent-primary"
										checked={selectedGroupIds.includes(g.id)}
										onChange={() => onToggle(g.id)}
									/>
									<span className="text-sm">{g.name}</span>
								</label>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

// ── Main Component ────────────────────────────────────────────────────────────

export function MemberRoleEditor({
	memberId,
	organizationId,
	currentRole,
	disabled,
	onSuccess,
}: {
	memberId: string;
	organizationId: string;
	currentRole: OrganizationMemberRole;
	disabled?: boolean;
	onSuccess?: () => void;
}) {
	const queryClient = useQueryClient();
	const isMember = currentRole === "member";
	const isOwner = currentRole === "owner";

	// Load current LC role + assignments from server (members only)
	const { data: memberRoleData } = useQuery(
		orpc.organizations.getMemberRole.queryOptions({
			input: { organizationId, memberId },
			enabled: isMember,
		}),
	);

	// Resolved access role — from server data (after load) or local state (after save)
	const [localAccessRole, setLocalAccessRole] = useState<LcAccessRole | null>(null);
	const [localSiteIds, setLocalSiteIds] = useState<string[]>([]);
	const [localGroupIds, setLocalGroupIds] = useState<string[]>([]);
	const [hydrated, setHydrated] = useState(false);

	// Sync server data into local state once on load
	useEffect(() => {
		if (!memberRoleData || hydrated) return;
		if (memberRoleData.lcRole === "site-leader" || memberRoleData.lcRole === "group-leader") {
			setLocalAccessRole(memberRoleData.lcRole);
			setLocalSiteIds(memberRoleData.sites.map((s) => s.id));
			setLocalGroupIds(memberRoleData.groups.map((g) => g.id));
		}
		setHydrated(true);
	}, [memberRoleData, hydrated]);

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogAccessRole, setDialogAccessRole] = useState<LcAccessRole | null>(null);
	const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
	const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	// Fetch both when dialog opens so switching role type is instant
	const { data: sites = [] } = useQuery(
		orpc.organizations.listSites.queryOptions({
			input: { organizationId },
			enabled: dialogOpen,
		}),
	);

	const { data: groups = [] } = useQuery(
		orpc.organizations.listGroups.queryOptions({
			input: { organizationId },
			enabled: dialogOpen,
		}),
	);

	const updateRole = useMutation(
		orpc.organizations.updateMemberRole.mutationOptions(),
	);

	// ── Dropdown 1: role (owner / admin / member) ─────────────────────────────

	function handleRoleChange(val: string) {
		if (val === "admin") {
			updateRole.mutate(
				{ organizationId, memberId, lcRole: "admin", siteIds: [], groupIds: [] },
				{
					onSuccess: () => {
						queryClient.invalidateQueries(
							orpc.organizations.getMemberRole.queryOptions({ input: { organizationId, memberId } }),
						);
						onSuccess?.();
					},
				},
			);
		} else if (val === "member") {
			updateRole.mutate(
				{ organizationId, memberId, lcRole: "member", siteIds: [], groupIds: [] },
				{
					onSuccess: () => {
						setLocalAccessRole(null);
						setLocalSiteIds([]);
						setLocalGroupIds([]);
						setHydrated(false);
						queryClient.invalidateQueries(
							orpc.organizations.getMemberRole.queryOptions({ input: { organizationId, memberId } }),
						);
						onSuccess?.();
					},
				},
			);
		}
	}

	// ── Open dialog helpers ───────────────────────────────────────────────────

	function openSetAccessDialog(lcRole: LcAccessRole) {
		setDialogAccessRole(lcRole);
		setSelectedSiteIds(lcRole === localAccessRole ? localSiteIds : []);
		setSelectedGroupIds(lcRole === localAccessRole ? localGroupIds : []);
		setError(null);
		setDialogOpen(true);
	}

	function openEditDialog() {
		if (!localAccessRole) return;
		setDialogAccessRole(localAccessRole);
		setSelectedSiteIds(localSiteIds);
		setSelectedGroupIds(localGroupIds);
		setError(null);
		setDialogOpen(true);
	}

	// Switch role type inside the open dialog
	function switchDialogRole(role: LcAccessRole) {
		if (role === dialogAccessRole) return;
		setDialogAccessRole(role);
		// Pre-populate if switching back to the already-saved role
		setSelectedSiteIds(role === localAccessRole ? localSiteIds : []);
		setSelectedGroupIds(role === localAccessRole ? localGroupIds : []);
		setError(null);
	}

	// ── Dialog confirm ────────────────────────────────────────────────────────

	function handleConfirm() {
		if (!dialogAccessRole) return;
		if (dialogAccessRole === "site-leader" && selectedSiteIds.length === 0) {
			setError("Select at least one site.");
			return;
		}
		if (dialogAccessRole === "group-leader" && selectedGroupIds.length === 0) {
			setError("Select at least one group.");
			return;
		}

		updateRole.mutate(
			{
				organizationId,
				memberId,
				lcRole: dialogAccessRole,
				siteIds: selectedSiteIds,
				groupIds: selectedGroupIds,
			},
			{
				onSuccess: () => {
					setLocalAccessRole(dialogAccessRole);
					setLocalSiteIds(selectedSiteIds);
					setLocalGroupIds(selectedGroupIds);
					setDialogOpen(false);
					queryClient.invalidateQueries(
						orpc.organizations.getMemberRole.queryOptions({ input: { organizationId, memberId } }),
					);
					onSuccess?.();
				},
				onError: () => setError("Failed to update permissions. Please try again."),
			},
		);
	}

	// ── Remove access ─────────────────────────────────────────────────────────

	function handleRemoveAccess() {
		updateRole.mutate(
			{ organizationId, memberId, lcRole: "member", siteIds: [], groupIds: [] },
			{
				onSuccess: () => {
					setLocalAccessRole(null);
					setLocalSiteIds([]);
					setLocalGroupIds([]);
					setHydrated(false);
					setDialogOpen(false);
					queryClient.invalidateQueries(
						orpc.organizations.getMemberRole.queryOptions({ input: { organizationId, memberId } }),
					);
					onSuccess?.();
				},
				onError: () => setError("Failed to remove access. Please try again."),
			},
		);
	}

	return (
		<>
			<div className="flex items-center gap-2">
				{/* Dropdown 1 — Role */}
				<Select
					value={currentRole}
					onValueChange={handleRoleChange}
					disabled={disabled || isOwner || updateRole.isPending}
				>
					<SelectTrigger className="w-[110px]">
						<span>
							{isOwner ? "Owner" : currentRole === "admin" ? "Admin" : "Member"}
						</span>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="admin">Admin</SelectItem>
						<SelectItem value="member">Member</SelectItem>
					</SelectContent>
				</Select>

				{/* Access section — members only */}
				{isMember && !disabled && (
					localAccessRole ? (
						// Already has an access role — show edit button
						<Button
							variant="outline"
							size="sm"
							className="h-9 gap-2 font-normal"
							onClick={openEditDialog}
							disabled={updateRole.isPending}
						>
							<span>
								{localAccessRole === "site-leader" ? "Site Leader" : "Group Leader"}
							</span>
							<span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary leading-none">
								{localAccessRole === "site-leader" ? localSiteIds.length : localGroupIds.length}
							</span>
							<PencilIcon className="size-3 text-muted-foreground" />
						</Button>
					) : (
						// No access role yet — show set access dropdown
						<Select
							value=""
							onValueChange={(v) => openSetAccessDialog(v as LcAccessRole)}
							disabled={updateRole.isPending}
						>
							<SelectTrigger className="w-[160px]">
								<span className="text-muted-foreground">Set access…</span>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="site-leader">
									<div className="flex flex-col">
										<span>Site Leader</span>
										<span className="text-muted-foreground text-xs">
											Access to assigned sites
										</span>
									</div>
								</SelectItem>
								<SelectItem value="group-leader">
									<div className="flex flex-col">
										<span>Group Leader</span>
										<span className="text-muted-foreground text-xs">
											Access to assigned groups
										</span>
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					)
				)}
			</div>

			{/* Permissions dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Manage Permissions</DialogTitle>
						<DialogDescription>
							Set the access level and assign specific{" "}
							{dialogAccessRole === "site-leader" ? "sites" : "groups"} for this member.
						</DialogDescription>
					</DialogHeader>

					{/* Role type switcher */}
					<div className="flex rounded-lg border p-1 gap-1">
						<button
							type="button"
							onClick={() => switchDialogRole("site-leader")}
							className={cn(
								"flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
								dialogAccessRole === "site-leader"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							Site Leader
						</button>
						<button
							type="button"
							onClick={() => switchDialogRole("group-leader")}
							className={cn(
								"flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
								dialogAccessRole === "group-leader"
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							Group Leader
						</button>
					</div>

					<div className="py-1">
						{dialogAccessRole === "site-leader" && (
							<SitePicker
								sites={sites}
								selectedSiteIds={selectedSiteIds}
								onToggle={(id) =>
									setSelectedSiteIds((prev) =>
										prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
									)
								}
							/>
						)}
						{dialogAccessRole === "group-leader" && (
							<GroupPicker
								groups={groups}
								selectedGroupIds={selectedGroupIds}
								onToggle={(id) =>
									setSelectedGroupIds((prev) =>
										prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
									)
								}
							/>
						)}
						{error && <p className="mt-2 text-destructive text-xs">{error}</p>}
					</div>

					<DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center">
						{localAccessRole && (
							<Button
								variant="ghost"
								className="mr-auto text-destructive hover:text-destructive hover:bg-destructive/10"
								onClick={handleRemoveAccess}
								disabled={updateRole.isPending}
							>
								Remove access
							</Button>
						)}
						<Button
							variant="outline"
							onClick={() => setDialogOpen(false)}
							disabled={updateRole.isPending}
						>
							Cancel
						</Button>
						<Button onClick={handleConfirm} loading={updateRole.isPending}>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
