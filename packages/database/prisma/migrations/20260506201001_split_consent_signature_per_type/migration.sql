/*
  Warnings:

  - You are about to drop the column `consentSignatureFileUrl` on the `application_child` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "application_child" DROP COLUMN "consentSignatureFileUrl",
ADD COLUMN     "observationConsentFileUrl" TEXT,
ADD COLUMN     "photoVideoConsentFileUrl" TEXT,
ADD COLUMN     "termsConsentFileUrl" TEXT;
