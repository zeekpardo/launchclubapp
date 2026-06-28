import { getUserGroupIds, getUserSiteIds } from "@repo/database";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { PeopleTable } from "@saas/people/components/PeopleTable";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("launchclub.people.title") };
}

export default async function PeoplePage({
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
		// Site leaders (UserSite) and group leaders (UserGroup) can both view
		// People, scoped to their assignments. Only block members with neither.
		const [siteIds, groupIds] = await Promise.all([
			getUserSiteIds(session.user.id),
			getUserGroupIds(session.user.id),
		]);
		if (siteIds.length === 0 && groupIds.length === 0) return notFound();
	}

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
