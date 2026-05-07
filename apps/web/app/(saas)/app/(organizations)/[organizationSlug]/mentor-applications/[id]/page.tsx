import { MentorApplicationDetail } from "@saas/mentor-applications/components/MentorApplicationDetail";

export default async function MentorApplicationDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <MentorApplicationDetail applicationId={id} />;
}
