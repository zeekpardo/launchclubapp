import { redirect } from "next/navigation";

export default async function SettingsSitesRedirectPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/app/${organizationSlug}/settings/areas`);
}
