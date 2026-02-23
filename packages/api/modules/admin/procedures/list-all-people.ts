import { countAllPeople, getAllPeople } from "@repo/database";
import { z } from "zod";
import { adminProcedure } from "../../../orpc/procedures";

export const listAllPeople = adminProcedure
	.route({
		method: "GET",
		path: "/admin/people",
		tags: ["Administration"],
		summary: "List all people across all organizations",
	})
	.input(
		z.object({
			query: z.string().max(200).optional(),
			limit: z.number().min(1).max(100).default(10),
			offset: z.number().min(0).default(0),
		}),
	)
	.handler(async ({ input }) => {
		const people = await getAllPeople(input);
		const total = await countAllPeople({ query: input.query });
		return { people, total };
	});
