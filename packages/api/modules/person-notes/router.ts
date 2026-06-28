import { createPersonNoteProcedure } from "./procedures/create";
import { deletePersonNoteProcedure } from "./procedures/delete";
import { listPersonNotesProcedure } from "./procedures/list";
import { listMentionableUsersProcedure } from "./procedures/list-mentionable-users";
import { updatePersonNoteProcedure } from "./procedures/update";

export const personNotesRouter = {
	list: listPersonNotesProcedure,
	create: createPersonNoteProcedure,
	update: updatePersonNoteProcedure,
	delete: deletePersonNoteProcedure,
	mentionableUsers: listMentionableUsersProcedure,
};
