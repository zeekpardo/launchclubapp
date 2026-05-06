-- AlterTable
ALTER TABLE "organization_application_settings" ADD COLUMN     "studentIdMode" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "studentIdPrefix" TEXT NOT NULL DEFAULT 'STU';
