"use client";

import { cn } from "@repo/ui";
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
import { ConsentItemsManager } from "./ConsentItemsManager";

export function OrgApplicationSettings() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const { data: orgSettings, isLoading } = useOrgApplicationSettings();
	const updateOrgSettings = useUpdateOrgApplicationSettings();

	const [autoMigrate, setAutoMigrate] = useState(false);
	const [emailNotifications, setEmailNotifications] = useState(false);
	const [studentIdMode, setStudentIdMode] = useState<"manual" | "auto">(
		"auto",
	);

	useEffect(() => {
		if (orgSettings) {
			setAutoMigrate(orgSettings.autoMigrate);
			setEmailNotifications(orgSettings.emailNotifications);
			if (orgSettings?.studentIdMode)
				setStudentIdMode(
					orgSettings.studentIdMode as "manual" | "auto",
				);
		}
	}, [orgSettings]);

	async function handleSave() {
		if (!activeOrganization?.id) return;
		try {
			await updateOrgSettings.mutateAsync({
				organizationId: activeOrganization.id,
				autoMigrate,
				emailNotifications,
				studentIdMode,
			});
			toastSuccess(
				t("launchclub.applications.settings.notifications.saved"),
			);
		} catch {
			toastError(
				t("launchclub.applications.settings.notifications.error"),
			);
		}
	}

	if (isLoading) {
		return (
			<div className="text-sm text-muted-foreground">
				{t("launchclub.applications.settings.loading")}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-medium">
						{t("launchclub.applications.settings.autoMigrate")}
					</p>
					<p className="text-xs text-muted-foreground mt-0.5">
						{t("launchclub.applications.settings.autoMigrateDesc")}
					</p>
				</div>
				<Switch
					checked={autoMigrate}
					onCheckedChange={setAutoMigrate}
				/>
			</div>

			<div className="flex items-center justify-between opacity-50">
				<div>
					<div className="flex items-center gap-2">
						<p className="text-sm font-medium">
							{t(
								"launchclub.applications.settings.emailNotifications",
							)}
						</p>
						<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
							Coming soon
						</span>
					</div>
					<p className="text-xs text-muted-foreground mt-0.5">
						{t(
							"launchclub.applications.settings.emailNotificationsDesc",
						)}
					</p>
				</div>
				<Switch checked={false} disabled />
			</div>

			<div className="rounded-lg border p-4 space-y-4">
				<p className="text-sm font-semibold">Student IDs</p>
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium">ID Generation</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							Automatically assign a unique 6-digit ID to each
							child
						</p>
					</div>
					<div className="flex rounded-md border overflow-hidden">
						<button
							type="button"
							onClick={() => setStudentIdMode("auto")}
							className={cn(
								"px-3 py-1 text-sm",
								studentIdMode === "auto"
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground",
							)}
						>
							Auto
						</button>
						<button
							type="button"
							onClick={() => setStudentIdMode("manual")}
							className={cn(
								"px-3 py-1 text-sm border-l",
								studentIdMode === "manual"
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground",
							)}
						>
							Manual
						</button>
					</div>
				</div>
			</div>

			{activeOrganization?.id && (
				<ConsentItemsManager organizationId={activeOrganization.id} />
			)}

			<div className="flex justify-end pt-2 border-t">
				<Button
					variant="primary"
					onClick={handleSave}
					loading={updateOrgSettings.isPending}
				>
					{t("launchclub.applications.settings.save")}
				</Button>
			</div>
		</div>
	);
}
