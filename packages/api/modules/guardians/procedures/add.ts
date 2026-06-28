import { ORPCError } from "@orpc/client";
import { addGuardian, getPersonById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const addGuardianProcedure = protectedProcedure
	.route({ method: "POST", path: "/guardians", tags: ["Guardians"] })
	.input(
		z.object({
			personId: z.string(),
			kidId: z.string(),
			relation: z.string().optional(),
		}),
	)
	.handler(async ({ input }) => {
		const guardian = await getPersonById(input.personId);
		if (!guardian)
			throw new ORPCError("NOT_FOUND", {
				message: "Guardian person not found",
			});
		if (guardian.personType !== "PARENT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "Guardian must have personType PARENT",
			});
		}

		const kid = await getPersonById(input.kidId);
		if (!kid)
			throw new ORPCError("NOT_FOUND", {
				message: "Child person not found",
			});
		if (kid.personType !== "STUDENT") {
			throw new ORPCError("BAD_REQUEST", {
				message: "Child must have personType STUDENT",
			});
		}

		return addGuardian(input.personId, input.kidId, input.relation);
	});
