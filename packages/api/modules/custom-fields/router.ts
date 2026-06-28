import { createCustomFieldProcedure } from "./procedures/create";
import { deleteCustomFieldProcedure } from "./procedures/delete";
import { getCustomFieldUploadUrlProcedure } from "./procedures/getUploadUrl";
import { listCustomFieldsProcedure } from "./procedures/list";
import { listCustomFieldValuesProcedure } from "./procedures/listValues";
import { reorderCustomFieldsProcedure } from "./procedures/reorder";
import { setCustomFieldValueProcedure } from "./procedures/setValue";
import { updateCustomFieldProcedure } from "./procedures/update";

export const customFieldsRouter = {
	list: listCustomFieldsProcedure,
	create: createCustomFieldProcedure,
	update: updateCustomFieldProcedure,
	delete: deleteCustomFieldProcedure,
	reorder: reorderCustomFieldsProcedure,
	listValues: listCustomFieldValuesProcedure,
	setValue: setCustomFieldValueProcedure,
	getUploadUrl: getCustomFieldUploadUrlProcedure,
};
