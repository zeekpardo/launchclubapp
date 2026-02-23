import { addGuardianProcedure } from "./procedures/add";
import { removeGuardianProcedure } from "./procedures/remove";

export const guardiansRouter = {
  add: addGuardianProcedure,
  remove: removeGuardianProcedure,
};
