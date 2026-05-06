import { type ConsentType } from "../generated/enums";
import { db } from "../client";

export async function getPersonConsents(personId: string, academicYearId: string) {
  return db.personConsent.findMany({
    where: { personId, academicYearId },
    orderBy: { consentType: "asc" },
  });
}

export async function upsertPersonConsent(data: {
  personId: string;
  academicYearId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt?: Date | null;
  signatureFileUrl?: string | null;
}) {
  const { personId, academicYearId, consentType, ...rest } = data;
  return db.personConsent.upsert({
    where: {
      personId_academicYearId_consentType: { personId, academicYearId, consentType },
    },
    create: { personId, academicYearId, consentType, ...rest },
    update: { ...rest },
  });
}

export async function getPreviousYearConsents(personId: string, orgId: string) {
  // Find the most recent non-active academic year for the org that has at least one PersonConsent for this person
  const year = await db.academicYear.findFirst({
    where: {
      organizationId: orgId,
      isActive: false,
      personConsents: { some: { personId } },
    },
    orderBy: { label: "desc" },
    include: {
      personConsents: {
        where: { personId },
        orderBy: { consentType: "asc" },
      },
    },
  });

  if (!year) return null;

  const { personConsents, ...academicYear } = year;
  return { academicYear, consents: personConsents };
}
