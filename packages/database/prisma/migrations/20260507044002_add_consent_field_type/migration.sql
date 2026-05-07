-- AlterEnum
ALTER TYPE "FormFieldType" ADD VALUE 'CONSENT';

-- AlterTable
ALTER TABLE "form_field" ADD COLUMN     "consentItemId" TEXT;

-- AddForeignKey
ALTER TABLE "form_field" ADD CONSTRAINT "form_field_consentItemId_fkey" FOREIGN KEY ("consentItemId") REFERENCES "consent_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;
