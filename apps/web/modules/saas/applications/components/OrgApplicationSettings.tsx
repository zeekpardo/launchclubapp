"use client";

import { Button } from "@repo/ui/components/button";
import { Switch } from "@repo/ui/components/switch";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	useOrgApplicationSettings,
	useUpdateOrgApplicationSettings,
} from "@saas/applications/hooks/use-application-settings";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function OrgApplicationSettings() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const { data: orgSettings, isLoading } = useOrgApplicationSettings();
	const updateOrgSettings = useUpdateOrgApplicationSettings();

	const [autoMigrate, setAutoMigrate] = useState(false);
	const [emailNotifications, setEmailNotifications] = useState(false);

	useEffect(() => {
		if (orgSettings) {
			setAutoMigrate(orgSettings.autoMigrate);
			setEmailNotifications(orgSettings.emailNotifications);
		}
	}, [orgSettings]);

	async function handleSave() {
		if (!activeOrganization?.id) return;
		try {
			await updateOrgSettings.mutateAsync({
				organizationId: activeOrganization.id,
				autoMigrate,
				emailNotifications,
			});
			toastSuccess(t("launchclub.applications.settings.notifications.saved"));
		} catch {
			toastError(t("launchclub.applications.settings.notifications.error"));
		}
	}

	if (isLoading) {
		return <div className="text-sm text-muted-foreground">{t("launchclub.applications.settings.loading")}</div>;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-medium">{t("launchclub.applications.settings.autoMigrate")}</p>
					<p className="text-xs text-muted-foreground mt-0.5">{t("launchclub.applications.settings.autoMigrateDesc")}</p>
				</div>
				<Switch checked={autoMigrate} onCheckedChange={setAutoMigrate} />
			</div>

			<div className="flex items-center justify-between opacity-50">
				<div>
					<div className="flex items-center gap-2">
						<p className="text-sm font-medium">{t("launchclub.applications.settings.emailNotifications")}</p>
						<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Coming soon</span>
					</div>
					<p className="text-xs text-muted-foreground mt-0.5">{t("launchclub.applications.settings.emailNotificationsDesc")}</p>
				</div>
				<Switch
					checked={false}
					disabled
				/>
			</div>

			<div className="flex justify-end pt-2 border-t">
				<Button
					variant="primary"
					onClick={handleSave}
					loading={updateOrgSettings.isPending}
				>{t("launchclub.applications.settings.save")}</Button>
			</div>
		</div>
	);
}
