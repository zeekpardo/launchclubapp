import { z } from "zod";

export const listPersonNotesSchema = z.object({
	personId: z.string().max(36),
});

export const createPersonNoteSchema = z.object({
	personId: z.string().max(36),
	body: z.string().min(1).max(10000),
	mentionUserIds: z.array(z.string().max(36)).default([]),
});

export const updatePersonNoteSchema = z.object({
	id: z.string().max(36),
	personId: z.string().max(36),
	body: z.string().min(1).max(10000),
	mentionUserIds: z.array(z.string().max(36)).default([]),
});

export const deletePersonNoteSchema = z.object({
	id: z.string().max(36),
	personId: z.string().max(36),
});

export const listMentionableUsersSchema = z.object({
	organizationId: z.string().max(36),
});
