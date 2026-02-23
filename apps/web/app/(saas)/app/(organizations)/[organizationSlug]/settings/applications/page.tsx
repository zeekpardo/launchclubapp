import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { OrgApplicationSettings } from "@saas/applications/components/OrgApplicationSettings";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("launchclub.applications.settings.title") };
}

export default async function SettingsApplicationsPage() {
	const t = await getTranslations();
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t("launchclub.applications.settings.title")}</CardTitle>
				</CardHeader>
				<CardContent>
					<OrgApplicationSettings />
				</CardContent>
			</Card>
		</div>
	);
}
