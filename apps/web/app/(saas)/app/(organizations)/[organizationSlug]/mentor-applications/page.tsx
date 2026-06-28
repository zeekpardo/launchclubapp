import { getUserSiteIds } from "@repo/database";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { MentorApplicationsList } from "@saas/mentor-applications/components/MentorApplicationsList";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound } from "next/navigation";

export default async function MentorApplicationsPage({
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
	const isAdminOrOwner =
		!currentMember ||
		["admin", "owner"].includes(currentMember.role) ||
		session.user.role === "admin";
	if (!isAdminOrOwner) {
		const siteIds = await getUserSiteIds(session.user.id);
		if (siteIds.length === 0) return notFound();
	}

	return (
		<>
			<PageHeader
				title="Mentor Applications"
				subtitle="Review and manage mentor applications for your organization."
			/>
			<MentorApplicationsList />
		</>
	);
}
