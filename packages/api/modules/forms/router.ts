import { assignSitesProcedure } from "./procedures/assign-sites";
import { createFormProcedure } from "./procedures/create";
import { getForm } from "./procedures/get";
import { listForms } from "./procedures/list";
import { publicConsentUploadUrl } from "./procedures/public-consent-upload-url";
import { publicFormFieldUploadUrl } from "./procedures/public-form-field-upload-url";
import { publicGetForm } from "./procedures/public-get";
import { publicSubmitForm } from "./procedures/public-submit";
import { softDeleteFormProcedure } from "./procedures/soft-delete";
import { updateFormProcedure } from "./procedures/update";

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
