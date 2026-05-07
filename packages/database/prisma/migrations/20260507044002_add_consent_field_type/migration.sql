-- AlterEnum (IF NOT EXISTS handles re-run after partial apply)
ALTER TYPE "FormFieldType" ADD VALUE IF NOT EXISTS 'CONSENT';

-- AlterTable (IF NOT EXISTS handles re-run after partial apply)
ALTER TABLE "form_field" ADD COLUMN IF NOT EXISTS "consentItemId" TEXT;

-- FK moved to 20260507100000_add_consent_items where consent_item table is created
