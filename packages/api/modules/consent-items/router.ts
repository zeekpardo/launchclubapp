import { createConsentItemProcedure } from "./procedures/create";
import { deleteConsentItemProcedure } from "./procedures/delete";
import { listConsentItemsProcedure } from "./procedures/list";
import { pdfDownloadUrlProcedure } from "./procedures/pdf-download-url";
import { pdfUploadUrlProcedure } from "./procedures/pdf-upload-url";
import { reorderConsentItemsProcedure } from "./procedures/reorder";
import { updateConsentItemProcedure } from "./procedures/update";

export const consentItemsRouter = {
	list: listConsentItemsProcedure,
	create: createConsentItemProcedure,
	update: updateConsentItemProcedure,
	delete: deleteConsentItemProcedure,
	reorder: reorderConsentItemsProcedure,
	pdfUploadUrl: pdfUploadUrlProcedure,
	pdfDownloadUrl: pdfDownloadUrlProcedure,
};
