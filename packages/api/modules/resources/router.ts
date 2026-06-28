import { createResourceProcedure } from "./procedures/create";
import { deleteResourceProcedure } from "./procedures/delete";
import { listResources } from "./procedures/list";
import { updateResourceProcedure } from "./procedures/update";

export const resourcesRouter = {
	list: listResources,
	create: createResourceProcedure,
	update: updateResourceProcedure,
	delete: deleteResourceProcedure,
};
