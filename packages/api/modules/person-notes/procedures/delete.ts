import { ORPCError } from "@orpc/client";
import { deletePersonNote, getPersonById, getPersonNoteById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { deletePersonNoteSchema } from "../types";

export const deletePersonNoteProcedure = protectedProcedure
	.route({ method: "DELETE", path: "/person-notes", tags: ["Person Notes"] })
	.input(deletePersonNoteSchema)
	.handler(async ({ input, context }) => {
		const person = await getPersonById(input.personId);
		if (!person) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(person.organizationId, context.user.id);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const note = await getPersonNoteById(input.id);
		if (!note) throw new ORPCError("NOT_FOUND");
		// The note must belong to the person whose org we authorized against,
		// otherwise an admin of org A could delete an org-B note by id.
		if (note.personId !== input.personId) throw new ORPCError("NOT_FOUND");
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
