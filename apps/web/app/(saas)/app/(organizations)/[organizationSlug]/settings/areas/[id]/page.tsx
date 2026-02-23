import { AreaDetailClient } from "@saas/areas/components/AreaDetailClient";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return { title: `Area — ${id}` };
}

export default async function AreaDetailPage({
	params,
}: {
	params: Promise<{ id: string; organizationSlug: string }>;
}) {
	const { id, organizationSlug } = await params;
	const [org, session] = await Promise.all([
		getActiveOrganization(organizationSlug),
		getSession(),
	]);
	if (!org || !session) return notFound();
	const currentMember = org.members.find((m) => m.userId === session.user.id);
	if (currentMember?.role === "member") return notFound();
	return <AreaDetailClient areaId={id} />;
}
