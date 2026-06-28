import { createChildPhotoUploadUrl } from "./procedures/create-child-photo-upload-url";
import { createConsentFormUploadUrlProcedure } from "./procedures/create-consent-form-upload-url";
import { createConsentSignatureUploadUrlProcedure } from "./procedures/create-consent-signature-upload-url";
import { createFormFieldFileUploadUrl } from "./procedures/create-form-field-file-upload-url";
import { createMentorDocUploadUrlProcedure } from "./procedures/create-mentor-doc-upload-url";
import { getApplication } from "./procedures/get";
import { getConsentFormDownloadUrlProcedure } from "./procedures/get-consent-form-download-url";
import { getOrgApplicationSettingsProcedure } from "./procedures/get-org-settings";
import { listApplications } from "./procedures/list";
import { reviewApplicationProcedure } from "./procedures/review";
import { submitApplication } from "./procedures/submit";
import { updateOrgApplicationSettingsProcedure } from "./procedures/update-org-settings";

export const applicationsRouter = {
	submit: submitApplication,
	list: listApplications,
	get: getApplication,
	review: reviewApplicationProcedure,
	getOrgSettings: getOrgApplicationSettingsProcedure,
	updateOrgSettings: updateOrgApplicationSettingsProcedure,
	childPhotoUploadUrl: createChildPhotoUploadUrl,
	formFieldFileUploadUrl: createFormFieldFileUploadUrl,
	consentSignatureUploadUrl: createConsentSignatureUploadUrlProcedure,
	consentFormUploadUrl: createConsentFormUploadUrlProcedure,
	consentFormDownloadUrl: getConsentFormDownloadUrlProcedure,
	mentorDocUploadUrl: createMentorDocUploadUrlProcedure,
};
