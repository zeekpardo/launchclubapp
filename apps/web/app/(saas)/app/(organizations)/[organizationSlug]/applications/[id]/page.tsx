import { ApplicationDetail } from "@saas/applications/components/ApplicationDetail";

export default async function ApplicationDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <ApplicationDetail applicationId={id} />;
}
