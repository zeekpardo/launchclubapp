import { GroupList } from "@saas/groups/components/GroupList";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("launchclub.groups.title") };
}

export default async function GroupsPage() {
	return <GroupList />;
}
