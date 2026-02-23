import { PurchaseRequestsApprovalPage } from "@saas/purchase-requests/components/PurchaseRequestsApprovalPage";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("launchclub.purchaseRequests.title") };
}

export default async function PurchaseRequestsPage({
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
				title={t("launchclub.purchaseRequests.title")}
				subtitle={t("launchclub.purchaseRequests.description")}
			/>
			<PurchaseRequestsApprovalPage />
		</div>
	);
}
