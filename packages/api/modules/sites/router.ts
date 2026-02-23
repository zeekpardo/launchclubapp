import { assignSiteLeader } from "./procedures/assign-leader";
import { createSiteProcedure } from "./procedures/create";
import { deleteSiteProcedure } from "./procedures/delete";
import { getSite } from "./procedures/get";
import { listSites } from "./procedures/list";
import { removeSiteLeader } from "./procedures/remove-leader";
import { updateSiteProcedure } from "./procedures/update";

export const sitesRouter = {
  list: listSites,
  get: getSite,
  create: createSiteProcedure,
  update: updateSiteProcedure,
  delete: deleteSiteProcedure,
  assignLeader: assignSiteLeader,
  removeLeader: removeSiteLeader,
};
