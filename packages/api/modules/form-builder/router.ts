import { addField } from "./procedures/add-field";
import { deleteField } from "./procedures/delete-field";
import { listAreaFields } from "./procedures/list-area-fields";
import { listFormFields } from "./procedures/list-form-fields";
import { listOrgFields } from "./procedures/list-org-fields";
import { listSiteFields } from "./procedures/list-site-fields";
import { reorderFields } from "./procedures/reorder-fields";
import { updateField } from "./procedures/update-field";

export const formBuilderRouter = {
	listAreaFields,
	listSiteFields,
	listOrgFields,
	listFormFields,
	addField,
	updateField,
	deleteField,
	reorderFields,
};
