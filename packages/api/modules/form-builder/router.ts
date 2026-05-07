import { listAreaFields } from "./procedures/list-area-fields";
import { listSiteFields } from "./procedures/list-site-fields";
import { listOrgFields } from "./procedures/list-org-fields";
import { listFormFields } from "./procedures/list-form-fields";
import { addField } from "./procedures/add-field";
import { updateField } from "./procedures/update-field";
import { deleteField } from "./procedures/delete-field";
import { reorderFields } from "./procedures/reorder-fields";

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
