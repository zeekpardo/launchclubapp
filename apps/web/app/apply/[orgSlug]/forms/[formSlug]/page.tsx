import { getFormBySlug, getOrganizationBySlug } from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import { MentorFormLayout } from "@saas/forms/components/public/MentorFormLayout";
import { StudentFormLayout } from "@saas/forms/components/public/StudentFormLayout";

export default async function PublicFormPage({
	params,
	searchParams,
}: {
	params: Promise<{ orgSlug: string; formSlug: string }>;
	searchParams: Promise<{ site?: string }>;
}) {
	const { orgSlug, formSlug } = await params;
	const { site: siteSlug } = await searchParams;

	const notAvailable = (
		<div className="min-h-screen flex items-center justify-center p-4">
			<div className="max-w-md text-center space-y-3">
				<h1 className="text-2xl font-bold">Form Not Available</h1>
				<p className="text-muted-foreground">
					This form isn&apos;t available. Please reach out to staff.
				</p>
			</div>
		</div>
	);

	const org = await getOrganizationBySlug(orgSlug);
	if (!org) return notAvailable;

	const form = await getFormBySlug(org.id, formSlug);
	if (!form || form.deletedAt || form.status === "UNPUBLISHED")
		return notAvailable;

	const formSites = (form.formSites ?? []) as {
		siteId: string;
		site?: { id: string; name: string; slug: string };
	}[];

	const sites = formSites.map((fs) => ({
		id: fs.siteId,
		name: fs.site?.name ?? fs.siteId,
		slug: fs.site?.slug ?? "",
	}));

	const preselectedSiteId = siteSlug
		? (formSites.find((fs) => fs.site?.slug === siteSlug)?.siteId ??
			undefined)
		: undefined;

	const fields = await Promise.all(
		(form.fields ?? []).map(async (f) => {
			let downloadUrl: string | null = null;
			if (f.type === "CONSENT" && f.consentItem?.pdfKey) {
				try {
					downloadUrl = await getSignedUrl(f.consentItem.pdfKey, {
						bucket: "consentForms",
						expiresIn: 3600,
					});
				} catch {
					// no PDF uploaded yet — omit the download link
				}
			}
			return {
				id: f.id,
				label: f.label,
				fieldKey: f.fieldKey,
				type: f.type,
				required: f.required,
				placeholder: f.placeholder,
				helpText: f.helpText,
				options: f.options,
				profileFieldKey: f.profileFieldKey,
				targetPersonType: f.targetPersonType,
				customField: f.customField
					? {
							type: f.customField.type,
							options: f.customField.options,
						}
					: null,
				consentItem: f.consentItem
					? {
							id: f.consentItem.id,
							name: f.consentItem.name,
							pdfKey: f.consentItem.pdfKey,
							downloadUrl,
						}
					: null,
			};
		}),
	);

	return (
		<div className="min-h-screen bg-background py-12 px-4">
			<div className="max-w-2xl mx-auto space-y-8">
				{form.type === "STUDENT" ? (
					<StudentFormLayout
						orgSlug={orgSlug}
						formSlug={formSlug}
						formName={form.name}
						formDescription={form.description}
						fields={fields}
						sites={sites}
						preselectedSiteId={preselectedSiteId}
					/>
				) : (
					<MentorFormLayout
						orgSlug={orgSlug}
						formSlug={formSlug}
						formName={form.name}
						formDescription={form.description}
						fields={fields}
						sites={sites}
						preselectedSiteId={preselectedSiteId}
					/>
				)}
			</div>
		</div>
	);
}
