import { getUserIsOrgOwner } from "@repo/database";
import { getSession } from "@saas/auth/lib/server";
import { DeleteAccountForm } from "@saas/settings/components/DeleteAccountForm";
import { SettingsList } from "@saas/shared/components/SettingsList";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("settings.account.title"),
	};
}

export default async function AccountSettingsPage() {
	const session = await getSession();

	if (!session) {
		redirect("/auth/login");
	}

	const isGlobalAdmin = session.user.role === "admin";
	const isOrgOwner =
		isGlobalAdmin || (await getUserIsOrgOwner(session.user.id));
	if (!isOrgOwner) return notFound();

	return (
		<SettingsList>
			<DeleteAccountForm />
		</SettingsList>
	);
}
