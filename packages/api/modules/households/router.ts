import { createHouseholdProcedure } from "./procedures/create";
import { deleteHouseholdProcedure } from "./procedures/delete";
import { getHousehold } from "./procedures/get";
import { listHouseholds } from "./procedures/list";
import { updateHouseholdProcedure } from "./procedures/update";

export const householdsRouter = {
	list: listHouseholds,
	get: getHousehold,
	create: createHouseholdProcedure,
	update: updateHouseholdProcedure,
	delete: deleteHouseholdProcedure,
};
