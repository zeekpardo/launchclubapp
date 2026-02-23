import { listCustomFieldsProcedure } from "./procedures/list";
import { createCustomFieldProcedure } from "./procedures/create";
import { updateCustomFieldProcedure } from "./procedures/update";
import { deleteCustomFieldProcedure } from "./procedures/delete";
import { listCustomFieldValuesProcedure } from "./procedures/listValues";
import { setCustomFieldValueProcedure } from "./procedures/setValue";
import { getCustomFieldUploadUrlProcedure } from "./procedures/getUploadUrl";

export const customFieldsRouter = {
  list: listCustomFieldsProcedure,
  create: createCustomFieldProcedure,
  update: updateCustomFieldProcedure,
  delete: deleteCustomFieldProcedure,
  listValues: listCustomFieldValuesProcedure,
  setValue: setCustomFieldValueProcedure,
  getUploadUrl: getCustomFieldUploadUrlProcedure,
};
