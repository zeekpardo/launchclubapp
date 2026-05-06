import { db } from "../client";

export async function getOrgApplicationSettings(organizationId: string) {
  return db.organizationApplicationSettings.findUnique({
    where: { organizationId },
  });
}

export async function upsertOrgApplicationSettings(
  organizationId: string,
  data: { autoMigrate?: boolean; emailNotifications?: boolean; studentIdMode?: string; enableConsentFileUpload?: boolean; showObservationConsent?: boolean; showTermsConsent?: boolean; showPhotoVideoConsent?: boolean; observationConsentFormUrl?: string | null; termsConsentFormUrl?: string | null; photoVideoConsentFormUrl?: string | null },
) {
  return db.organizationApplicationSettings.upsert({
    where: { organizationId },
    create: { organizationId, ...data },
    update: data,
  });
}
