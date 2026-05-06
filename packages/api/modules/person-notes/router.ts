import { listPersonNotesProcedure } from "./procedures/list";
import { createPersonNoteProcedure } from "./procedures/create";
import { updatePersonNoteProcedure } from "./procedures/update";
import { deletePersonNoteProcedure } from "./procedures/delete";
import { listMentionableUsersProcedure } from "./procedures/list-mentionable-users";

export const personNotesRouter = {
	list: listPersonNotesProcedure,
	create: createPersonNoteProcedure,
	update: updatePersonNoteProcedure,
	delete: deletePersonNoteProcedure,
	mentionableUsers: listMentionableUsersProcedure,
};
