import { ApplicationsList } from "@saas/applications/components/ApplicationsList";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

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
	if (currentMember?.role === "member") return notFound();

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
