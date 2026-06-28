import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { AcademicYearsSettings } from "@saas/settings/components/AcademicYearsSettings";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	return { title: "Academic Years" };
}

export default async function AcademicYearsPage({
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
	return (
		<div className="space-y-6">
			<AcademicYearsSettings />
		</div>
	);
}
