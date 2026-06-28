import { createFormProcedure } from "./procedures/create";
import { listForms } from "./procedures/list";
import { getForm } from "./procedures/get";
import { updateFormProcedure } from "./procedures/update";
import { softDeleteFormProcedure } from "./procedures/soft-delete";
import { assignSitesProcedure } from "./procedures/assign-sites";
import { publicGetForm } from "./procedures/public-get";
import { publicSubmitForm } from "./procedures/public-submit";
import { publicConsentUploadUrl } from "./procedures/public-consent-upload-url";
import { publicFormFieldUploadUrl } from "./procedures/public-form-field-upload-url";

export const formsRouter = {
  create: createFormProcedure,
  list: listForms,
  get: getForm,
  update: updateFormProcedure,
  softDelete: softDeleteFormProcedure,
  assignSites: assignSitesProcedure,
  publicGet: publicGetForm,
  publicSubmit: publicSubmitForm,
  publicConsentUploadUrl,
  publicFormFieldUploadUrl,
};
