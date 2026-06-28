export const config = {
	bucketNames: {
		avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
		customFields: process.env.CUSTOM_FIELDS_BUCKET_NAME ?? "custom-fields",
		consentSignatures:
			process.env.CONSENT_SIGNATURES_BUCKET_NAME ?? "consent-signatures",
		consentForms: process.env.CONSENT_FORMS_BUCKET_NAME ?? "consent-forms",
	},
} as const;
