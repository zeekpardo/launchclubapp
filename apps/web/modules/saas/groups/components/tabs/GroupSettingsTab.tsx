"use client";

import type { GroupDetail } from "@saas/groups/hooks/use-groups";
import { GroupDangerZone } from "./GroupDangerZone";
import { GroupImageUpload } from "./GroupImageUpload";
import { GroupSettingsForm } from "./GroupSettingsForm";

interface GroupSettingsTabProps {
	groupId: string;
	group: GroupDetail;
}

export function GroupSettingsTab({ groupId, group }: GroupSettingsTabProps) {
	return (
		<div className="space-y-8">
			<GroupImageUpload
				groupId={groupId}
				name={group.name}
				image={group.image ?? null}
			/>
			<GroupSettingsForm groupId={groupId} group={group} />
			<GroupDangerZone groupId={groupId} />
		</div>
	);
}
