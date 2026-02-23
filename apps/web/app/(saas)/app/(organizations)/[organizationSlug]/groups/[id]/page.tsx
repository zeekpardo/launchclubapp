import { GroupDetail } from "@saas/groups/components/GroupDetail";
import { getTranslations } from "next-intl/server";

export default async function GroupDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <GroupDetail groupId={id} />;
}
