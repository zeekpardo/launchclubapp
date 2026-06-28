import { createAreaProcedure } from "./procedures/create";
import { deleteAreaProcedure } from "./procedures/delete";
import { getArea } from "./procedures/get";
import { listAreas } from "./procedures/list";
import { updateAreaProcedure } from "./procedures/update";

export const areasRouter = {
	list: listAreas,
	get: getArea,
	create: createAreaProcedure,
	update: updateAreaProcedure,
	delete: deleteAreaProcedure,
};
