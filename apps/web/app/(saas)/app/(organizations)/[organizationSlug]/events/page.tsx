import { EventsPageClient } from "@saas/events/components/EventsPageClient";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("launchclub.events.title") };
}

export default async function EventsPage() {
	const t = await getTranslations();
	return (
		<div>
			<PageHeader
				title={t("launchclub.events.title")}
				subtitle={t("launchclub.events.subtitle")}
			/>
			<EventsPageClient />
		</div>
	);
}
