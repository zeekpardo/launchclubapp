import { PageHeader } from "@saas/shared/components/PageHeader";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const t = await getTranslations();
	return { title: `${t("launchclub.sites.title")} — ${id}` };
}

export default async function SiteDetailPage({
	params,
}: {
	params: Promise<{ id: string; organizationSlug: string }>;
}) {
	const { id } = await params;
	const t = await getTranslations();

	return (
		<div>
			<PageHeader
				title={t("launchclub.sites.title")}
				subtitle={id}
			/>
			<div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
				<p className="text-sm text-muted-foreground">
					Site ID: {id}
				</p>
			</div>
		</div>
	);
}
