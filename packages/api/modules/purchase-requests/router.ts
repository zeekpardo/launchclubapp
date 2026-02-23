import { listPurchaseRequests } from "./procedures/list";
import { listAllPurchaseRequests } from "./procedures/list-all";
import { createPurchaseRequestProcedure } from "./procedures/create";
import { updatePurchaseRequestProcedure } from "./procedures/update";
import { deletePurchaseRequestProcedure } from "./procedures/delete";
import { reviewPurchaseRequestProcedure } from "./procedures/review";

export const purchaseRequestsRouter = {
  list: listPurchaseRequests,
  listAll: listAllPurchaseRequests,
  create: createPurchaseRequestProcedure,
  update: updatePurchaseRequestProcedure,
  delete: deletePurchaseRequestProcedure,
  review: reviewPurchaseRequestProcedure,
};
