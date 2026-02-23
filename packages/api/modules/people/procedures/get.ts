import { ORPCError } from "@orpc/client";
import { getPersonById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const getPerson = protectedProcedure
  .route({ method: "GET", path: "/people/{id}", tags: ["People"] })
  .input(z.object({ id: z.string(), organizationId: z.string() }))
  .handler(async ({ input, context }) => {
    await verifyOrganizationMembership(input.organizationId, context.user.id);
    const person = await getPersonById(input.id);
    if (!person) throw new ORPCError("NOT_FOUND");
    if (person.organizationId !== input.organizationId) throw new ORPCError("FORBIDDEN");
    return person;
  });
