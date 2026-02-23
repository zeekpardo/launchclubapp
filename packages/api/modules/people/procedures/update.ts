import { ORPCError } from "@orpc/client";
import { getPersonById, updatePerson } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { updatePersonSchema } from "../types";

export const updatePersonProcedure = protectedProcedure
  .route({ method: "PATCH", path: "/people/{id}", tags: ["People"] })
  .input(updatePersonSchema)
  .handler(async ({ input, context }) => {
    const person = await getPersonById(input.id);
    if (!person) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(
      person.organizationId,
      context.user.id,
    );
    if (!membership) throw new ORPCError("FORBIDDEN");
    const { id, dateOfBirth, ...data } = input;
    return updatePerson(id, {
      ...data,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    });
  });
