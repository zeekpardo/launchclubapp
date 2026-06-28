import { ORPCError } from "@orpc/client";
import {
	createNotification,
	createPersonNote,
	getPersonById,
} from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { NOTIFICATION_TYPES } from "../../notifications/lib/notification-types";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { createPersonNoteSchema } from "../types";

export const createPersonNoteProcedure = protectedProcedure
	.route({ method: "POST", path: "/person-notes", tags: ["Person Notes"] })
	.input(createPersonNoteSchema)
	.handler(async ({ input, context }) => {
		const person = await getPersonById(input.personId);
		if (!person) throw new ORPCError("NOT_FOUND");
		const membership = await verifyOrganizationMembership(
			person.organizationId,
			context.user.id,
		);
		if (!membership) throw new ORPCError("FORBIDDEN");
		const note = await createPersonNote({
			personId: input.personId,
			organizationId: person.organizationId,
			authorId: context.user.id,
			body: input.body,
			mentionUserIds: input.mentionUserIds,
		});

		if (note.mentions.length > 0) {
			const personName = `${person.firstName} ${person.lastName}`;
			const authorName = note.author.name;
			const nt = NOTIFICATION_TYPES.MENTION;
			await Promise.allSettled(
				note.mentions.map((mention) =>
					createNotification({
						organizationId: person.organizationId,
						recipientId: mention.user.id,
						type: "MENTION",
						title: nt.title(authorName),
						message: nt.message(personName),
						link: `/people/${input.personId}`,
						entityType: "person_note",
						entityId: note.id,
					}),
				),
			);
		}

		return note;
	});
