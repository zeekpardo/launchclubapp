import { ORPCError } from "@orpc/client";
import {
	deletePersonNote,
	getPersonById,
	getPersonNoteById,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { deletePersonNoteSchema } from "../types";

export const deletePersonNoteProcedure = protectedProcedure
	.route({ method: "DELETE", path: "/person-notes", tags: ["Person Notes"] })
	.input(deletePersonNoteSchema)
	.handler(async ({ input, context }) => {
		const person = await getPersonById(input.personId);
		if (!person) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			person.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const note = await getPersonNoteById(input.id);
		if (!note) throw new ORPCError("NOT_FOUND");
		if (
			note.authorId !== context.user.id &&
			membership.role !== "owner" &&
			membership.role !== "admin" &&
			context.user.role !== "admin"
		) {
			throw new ORPCError("FORBIDDEN");
		}
		await deletePersonNote(input.id);
		return { success: true };
	});
