-- CreateTable
CREATE TABLE "academic_year" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_year_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academic_year_organizationId_idx" ON "academic_year"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_year_organizationId_label_key" ON "academic_year"("organizationId", "label");

-- AddForeignKey
ALTER TABLE "academic_year" ADD CONSTRAINT "academic_year_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
