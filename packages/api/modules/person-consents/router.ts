import { createConsentSignatureUploadUrlProcedure } from "./procedures/create-signature-upload-url";
import { listPersonConsentsProcedure } from "./procedures/list";
import { listPreviousPersonConsentsProcedure } from "./procedures/list-previous";
import { upsertPersonConsentProcedure } from "./procedures/upsert";

export const personConsentsRouter = {
  list: listPersonConsentsProcedure,
  listPrevious: listPreviousPersonConsentsProcedure,
  upsert: upsertPersonConsentProcedure,
  createSignatureUploadUrl: createConsentSignatureUploadUrlProcedure,
};
