-- AlterTable
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "allergies" TEXT;
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "medicalNotes" TEXT;
