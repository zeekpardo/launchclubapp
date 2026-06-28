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
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { SiteDialog } from "@saas/sites/components/SiteDialog";
import { useDeleteSite, useSites } from "@saas/sites/hooks/use-sites";
import { PencilIcon, PlusCircleIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface EditingSite {
	id: string;
	name: string;
	slug: string;
	areaId: string;
	addressLine1?: string | null;
	city?: string | null;
	stateProvince?: string | null;
	postalCode?: string | null;
	country?: string | null;
	phone?: string | null;
	email?: string | null;
}

export function SiteList() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const { data: sites, isLoading } = useSites();
	const deleteSite = useDeleteSite();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingSite, setEditingSite] = useState<EditingSite | undefined>(
		undefined,
	);
	const [deletingSiteId, setDeletingSiteId] = useState<string | undefined>(
		undefined,
	);

	const organizationId = activeOrganization?.id ?? "";

	const handleEdit = (site: EditingSite) => {
		setEditingSite(site);
		setDialogOpen(true);
	};

	const handleNewSite = () => {
		setEditingSite(undefined);
		setDialogOpen(true);
	};

	const handleDialogOpenChange = (open: boolean) => {
		setDialogOpen(open);
		if (!open) {
			setEditingSite(undefined);
		}
	};

	const handleDelete = async () => {
		if (!deletingSiteId) return;
		try {
			await deleteSite.mutateAsync({ id: deletingSiteId });
			toastSuccess(t("launchclub.sites.form.notifications.deleted"));
		} catch {
			toastError(t("launchclub.sites.form.notifications.error"));
		} finally {
			setDeletingSiteId(undefined);
		}
	};

	if (isLoading) {
		return (
			<div className="@container">
				<div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-36 w-full rounded-xl" />
					))}
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="mb-4">
				<Button
					variant="primary"
					onClick={handleNewSite}
					className="gap-2"
				>
					<PlusCircleIcon className="size-4" />
					{t("launchclub.sites.new")}
				</Button>
			</div>

			<div className="@container">
				<div className="grid grid-cols-1 @lg:grid-cols-2 @2xl:grid-cols-3 gap-4">
					{sites?.map((site) => (
						<Card key={site.id} className="relative p-4">
							<div className="absolute top-3 right-3 flex gap-1">
								<Button
									variant="ghost"
									size="icon"
									onClick={() =>
										handleEdit({
											id: site.id,
											name: site.name,
											slug: site.slug,
											areaId: site.areaId,
											addressLine1: site.addressLine1,
											city: site.city,
											stateProvince: site.stateProvince,
											postalCode: site.postalCode,
											country: site.country,
											phone: site.phone,
											email: site.email,
										})
									}
									aria-label={t("launchclub.sites.edit")}
								>
									<PencilIcon className="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setDeletingSiteId(site.id)}
									aria-label={t("launchclub.sites.delete")}
								>
									<TrashIcon className="size-4 text-destructive" />
								</Button>
							</div>

							<div className="pr-16">
								<p className="font-bold text-base leading-tight">
									{site.name}
								</p>
								{site.area && (
									<p className="mt-0.5 text-xs text-muted-foreground">
										{site.area.name}
									</p>
								)}
								<div className="mt-2 flex flex-wrap gap-2">
									<Badge className="font-mono text-xs">
										{site.slug}
									</Badge>
									<Badge status="info">
										{t("launchclub.sites.groupsCount", {
											count: site._count?.groups ?? 0,
										})}
									</Badge>
								</div>
							</div>
						</Card>
					))}

					{sites?.length === 0 && (
						<p className="col-span-full text-muted-foreground text-sm">
							No sites yet. Create one to get started.
						</p>
					)}
				</div>
			</div>

			<SiteDialog
				open={dialogOpen}
				onOpenChange={handleDialogOpenChange}
				site={editingSite}
				organizationId={organizationId}
			/>

			<AlertDialog
				open={Boolean(deletingSiteId)}
				onOpenChange={(open) => {
					if (!open) setDeletingSiteId(undefined);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("launchclub.sites.confirmDelete.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("launchclub.sites.confirmDelete.message")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							{t("launchclub.sites.confirmDelete.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
