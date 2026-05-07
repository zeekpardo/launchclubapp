/*
  Warnings:

  - You are about to drop the column `areaId` on the `form_field` table. All the data in the column will be lost.
  - You are about to drop the column `siteId` on the `form_field` table. All the data in the column will be lost.
  - You are about to drop the column `isChild` on the `person` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('STUDENT', 'PARENT', 'MENTOR');

-- CreateEnum
CREATE TYPE "FormType" AS ENUM ('STUDENT', 'MENTOR');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('PUBLISHED', 'UNPUBLISHED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FormFieldType" ADD VALUE 'PROFILE';
ALTER TYPE "FormFieldType" ADD VALUE 'CUSTOM';
ALTER TYPE "FormFieldType" ADD VALUE 'SITE_SELECTOR';

-- DropForeignKey
ALTER TABLE "form_field" DROP CONSTRAINT "form_field_areaId_fkey";

-- DropForeignKey
ALTER TABLE "form_field" DROP CONSTRAINT "form_field_siteId_fkey";

-- DropIndex
DROP INDEX "form_field_areaId_idx";

-- DropIndex
DROP INDEX "form_field_siteId_idx";

-- AlterTable
ALTER TABLE "form_field" DROP COLUMN "areaId",
DROP COLUMN "siteId",
ADD COLUMN     "customFieldId" TEXT,
ADD COLUMN     "formId" TEXT,
ADD COLUMN     "profileFieldKey" TEXT,
ADD COLUMN     "targetPersonType" "PersonType";

-- AlterTable
ALTER TABLE "organization_application_settings" ADD COLUMN     "enableMentorDocumentUpload" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mentorContractUrl" TEXT,
ADD COLUMN     "mentorSecurityClearanceUrl" TEXT,
ADD COLUMN     "showMentorContract" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showMentorSecurityClearance" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "person" DROP COLUMN "isChild",
ADD COLUMN     "personType" "PersonType" NOT NULL DEFAULT 'STUDENT';

-- CreateTable
CREATE TABLE "form" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "FormType" NOT NULL,
    "status" "FormStatus" NOT NULL DEFAULT 'UNPUBLISHED',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_site" (
    "formId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "form_site_pkey" PRIMARY KEY ("formId","siteId")
);

-- CreateTable
CREATE TABLE "mentor_application" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "siteId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "addressLine1" TEXT,
    "city" TEXT,
    "stateProvince" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "mentorContractFileUrl" TEXT,
    "mentorSecurityClearanceFileUrl" TEXT,
    "assignedGroupId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_application_form_field_value" (
    "id" TEXT NOT NULL,
    "mentorApplicationId" TEXT NOT NULL,
    "formFieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_application_form_field_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentor_application_custom_field_value" (
    "id" TEXT NOT NULL,
    "mentorApplicationId" TEXT NOT NULL,
    "customFieldId" TEXT NOT NULL,
    "value" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentor_application_custom_field_value_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_organizationId_idx" ON "form"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "form_organizationId_slug_key" ON "form"("organizationId", "slug");

-- CreateIndex
CREATE INDEX "mentor_application_organizationId_idx" ON "mentor_application"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_application_organizationId_email_key" ON "mentor_application"("organizationId", "email");

-- CreateIndex
CREATE INDEX "mentor_application_form_field_value_mentorApplicationId_idx" ON "mentor_application_form_field_value"("mentorApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_application_form_field_value_mentorApplicationId_for_key" ON "mentor_application_form_field_value"("mentorApplicationId", "formFieldId");

-- CreateIndex
CREATE INDEX "mentor_application_custom_field_value_mentorApplicationId_idx" ON "mentor_application_custom_field_value"("mentorApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_application_custom_field_value_mentorApplicationId_c_key" ON "mentor_application_custom_field_value"("mentorApplicationId", "customFieldId");

-- CreateIndex
CREATE INDEX "form_field_formId_idx" ON "form_field"("formId");

-- AddForeignKey
ALTER TABLE "form" ADD CONSTRAINT "form_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_site" ADD CONSTRAINT "form_site_formId_fkey" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_site" ADD CONSTRAINT "form_site_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_field" ADD CONSTRAINT "form_field_formId_fkey" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_field" ADD CONSTRAINT "form_field_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_field"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_application" ADD CONSTRAINT "mentor_application_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_application" ADD CONSTRAINT "mentor_application_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_application_form_field_value" ADD CONSTRAINT "mentor_application_form_field_value_mentorApplicationId_fkey" FOREIGN KEY ("mentorApplicationId") REFERENCES "mentor_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_application_form_field_value" ADD CONSTRAINT "mentor_application_form_field_value_formFieldId_fkey" FOREIGN KEY ("formFieldId") REFERENCES "form_field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_application_custom_field_value" ADD CONSTRAINT "mentor_application_custom_field_value_mentorApplicationId_fkey" FOREIGN KEY ("mentorApplicationId") REFERENCES "mentor_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_application_custom_field_value" ADD CONSTRAINT "mentor_application_custom_field_value_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "custom_field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
