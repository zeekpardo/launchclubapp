import { ORPCError } from "@orpc/client";
import { getCustomFieldById, getPersonById, upsertCustomFieldValue } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { setCustomFieldValueSchema } from "../types";

export const setCustomFieldValueProcedure = protectedProcedure
  .route({ method: "POST", path: "/custom-fields/values", tags: ["CustomFields"] })
  .input(setCustomFieldValueSchema)
  .handler(async ({ input, context }) => {
    await verifyOrganizationMembership(input.organizationId, context.user.id);
    // The field and person must both belong to the caller's org, otherwise a
    // member of one org could write a value onto another org's field/person.
    const [field, person] = await Promise.all([
      getCustomFieldById(input.customFieldId),
      getPersonById(input.personId),
    ]);
    if (!field || field.organizationId !== input.organizationId) throw new ORPCError("NOT_FOUND");
    if (!person || person.organizationId !== input.organizationId) throw new ORPCError("NOT_FOUND");
    return upsertCustomFieldValue(input.customFieldId, input.personId, input.value ?? null);
  });
