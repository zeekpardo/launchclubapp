import { createChildPhotoUploadUrl } from "./procedures/create-child-photo-upload-url";
import { createConsentSignatureUploadUrlProcedure } from "./procedures/create-consent-signature-upload-url";
import { createConsentFormUploadUrlProcedure } from "./procedures/create-consent-form-upload-url";
import { getConsentFormDownloadUrlProcedure } from "./procedures/get-consent-form-download-url";
import { createFormFieldFileUploadUrl } from "./procedures/create-form-field-file-upload-url";
import { submitApplication } from "./procedures/submit";
import { listApplications } from "./procedures/list";
import { getApplication } from "./procedures/get";
import { reviewApplicationProcedure } from "./procedures/review";
import { getOrgApplicationSettingsProcedure } from "./procedures/get-org-settings";
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
};
