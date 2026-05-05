-- Add HEADER value to FormFieldType enum if not already present
DO $$ BEGIN
  ALTER TYPE "FormFieldType" ADD VALUE IF NOT EXISTS 'HEADER';
EXCEPTION WHEN others THEN null;
END $$;

-- Drop FK before altering groupId nullability on event
ALTER TABLE "event" DROP CONSTRAINT IF EXISTS "event_groupId_fkey";

-- Make groupId nullable on event
ALTER TABLE "event" ALTER COLUMN "groupId" DROP NOT NULL;

-- Restore FK with SET NULL on delete
DO $$ BEGIN
  ALTER TABLE "event" ADD CONSTRAINT "event_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- site: drop old address columns, add internationalized ones
ALTER TABLE "site" DROP COLUMN IF EXISTS "address";
ALTER TABLE "site" DROP COLUMN IF EXISTS "state";
ALTER TABLE "site" DROP COLUMN IF EXISTS "zipCode";
ALTER TABLE "site" ADD COLUMN IF NOT EXISTS "addressLine1" TEXT;
ALTER TABLE "site" ADD COLUMN IF NOT EXISTS "stateProvince" TEXT;
ALTER TABLE "site" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "site" ADD COLUMN IF NOT EXISTS "country" TEXT;

-- household: same address field swap
ALTER TABLE "household" DROP COLUMN IF EXISTS "address";
ALTER TABLE "household" DROP COLUMN IF EXISTS "state";
ALTER TABLE "household" DROP COLUMN IF EXISTS "zipCode";
ALTER TABLE "household" ADD COLUMN IF NOT EXISTS "addressLine1" TEXT;
ALTER TABLE "household" ADD COLUMN IF NOT EXISTS "stateProvince" TEXT;
ALTER TABLE "household" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "household" ADD COLUMN IF NOT EXISTS "country" TEXT;

-- person: add status and consent fields
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "observationConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "termsConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "photoVideoConsent" BOOLEAN NOT NULL DEFAULT false;

-- application: replace single parentAddress with separate fields
ALTER TABLE "application" DROP COLUMN IF EXISTS "parentAddress";
ALTER TABLE "application" ADD COLUMN IF NOT EXISTS "parentAddressLine1" TEXT;
ALTER TABLE "application" ADD COLUMN IF NOT EXISTS "parentCity" TEXT;
ALTER TABLE "application" ADD COLUMN IF NOT EXISTS "parentStateProvince" TEXT;
ALTER TABLE "application" ADD COLUMN IF NOT EXISTS "parentPostalCode" TEXT;
ALTER TABLE "application" ADD COLUMN IF NOT EXISTS "parentCountry" TEXT;

-- purchase_request: replace single-item fields with name + items relation
ALTER TABLE "purchase_request" DROP COLUMN IF EXISTS "item";
ALTER TABLE "purchase_request" DROP COLUMN IF EXISTS "url";
ALTER TABLE "purchase_request" DROP COLUMN IF EXISTS "amount";
ALTER TABLE "purchase_request" DROP COLUMN IF EXISTS "category";
ALTER TABLE "purchase_request" DROP COLUMN IF EXISTS "justification";
ALTER TABLE "purchase_request" ADD COLUMN IF NOT EXISTS "due_date" TIMESTAMP(3);
-- Add name as nullable first to avoid NOT NULL violation on existing rows
ALTER TABLE "purchase_request" ADD COLUMN IF NOT EXISTS "name" TEXT;
UPDATE "purchase_request" SET "name" = 'Untitled Request' WHERE "name" IS NULL;
ALTER TABLE "purchase_request" ALTER COLUMN "name" SET NOT NULL;
-- Ensure description is NOT NULL (backfill NULLs before constraining)
UPDATE "purchase_request" SET "description" = '' WHERE "description" IS NULL;
ALTER TABLE "purchase_request" ALTER COLUMN "description" SET NOT NULL;

-- event_group join table
CREATE TABLE IF NOT EXISTS "event_group" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    CONSTRAINT "event_group_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "event_group_eventId_idx" ON "event_group"("eventId");
CREATE INDEX IF NOT EXISTS "event_group_groupId_idx" ON "event_group"("groupId");
CREATE UNIQUE INDEX IF NOT EXISTS "event_group_eventId_groupId_key" ON "event_group"("eventId", "groupId");
DO $$ BEGIN
  ALTER TABLE "event_group" ADD CONSTRAINT "event_group_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "event_group" ADD CONSTRAINT "event_group_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- application_child_form_field_value table
CREATE TABLE IF NOT EXISTS "application_child_form_field_value" (
    "id" TEXT NOT NULL,
    "applicationChildId" TEXT NOT NULL,
    "formFieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "application_child_form_field_value_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "application_child_form_field_value_applicationChildId_idx"
    ON "application_child_form_field_value"("applicationChildId");
CREATE UNIQUE INDEX IF NOT EXISTS "application_child_form_field_value_applicationChildId_formF_key"
    ON "application_child_form_field_value"("applicationChildId", "formFieldId");
DO $$ BEGIN
  ALTER TABLE "application_child_form_field_value" ADD CONSTRAINT "application_child_form_field_value_applicationChildId_fkey"
    FOREIGN KEY ("applicationChildId") REFERENCES "application_child"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE "application_child_form_field_value" ADD CONSTRAINT "application_child_form_field_value_formFieldId_fkey"
    FOREIGN KEY ("formFieldId") REFERENCES "form_field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- purchase_request_item table
CREATE TABLE IF NOT EXISTS "purchase_request_item" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "url" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "purchase_request_item_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "purchase_request_item_purchaseRequestId_idx"
    ON "purchase_request_item"("purchaseRequestId");
DO $$ BEGIN
  ALTER TABLE "purchase_request_item" ADD CONSTRAINT "purchase_request_item_purchaseRequestId_fkey"
    FOREIGN KEY ("purchaseRequestId") REFERENCES "purchase_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
