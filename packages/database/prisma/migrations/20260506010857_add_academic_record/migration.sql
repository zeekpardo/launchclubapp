-- CreateEnum
CREATE TYPE "GpaTerm" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4', 'SEMESTER_1', 'SEMESTER_2', 'TRIMESTER_1', 'TRIMESTER_2', 'TRIMESTER_3', 'ANNUAL');

-- CreateTable
CREATE TABLE "academic_record" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "term" "GpaTerm" NOT NULL,
    "termGpa" DOUBLE PRECISION,
    "cumulativeGpa" DOUBLE PRECISION,
    "gradeLevel" TEXT,
    "gradeScale" DOUBLE PRECISION NOT NULL DEFAULT 4.0,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academic_record_personId_idx" ON "academic_record"("personId");

-- CreateIndex
CREATE INDEX "academic_record_schoolYear_idx" ON "academic_record"("schoolYear");

-- CreateIndex
CREATE UNIQUE INDEX "academic_record_personId_schoolYear_term_key" ON "academic_record"("personId", "schoolYear", "term");

-- AddForeignKey
ALTER TABLE "academic_record" ADD CONSTRAINT "academic_record_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_record" ADD CONSTRAINT "academic_record_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
