import { ORPCError } from "@orpc/client";
import { getPersonById, upsertPersonConsent } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { upsertPersonConsentSchema } from "../types";

const ALLOWED_ROLES = ["owner", "admin", "siteLeader", "mentor"] as const;

export const upsertPersonConsentProcedure = protectedProcedure
  .route({ method: "POST", path: "/person-consents", tags: ["Person Consents"] })
  .input(upsertPersonConsentSchema)
  .handler(async ({ input, context }) => {
    const person = await getPersonById(input.personId);
    if (!person) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(person.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    if (!ALLOWED_ROLES.includes(membership.role as (typeof ALLOWED_ROLES)[number])) {
      throw new ORPCError("FORBIDDEN");
    }
    return upsertPersonConsent({
      personId: input.personId,
      academicYearId: input.academicYearId,
      consentItemId: input.consentItemId,
      granted: input.granted,
      grantedAt: input.granted && input.grantedAt ? new Date(input.grantedAt) : null,
      signatureFileUrl: input.signatureFileUrl,
    });
  });
