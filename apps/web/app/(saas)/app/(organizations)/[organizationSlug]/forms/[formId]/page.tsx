import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { FormBuilderPage } from "@saas/forms/components/FormBuilderPage";
import { notFound } from "next/navigation";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; formId: string }>;
}) {
	return { title: "Form Builder" };
}

export default async function FormBuilderRoute({
	params,
}: {
	params: Promise<{ organizationSlug: string; formId: string }>;
}) {
	const { organizationSlug, formId } = await params;
	const [org, session] = await Promise.all([
		getActiveOrganization(organizationSlug),
		getSession(),
	]);

	if (!org || !session) return notFound();

	const currentMember = org.members.find((m) => m.userId === session.user.id);
	if (currentMember?.role === "member") return notFound();

	return (
		<div className="space-y-6 pb-12">
			<FormBuilderPage formId={formId} />
		</div>
	);
}
