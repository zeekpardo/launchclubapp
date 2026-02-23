import { listResources } from "./procedures/list";
import { createResourceProcedure } from "./procedures/create";
import { updateResourceProcedure } from "./procedures/update";
import { deleteResourceProcedure } from "./procedures/delete";

export const resourcesRouter = {
  list: listResources,
  create: createResourceProcedure,
  update: updateResourceProcedure,
  delete: deleteResourceProcedure,
};
