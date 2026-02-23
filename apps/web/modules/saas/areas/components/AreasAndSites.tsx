"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useDeleteArea, useAreas } from "@saas/areas/hooks/use-areas";
import { AreaDialog } from "@saas/areas/components/AreaDialog";
import { SiteDialog } from "@saas/sites/components/SiteDialog";
import { GroupDialog } from "@saas/groups/components/GroupDialog";
import { useDeleteGroup, useGroups } from "@saas/groups/hooks/use-groups";
import { SiteApplicationSettingsDialog } from "@saas/applications/components/SiteApplicationSettingsDialog";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useDeleteSite, useSites } from "@saas/sites/hooks/use-sites";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AreaRow } from "./AreaRow";

interface EditingArea {
	id: string;
	name: string;
	description?: string | null;
}

interface EditingSite {
	id: string;
	name: string;
	slug: string;
	areaId: string;
	address?: string | null;
	city?: string | null;
	state?: string | null;
	zipCode?: string | null;
	phone?: string | null;
	email?: string | null;
}

interface AppSettingsSite {
	id: string;
	name: string;
	slug: string;
	acceptApplications: boolean;
	applicationDeadline?: string | null;
}

interface EditingGroup {
	id: string;
	name: string;
	siteId: string;
	description?: string | null;
	gradeLevel?: string | null;
	meetingDay?: string | null;
	meetingTime?: string | null;
	meetingRecurrence?: string | null;
}

export function AreasAndSites() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";

	const { data: areas, isLoading: areasLoading } = useAreas();
	const { data: sites, isLoading: sitesLoading } = useSites();
	const { data: groups, isLoading: groupsLoading } = useGroups();
	const deleteArea = useDeleteArea();
	const deleteSite = useDeleteSite();
	const deleteGroup = useDeleteGroup();

	const [areaDialog, setAreaDialog] = useState<{ open: boolean; area?: EditingArea }>({ open: false });
	const [siteDialog, setSiteDialog] = useState<{ open: boolean; site?: EditingSite; defaultAreaId?: string }>({ open: false });
	const [groupDialog, setGroupDialog] = useState<{ open: boolean; group?: EditingGroup; defaultSiteId?: string }>({ open: false });
	const [appSettingsDialog, setAppSettingsDialog] = useState<{ open: boolean; site?: AppSettingsSite }>({ open: false });

	const [deleteAreaId, setDeleteAreaId] = useState<string | undefined>();
	const [deleteSiteId, setDeleteSiteId] = useState<string | undefined>();
	const [deleteGroupId, setDeleteGroupId] = useState<string | undefined>();

	async function handleDeleteArea() {
		if (!deleteAreaId) return;
		try {
			await deleteArea.mutateAsync({ id: deleteAreaId });
			toastSuccess(t("launchclub.areas.form.notifications.deleted"));
		} catch {
			toastError(t("launchclub.areas.form.notifications.error"));
		} finally {
			setDeleteAreaId(undefined);
		}
	}

	async function handleDeleteSite() {
		if (!deleteSiteId) return;
		try {
			await deleteSite.mutateAsync({ id: deleteSiteId });
			toastSuccess(t("launchclub.sites.form.notifications.deleted"));
		} catch {
			toastError(t("launchclub.sites.form.notifications.error"));
		} finally {
			setDeleteSiteId(undefined);
		}
	}

	async function handleDeleteGroup() {
		if (!deleteGroupId) return;
		try {
			await deleteGroup.mutateAsync({ id: deleteGroupId });
			toastSuccess(t("launchclub.groups.form.notifications.deleted"));
		} catch {
			toastError(t("launchclub.groups.form.notifications.error"));
		} finally {
			setDeleteGroupId(undefined);
		}
	}

	if (areasLoading || sitesLoading || groupsLoading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 2 }).map((_, i) => (
					<Skeleton key={i} className="h-24 w-full rounded-xl" />
				))}
			</div>
		);
	}

	return (
		<>
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-lg font-semibold">{t("launchclub.areas.pageTitle")}</h2>
				<Button
					variant="primary"
					size="sm"
					onClick={() => setAreaDialog({ open: true })}
					className="gap-1.5"
				>
					<PlusIcon className="size-4" />
					{t("launchclub.areas.addArea")}
				</Button>
			</div>

			{(!areas || areas.length === 0) && (
				<p className="text-sm text-muted-foreground">
					{t("launchclub.areas.empty")}
				</p>
			)}

			<div className="space-y-3">
				{areas?.map((area) => (
					<AreaRow
						key={area.id}
						area={area}
						sites={sites?.filter((s) => s.areaId === area.id) ?? []}
						groups={groups ?? []}
						onEditArea={(a) => setAreaDialog({ open: true, area: { id: a.id, name: a.name, description: a.description } })}
						onAddSite={(areaId) => setSiteDialog({ open: true, defaultAreaId: areaId })}
						onEditSite={(s) => setSiteDialog({ open: true, site: s })}
						onAddGroup={(siteId) => setGroupDialog({ open: true, defaultSiteId: siteId })}
						onEditGroup={(g) => setGroupDialog({
							open: true,
							group: {
								id: g.id,
								name: g.name,
								siteId: g.siteId,
								description: g.description,
								gradeLevel: g.gradeLevel,
								meetingDay: g.meetingDay,
								meetingTime: g.meetingTime,
								meetingRecurrence: g.meetingRecurrence,
							},
						})}
						onAppSettings={(s) => setAppSettingsDialog({
							open: true,
							site: {
								id: s.id,
								name: s.name,
								slug: s.slug,
								acceptApplications: s.acceptApplications ?? true,
								applicationDeadline: s.applicationDeadline ? String(s.applicationDeadline) : null,
							},
						})}
					/>
				))}
			</div>

			{/* Dialogs */}
			<AreaDialog
				open={areaDialog.open}
				onOpenChange={(open) => setAreaDialog((p) => ({ ...p, open }))}
				area={areaDialog.area}
				organizationId={organizationId}
				onDelete={areaDialog.area ? () => setDeleteAreaId(areaDialog.area!.id) : undefined}
			/>

			<SiteDialog
				open={siteDialog.open}
				onOpenChange={(open) => setSiteDialog((p) => ({ ...p, open }))}
				site={siteDialog.site}
				defaultAreaId={siteDialog.defaultAreaId}
				organizationId={organizationId}
				onDelete={siteDialog.site ? () => setDeleteSiteId(siteDialog.site!.id) : undefined}
			/>

			<GroupDialog
				open={groupDialog.open}
				onOpenChange={(open) => setGroupDialog((p) => ({ ...p, open }))}
				group={groupDialog.group}
				defaultSiteId={groupDialog.defaultSiteId}
				organizationId={organizationId}
				onDelete={groupDialog.group ? () => setDeleteGroupId(groupDialog.group!.id) : undefined}
			/>

			{appSettingsDialog.site && (
				<SiteApplicationSettingsDialog
					open={appSettingsDialog.open}
					onOpenChange={(open) => setAppSettingsDialog((p) => ({ ...p, open }))}
					site={appSettingsDialog.site}
				/>
			)}

			{/* Delete confirmations */}
			<AlertDialog open={!!deleteAreaId} onOpenChange={(open) => !open && setDeleteAreaId(undefined)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("launchclub.areas.confirmDelete.title")}</AlertDialogTitle>
						<AlertDialogDescription>{t("launchclub.areas.confirmDelete.message")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("launchclub.areas.form.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteArea}>{t("launchclub.areas.confirmDelete.confirm")}</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={!!deleteSiteId} onOpenChange={(open) => !open && setDeleteSiteId(undefined)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("launchclub.sites.confirmDelete.title")}</AlertDialogTitle>
						<AlertDialogDescription>{t("launchclub.sites.confirmDelete.message")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("launchclub.areas.form.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteSite}>{t("launchclub.sites.confirmDelete.confirm")}</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={!!deleteGroupId} onOpenChange={(open) => !open && setDeleteGroupId(undefined)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("launchclub.groups.confirmDelete.title")}</AlertDialogTitle>
						<AlertDialogDescription>{t("launchclub.groups.confirmDelete.message")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("launchclub.areas.form.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteGroup}>{t("launchclub.groups.confirmDelete.confirm")}</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
