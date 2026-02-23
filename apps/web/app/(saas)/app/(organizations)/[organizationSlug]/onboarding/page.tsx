import { getActiveOrganization } from "@saas/auth/lib/server";
import { OnboardingWizard } from "@saas/onboarding/components/OnboardingWizard";
import { notFound } from "next/navigation";

export default async function OnboardingPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const org = await getActiveOrganization(organizationSlug);
	if (!org) return notFound();

	return (
		<div className="mx-auto max-w-xl py-12">
			<OnboardingWizard
				organizationId={org.id}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
