import { ORPCError } from "@orpc/client";
import { createPersonNote, getPersonById } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createPersonNoteSchema } from "../types";

export const createPersonNoteProcedure = protectedProcedure
	.route({ method: "POST", path: "/person-notes", tags: ["Person Notes"] })
	.input(createPersonNoteSchema)
	.handler(async ({ input, context }) => {
		const person = await getPersonById(input.personId);
		if (!person) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(person.organizationId, context.user.id);
		if (!membership) throw new ORPCError("FORBIDDEN");
		return createPersonNote({
			personId: input.personId,
			organizationId: person.organizationId,
			authorId: context.user.id,
			body: input.body,
			mentionUserIds: input.mentionUserIds,
		});
	});
