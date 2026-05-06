-- CreateTable
CREATE TABLE "person_note" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_note_mention" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "person_note_mention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "person_note_personId_idx" ON "person_note"("personId");

-- CreateIndex
CREATE INDEX "person_note_organizationId_idx" ON "person_note"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "person_note_mention_noteId_userId_key" ON "person_note_mention"("noteId", "userId");

-- AddForeignKey
ALTER TABLE "person_note" ADD CONSTRAINT "person_note_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_note" ADD CONSTRAINT "person_note_personId_fkey" FOREIGN KEY ("personId") REFERENCES "person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_note" ADD CONSTRAINT "person_note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_note_mention" ADD CONSTRAINT "person_note_mention_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "person_note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_note_mention" ADD CONSTRAINT "person_note_mention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
