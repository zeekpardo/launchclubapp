import { addMember } from "./procedures/add-member";
import { assignGroupLeader } from "./procedures/assign-leader";
import { createGroupProcedure } from "./procedures/create";
import { createGroupImageUploadUrl } from "./procedures/create-image-upload-url";
import { deleteGroupProcedure } from "./procedures/delete";
import { getGroup } from "./procedures/get";
import { listGroups } from "./procedures/list";
import { removeGroupLeader } from "./procedures/remove-leader";
import { removeMember } from "./procedures/remove-member";
import { updateGroupProcedure } from "./procedures/update";

export const groupsRouter = {
  list: listGroups,
  get: getGroup,
  create: createGroupProcedure,
  update: updateGroupProcedure,
  delete: deleteGroupProcedure,
  addMember,
  removeMember,
  assignLeader: assignGroupLeader,
  removeLeader: removeGroupLeader,
  imageUploadUrl: createGroupImageUploadUrl,
};
