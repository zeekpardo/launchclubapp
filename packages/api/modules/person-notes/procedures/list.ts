import { ORPCError } from "@orpc/client";
import { getPersonById, getPersonNotesByPerson } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { listPersonNotesSchema } from "../types";

export const listPersonNotesProcedure = protectedProcedure
	.route({ method: "GET", path: "/person-notes", tags: ["Person Notes"] })
	.input(listPersonNotesSchema)
	.handler(async ({ input, context }) => {
		const person = await getPersonById(input.personId);
		if (!person) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			person.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return getPersonNotesByPerson(input.personId);
	});
