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
import { SiteDialog } from "@saas/sites/components/SiteDialog";
import { useDeleteSite, useSites } from "@saas/sites/hooks/use-sites";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
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

interface AreaSitesTabProps {
	areaId: string;
	organizationId: string;
}

export function AreaSitesTab({ areaId, organizationId }: AreaSitesTabProps) {
	const t = useTranslations();
	const { data: allSites, isLoading } = useSites(organizationId);
	const deleteSite = useDeleteSite();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingSite, setEditingSite] = useState<EditingSite | undefined>();
	const [deletingSiteId, setDeletingSiteId] = useState<string | undefined>();

	const sites = allSites?.filter((s) => s.areaId === areaId) ?? [];

	async function handleDelete() {
		if (!deletingSiteId) return;
		try {
			await deleteSite.mutateAsync({ id: deletingSiteId });
			toastSuccess(t("launchclub.sites.form.notifications.deleted"));
		} catch {
			toastError(t("launchclub.sites.form.notifications.error"));
		} finally {
			setDeletingSiteId(undefined);
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 2 }).map((_, i) => (
					<Skeleton key={i} className="h-20 w-full rounded-lg" />
				))}
			</div>
		);
	}

	return (
		<>
			<div className="mb-4 flex items-center justify-between">
				<h3 className="font-semibold">Sites</h3>
				<Button
					size="sm"
					onClick={() => {
						setEditingSite(undefined);
						setDialogOpen(true);
					}}
					className="gap-1.5"
				>
					<PlusIcon className="size-4" />
					Add Site
				</Button>
			</div>

			{sites.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No sites yet. Add one to get started.
				</p>
			) : (
				<div className="space-y-3">
					{sites.map((site) => (
						<Card key={site.id} className="relative p-4">
							<div className="absolute right-3 top-3 flex gap-1">
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									onClick={() => {
										setEditingSite({
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
										});
										setDialogOpen(true);
									}}
								>
									<PencilIcon className="size-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="size-7"
									onClick={() => setDeletingSiteId(site.id)}
								>
									<TrashIcon className="size-3.5 text-destructive" />
								</Button>
							</div>
							<div className="pr-16">
								<p className="font-semibold text-sm">
									{site.name}
								</p>
								<div className="mt-1.5 flex flex-wrap gap-2">
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
				</div>
			)}

			<SiteDialog
				open={dialogOpen}
				onOpenChange={(open) => {
					setDialogOpen(open);
					if (!open) setEditingSite(undefined);
				}}
				site={editingSite}
				defaultAreaId={areaId}
				organizationId={organizationId}
			/>

			<AlertDialog
				open={Boolean(deletingSiteId)}
				onOpenChange={(open) => !open && setDeletingSiteId(undefined)}
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
