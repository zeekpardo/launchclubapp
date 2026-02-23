import { countAllApplications, getAllApplications } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

export const listAllApplications = adminProcedure
	.route({
		method: "GET",
		path: "/admin/applications",
		tags: ["Administration"],
		summary: "List all applications across all organizations",
	})
	.input(
		z.object({
			query: z.string().max(200).optional(),
			limit: z.number().min(1).max(100).default(10),
			offset: z.number().min(0).default(0),
		}),
	)
	.handler(async ({ input }) => {
		const applications = await getAllApplications(input);
		const total = await countAllApplications({ query: input.query });
		return { applications, total };
	});
