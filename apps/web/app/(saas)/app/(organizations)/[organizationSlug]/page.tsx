import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { DashboardClient } from "@saas/dashboard/components/DashboardClient";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	return {
		title: activeOrganization?.name,
	};
}

export default async function OrganizationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const [t, activeOrganization, session] = await Promise.all([
		getTranslations(),
		getActiveOrganization(organizationSlug as string),
		getSession(),
	]);

	if (!activeOrganization) {
		return notFound();
	}

	const currentMember = activeOrganization.members.find(
		(m) => m.userId === session?.user.id,
	);
	if (currentMember?.role === "member") {
		redirect(`/app/${organizationSlug}/groups`);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title={activeOrganization.name}
				subtitle={t("organizations.start.subtitle")}
			/>
			<DashboardClient />
		</div>
	);
}
