import { ORPCError } from "@orpc/client";
import { getFormById } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { getFormSchema } from "../types";

export const getForm = protectedProcedure
	.route({
		method: "GET",
		path: "/forms/{formId}",
		tags: ["Forms"],
		summary: "Get a form by ID",
	})
	.input(getFormSchema)
	.handler(async ({ input }) => {
		const form = await getFormById(input.formId);
		if (!form) throw new ORPCError("NOT_FOUND");
		return form;
	});
