import { z } from "zod";

export const createGroupSchema = z.object({
	siteId: z.string().max(36),
	name: z.string().min(1).max(100),
	description: z.string().max(1000).optional(),
	gradeLevel: z.string().max(50).optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	meetingDay: z.string().max(100).optional(),
	meetingTime: z.string().max(10).optional(),
	meetingEndTime: z.string().max(10).optional(),
	meetingRecurrence: z.string().max(50).optional(),
	image: z.string().max(500).optional(),
});

export const updateGroupSchema = createGroupSchema
	.partial()
	.extend({ id: z.string().max(36) });

export const addMemberSchema = z.object({
	groupId: z.string().max(36),
	personId: z.string().max(36),
	role: z.enum(["MEMBER", "LEADER"]).default("MEMBER"),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
