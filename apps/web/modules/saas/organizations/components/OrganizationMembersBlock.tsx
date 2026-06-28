"use client";
import { Card } from "@repo/ui/components/card";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { OrganizationInvitationsList } from "./OrganizationInvitationsList";
import { OrganizationMembersList } from "./OrganizationMembersList";

export function OrganizationMembersBlock({
	organizationId,
}: {
	organizationId: string;
}) {
	const t = useTranslations();
	const [activeTab, setActiveTab] = useState<"members" | "invitations">(
		"members",
	);

	return (
		<Card className="p-4 md:p-6">
			<div className="flex flex-col gap-4">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<div className="flex flex-col gap-1.5">
						<h3 className="m-0 font-semibold leading-tight">
							{t("organizations.settings.members.title")}
						</h3>
						<p className="m-0 text-foreground/60 text-xs">
							{t("organizations.settings.members.description")}
						</p>
					</div>
					<div className="inline-flex rounded-lg border bg-muted p-1 self-start sm:self-auto">
						{(["members", "invitations"] as const).map((tab) => (
							<button
								key={tab}
								type="button"
								onClick={() => setActiveTab(tab)}
								className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
									activeTab === tab
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{tab === "members"
									? t(
											"organizations.settings.members.activeMembers",
										)
									: t(
											"organizations.settings.members.pendingInvitations",
										)}
							</button>
						))}
					</div>
				</div>

				{activeTab === "members" ? (
					<OrganizationMembersList organizationId={organizationId} />
				) : (
					<OrganizationInvitationsList
						organizationId={organizationId}
					/>
				)}
			</div>
		</Card>
	);
}
