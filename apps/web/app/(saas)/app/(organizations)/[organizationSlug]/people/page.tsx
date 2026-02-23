import { PeopleTable } from "@saas/people/components/PeopleTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("launchclub.people.title") };
}

export default async function PeoplePage() {
	const t = await getTranslations();
	return (
		<div>
			<PageHeader
				title={t("launchclub.people.title")}
				subtitle={t("launchclub.people.subtitle")}
			/>
			<PeopleTable />
		</div>
	);
}
