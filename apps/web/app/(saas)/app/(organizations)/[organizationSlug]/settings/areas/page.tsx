import { AreasAndSites } from "@saas/areas/components/AreasAndSites";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("launchclub.areas.title") };
}

export default async function SettingsAreasPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const [org, session] = await Promise.all([
		getActiveOrganization(organizationSlug),
		getSession(),
	]);
	if (!org || !session) return notFound();
	const currentMember = org.members.find((m) => m.userId === session.user.id);
	if (currentMember?.role === "member") return notFound();
	return <AreasAndSites />;
}
