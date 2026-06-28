import { GroupDetail } from "@saas/groups/components/GroupDetail";

export default async function GroupDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <GroupDetail groupId={id} />;
}
