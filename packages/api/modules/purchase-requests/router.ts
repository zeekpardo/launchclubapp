import { createPurchaseRequestProcedure } from "./procedures/create";
import { deletePurchaseRequestProcedure } from "./procedures/delete";
import { listPurchaseRequests } from "./procedures/list";
import { listAllPurchaseRequests } from "./procedures/list-all";
import { reviewPurchaseRequestProcedure } from "./procedures/review";
import { updatePurchaseRequestProcedure } from "./procedures/update";

export const purchaseRequestsRouter = {
	list: listPurchaseRequests,
	listAll: listAllPurchaseRequests,
	create: createPurchaseRequestProcedure,
	update: updatePurchaseRequestProcedure,
	delete: deletePurchaseRequestProcedure,
	review: reviewPurchaseRequestProcedure,
};
