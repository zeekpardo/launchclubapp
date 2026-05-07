import { listConsentItemsProcedure } from "./procedures/list";
import { createConsentItemProcedure } from "./procedures/create";
import { updateConsentItemProcedure } from "./procedures/update";
import { deleteConsentItemProcedure } from "./procedures/delete";
import { reorderConsentItemsProcedure } from "./procedures/reorder";
import { pdfUploadUrlProcedure } from "./procedures/pdf-upload-url";
import { pdfDownloadUrlProcedure } from "./procedures/pdf-download-url";

export const consentItemsRouter = {
  list: listConsentItemsProcedure,
  create: createConsentItemProcedure,
  update: updateConsentItemProcedure,
  delete: deleteConsentItemProcedure,
  reorder: reorderConsentItemsProcedure,
  pdfUploadUrl: pdfUploadUrlProcedure,
  pdfDownloadUrl: pdfDownloadUrlProcedure,
};
