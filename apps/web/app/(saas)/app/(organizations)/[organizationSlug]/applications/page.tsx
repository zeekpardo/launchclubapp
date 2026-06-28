import { getUserSiteIds } from "@repo/database";
import { ApplicationsList } from "@saas/applications/components/ApplicationsList";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("launchclub.applications.title") };
}

export default async function ApplicationsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const [t, org, session] = await Promise.all([
		getTranslations(),
		getActiveOrganization(organizationSlug),
		getSession(),
	]);

	if (!org || !session) return notFound();

	const currentMember = org.members.find((m) => m.userId === session.user.id);
	const isAdminOrOwner =
		!currentMember ||
		["admin", "owner"].includes(currentMember.role) ||
		session.user.role === "admin";
	if (!isAdminOrOwner) {
		const siteIds = await getUserSiteIds(session.user.id);
		if (siteIds.length === 0) return notFound();
	}

	return (
		<div>
			<PageHeader
				title={t("launchclub.applications.title")}
				subtitle={t("launchclub.applications.subtitle")}
			/>
			<ApplicationsList />
		</div>
	);
}
