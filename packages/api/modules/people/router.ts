import { createPersonProcedure } from "./procedures/create";
import { createPersonAvatarUploadUrl } from "./procedures/create-avatar-upload-url";
import { deletePersonProcedure } from "./procedures/delete";
import { getPerson } from "./procedures/get";
import { listPeople } from "./procedures/list";
import { updatePersonProcedure } from "./procedures/update";

export const peopleRouter = {
	list: listPeople,
	get: getPerson,
	create: createPersonProcedure,
	update: updatePersonProcedure,
	delete: deletePersonProcedure,
	avatarUploadUrl: createPersonAvatarUploadUrl,
};
