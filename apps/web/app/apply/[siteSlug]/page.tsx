import { getCollectInApplicationFieldsBySite, getFormFieldsBySiteSlug, getOrgApplicationSettings, getSiteBySlug } from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "../LanguageSwitcher";
import type { BasicFormField } from "./ApplicationForm";
import { ApplicationForm } from "./ApplicationForm";

export default async function ApplyPage({
	params,
}: {
	params: Promise<{ siteSlug: string }>;
}) {
	const { siteSlug } = await params;
	const [site, profileFields, { areaFields, siteFields }, t] = await Promise.all([
		getSiteBySlug(siteSlug),
		getCollectInApplicationFieldsBySite(siteSlug),
		getFormFieldsBySiteSlug(siteSlug),
		getTranslations("application"),
	]);
	const orgSettings = site ? await getOrgApplicationSettings(site.area.organizationId) : null;
	const enableConsentFileUpload = orgSettings?.enableConsentFileUpload ?? false;

	async function resolveConsentUrl(key: string | null | undefined) {
		if (!key) return null;
		try {
			return await getSignedUrl(key, { bucket: "consentForms", expiresIn: 3600 });
		} catch {
			return null;
		}
	}

	const [observationFormUrl, termsFormUrl, photoVideoFormUrl] = await Promise.all([
		resolveConsentUrl(orgSettings?.observationConsentFormUrl),
		resolveConsentUrl(orgSettings?.termsConsentFormUrl),
		resolveConsentUrl(orgSettings?.photoVideoConsentFormUrl),
	]);

	const consentConfig = {
		showObservation: orgSettings?.showObservationConsent ?? true,
		showTerms: orgSettings?.showTermsConsent ?? true,
		showPhotoVideo: orgSettings?.showPhotoVideoConsent ?? true,
		observationFormUrl,
		termsFormUrl,
		photoVideoFormUrl,
	};
	const formFields: BasicFormField[] = [...areaFields, ...siteFields].map((f) => ({
		id: f.id,
		label: f.label,
		fieldKey: f.fieldKey,
		type: f.type,
		placeholder: f.placeholder,
		helpText: f.helpText,
		required: f.required,
		options: Array.isArray(f.options)
			? (f.options as { label: string; value: string }[])
			: null,
	}));

	return (
		<div className="min-h-screen bg-background py-12 px-4">
			<div className="max-w-4xl mx-auto space-y-8">
				<LanguageSwitcher />
				<div className="text-center space-y-4">
					<h1 className="text-4xl font-bold">{t("title")}</h1>
					<p className="text-lg text-muted-foreground">
						{t("subtitle")}
					</p>
					{site && (
						<p className="text-sm font-medium text-muted-foreground">
							{t("applyingFor")}{" "}
							<span className="text-foreground">{site.name}</span>
						</p>
					)}
				</div>

				{site && !site.acceptApplications ? (
					<div className="text-center py-16">
						<p className="text-lg text-muted-foreground">
							{t("closed")}
						</p>
					</div>
				) : (
					<ApplicationForm siteSlug={siteSlug} siteName={site?.name} profileFields={profileFields} formFields={formFields} enableConsentFileUpload={enableConsentFileUpload} consentConfig={consentConfig} />
				)}
			</div>
		</div>
	);
}
