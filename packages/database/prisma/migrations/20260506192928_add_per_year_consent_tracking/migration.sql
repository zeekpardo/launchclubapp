/*
  Warnings:

  - You are about to drop the column `studentIdPrefix` on the `organization_application_settings` table. All the data in the column will be lost.
  - You are about to drop the column `observationConsent` on the `person` table. All the data in the column will be lost.
  - You are about to drop the column `photoVideoConsent` on the `person` table. All the data in the column will be lost.
  - You are about to drop the column `termsConsent` on the `person` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('OBSERVATION', 'TERMS_AND_CONDITIONS', 'PHOTO_VIDEO');

-- AlterTable
ALTER TABLE "custom_field" ADD COLUMN     "folderId" TEXT;

-- AlterTable
ALTER TABLE "organization_application_settings" DROP COLUMN "studentIdPrefix",
ADD COLUMN     "enableConsentFileUpload" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "person" DROP COLUMN "observationConsent",
DROP COLUMN "photoVideoConsent",
DROP COLUMN "termsConsent";

-- CreateTable
CREATE TABLE "custom_field_folder" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEs" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_field_folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_consent" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "signatureFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityType" TEXT,
    "entityId" TEXT,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_field_folder_organizationId_idx" ON "custom_field_folder"("organizationId");

-- CreateIndex
CREATE INDEX "person_consent_personId_idx" ON "person_consent"("personId");

-- CreateIndex
CREATE INDEX "person_consent_academicYearId_idx" ON "person_consent"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "person_consent_personId_academicYearId_consentType_key" ON "person_consent"("personId", "academicYearId", "consentType");

-- CreateIndex
CREATE INDEX "notification_recipientId_isRead_idx" ON "notification"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "notification_organizationId_idx" ON "notification"("organizationId");

-- AddForeignKey
ALTER TABLE "custom_field_folder" ADD CONSTRAINT "custom_field_folder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field" ADD CONSTRAINT "custom_field_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "custom_field_folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_consent" ADD CONSTRAINT "person_consent_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_consent" ADD CONSTRAINT "person_consent_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
