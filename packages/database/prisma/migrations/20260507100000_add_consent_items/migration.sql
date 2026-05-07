-- Step 1: Create the consent_item table
CREATE TABLE "consent_item" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameES" TEXT,
    "pdfKey" TEXT,
    "applicantType" "PersonType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_item_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "consent_item_organizationId_idx" ON "consent_item"("organizationId");

ALTER TABLE "consent_item" ADD CONSTRAINT "consent_item_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 2: For each org that has OrganizationApplicationSettings, seed 3 default ConsentItems
--         (Observation Sessions, Terms & Conditions, Photos & Videos) for STUDENT applicants.
--         We use gen_random_uuid() cast to text as a cuid-style ID — acceptable for migration seeds.
INSERT INTO "consent_item" ("id", "organizationId", "name", "nameES", "applicantType", "isActive", "sortOrder", "updatedAt")
SELECT
    gen_random_uuid()::text,
    oas."organizationId",
    'Observation Sessions',
    NULL,
    'STUDENT'::"PersonType",
    true,
    0,
    NOW()
FROM "organization_application_settings" oas
ON CONFLICT DO NOTHING;

INSERT INTO "consent_item" ("id", "organizationId", "name", "nameES", "applicantType", "isActive", "sortOrder", "updatedAt")
SELECT
    gen_random_uuid()::text,
    oas."organizationId",
    'Terms & Conditions',
    NULL,
    'STUDENT'::"PersonType",
    true,
    1,
    NOW()
FROM "organization_application_settings" oas
ON CONFLICT DO NOTHING;

INSERT INTO "consent_item" ("id", "organizationId", "name", "nameES", "applicantType", "isActive", "sortOrder", "updatedAt")
SELECT
    gen_random_uuid()::text,
    oas."organizationId",
    'Photos & Videos',
    NULL,
    'STUDENT'::"PersonType",
    true,
    2,
    NOW()
FROM "organization_application_settings" oas
ON CONFLICT DO NOTHING;

-- Step 3: Add consentItemId column to person_consent (nullable first to allow data migration)
ALTER TABLE "person_consent" ADD COLUMN "consentItemId" TEXT;

-- Step 4: Migrate existing PersonConsent rows — map old consentType to the matching new ConsentItem.
--         We match on name and organizationId (via person -> organization).
UPDATE "person_consent" pc
SET "consentItemId" = ci.id
FROM "person" p
JOIN "consent_item" ci ON ci."organizationId" = p."organizationId"
WHERE pc."personId" = p."id"
  AND pc."consentType" = 'OBSERVATION'::"ConsentType"
  AND ci."name" = 'Observation Sessions';

UPDATE "person_consent" pc
SET "consentItemId" = ci.id
FROM "person" p
JOIN "consent_item" ci ON ci."organizationId" = p."organizationId"
WHERE pc."personId" = p."id"
  AND pc."consentType" = 'TERMS_AND_CONDITIONS'::"ConsentType"
  AND ci."name" = 'Terms & Conditions';

UPDATE "person_consent" pc
SET "consentItemId" = ci.id
FROM "person" p
JOIN "consent_item" ci ON ci."organizationId" = p."organizationId"
WHERE pc."personId" = p."id"
  AND pc."consentType" = 'PHOTO_VIDEO'::"ConsentType"
  AND ci."name" = 'Photos & Videos';

-- Step 5: Delete any PersonConsent rows that could not be mapped (orphaned / no org settings).
--         This is safer than leaving NULLs in a NOT NULL column.
DELETE FROM "person_consent" WHERE "consentItemId" IS NULL;

-- Step 6: Make consentItemId NOT NULL and add FK + index
ALTER TABLE "person_consent" ALTER COLUMN "consentItemId" SET NOT NULL;

ALTER TABLE "person_consent" ADD CONSTRAINT "person_consent_consentItemId_fkey"
    FOREIGN KEY ("consentItemId") REFERENCES "consent_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "person_consent_consentItemId_idx" ON "person_consent"("consentItemId");

-- Step 7: Drop old unique constraint and add new one
DROP INDEX IF EXISTS "person_consent_personId_academicYearId_consentType_key";

CREATE UNIQUE INDEX "person_consent_personId_academicYearId_consentItemId_key"
    ON "person_consent"("personId", "academicYearId", "consentItemId");

-- Step 8: Drop the old consentType column
ALTER TABLE "person_consent" DROP COLUMN "consentType";

-- Step 9: Drop the ConsentType enum (no longer used)
DROP TYPE IF EXISTS "ConsentType";

-- Step 10: Drop consent-related columns from organization_application_settings
ALTER TABLE "organization_application_settings"
    DROP COLUMN IF EXISTS "showObservationConsent",
    DROP COLUMN IF EXISTS "showTermsConsent",
    DROP COLUMN IF EXISTS "showPhotoVideoConsent",
    DROP COLUMN IF EXISTS "observationConsentFormUrl",
    DROP COLUMN IF EXISTS "termsConsentFormUrl",
    DROP COLUMN IF EXISTS "photoVideoConsentFormUrl",
    DROP COLUMN IF EXISTS "enableConsentFileUpload";

-- Step 11: Add FK from form_field.consentItemId -> consent_item (moved from 20260507044002)
ALTER TABLE "form_field" ADD CONSTRAINT "form_field_consentItemId_fkey"
    FOREIGN KEY ("consentItemId") REFERENCES "consent_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
