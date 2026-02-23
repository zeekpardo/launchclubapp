import { listAreaFields } from "./procedures/list-area-fields";
import { listSiteFields } from "./procedures/list-site-fields";
import { addField } from "./procedures/add-field";
import { updateField } from "./procedures/update-field";
import { deleteField } from "./procedures/delete-field";
import { reorderFields } from "./procedures/reorder-fields";

export const formBuilderRouter = {
  listAreaFields,
  listSiteFields,
  addField,
  updateField,
  deleteField,
  reorderFields,
};
