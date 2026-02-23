import { redirect } from "next/navigation";

export default async function SitesRedirectPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	redirect(`/app/${organizationSlug}/settings/sites`);
}
