import { getActiveOrganization } from "@saas/auth/lib/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NewPersonClient } from "./NewPersonClient";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("launchclub.people.new") };
}

export default async function NewPersonPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const _t = await getTranslations();
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		redirect("/app");
	}

	return <NewPersonClient organizationId={organization.id} />;
}
