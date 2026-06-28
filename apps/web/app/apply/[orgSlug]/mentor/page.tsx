import {
	getCollectInApplicationFieldsByOrg,
	getOrgApplicationSettings,
	getOrganizationBySlug,
} from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import type { BasicFormField } from "./MentorApplicationForm";
import { MentorApplicationForm } from "./MentorApplicationForm";

export default async function MentorApplyPage({
	params,
}: {
	params: Promise<{ orgSlug: string }>;
}) {
	const { orgSlug } = await params;
	const org = await getOrganizationBySlug(orgSlug);

	const [orgSettings, rawProfileFields] = await Promise.all([
		org ? getOrgApplicationSettings(org.id) : null,
		org ? getCollectInApplicationFieldsByOrg(org.id) : [],
	]);
	// Form fields are now scoped to specific mentor Forms (Phase 3).
	// Until a mentor Form is assigned to this org, the public apply page shows no custom fields.
	const rawFormFields: {
		id: string;
		label: string;
		fieldKey: string;
		type: string;
		placeholder: string | null;
		helpText: string | null;
		required: boolean;
		options: unknown;
	}[] = [];

	async function resolveDocUrl(key: string | null | undefined) {
		if (!key) return null;
		try {
			return await getSignedUrl(key, {
				bucket: "consentForms",
				expiresIn: 3600,
			});
		} catch {
			return null;
		}
	}

	const showMentorContract = orgSettings?.showMentorContract ?? false;
	const showMentorSecurityClearance =
		orgSettings?.showMentorSecurityClearance ?? false;
	const enableMentorDocumentUpload =
		orgSettings?.enableMentorDocumentUpload ?? false;

	const [mentorContractUrl, mentorSecurityClearanceUrl] = await Promise.all([
		showMentorContract
			? resolveDocUrl(orgSettings?.mentorContractUrl)
			: null,
		showMentorSecurityClearance
			? resolveDocUrl(orgSettings?.mentorSecurityClearanceUrl)
			: null,
	]);

	const formFields: BasicFormField[] = rawFormFields.map((f) => ({
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
			<div className="max-w-2xl mx-auto space-y-8">
				<div className="text-center space-y-3">
					<h1 className="text-4xl font-bold">Mentor Application</h1>
					<p className="text-muted-foreground">
						Apply to become a mentor and group leader.
					</p>
					{org && (
						<p className="text-sm font-medium text-muted-foreground">
							<span className="text-foreground">{org.name}</span>
						</p>
					)}
				</div>

				{!org ? (
					<div className="text-center py-16">
						<p className="text-lg text-muted-foreground">
							Organization not found.
						</p>
					</div>
				) : (
					<MentorApplicationForm
						orgSlug={orgSlug}
						formFields={formFields}
						profileFields={rawProfileFields.map((f) => ({
							id: f.id,
							name: f.name,
							nameEs: f.nameEs,
							type: f.type,
							required: f.required,
							options: Array.isArray(f.options)
								? (f.options as string[])
								: [],
						}))}
						mentorContractUrl={mentorContractUrl}
						mentorSecurityClearanceUrl={mentorSecurityClearanceUrl}
						showMentorContract={showMentorContract}
						showMentorSecurityClearance={
							showMentorSecurityClearance
						}
						enableMentorDocumentUpload={enableMentorDocumentUpload}
					/>
				)}
			</div>
		</div>
	);
}
