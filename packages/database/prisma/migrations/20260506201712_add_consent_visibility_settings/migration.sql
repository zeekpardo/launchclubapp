-- AlterTable
ALTER TABLE "organization_application_settings" ADD COLUMN     "showObservationConsent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showPhotoVideoConsent" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showTermsConsent" BOOLEAN NOT NULL DEFAULT true;
