import { db } from "../client";

export async function getPersonNotesByPerson(personId: string) {
  return db.personNote.findMany({
    where: { personId },
    include: {
      author: { select: { id: true, name: true, image: true } },
      mentions: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPersonNoteById(id: string) {
  return db.personNote.findUnique({
    where: { id },
    select: { id: true, personId: true, organizationId: true, authorId: true },
  });
}

export async function createPersonNote(data: {
  personId: string;
  organizationId: string;
  authorId: string;
  body: string;
  mentionUserIds: string[];
}) {
  const { mentionUserIds, ...noteData } = data;
  return db.personNote.create({
    data: {
      ...noteData,
      mentions: {
        create: mentionUserIds.map((userId) => ({ userId })),
      },
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      mentions: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}

export async function updatePersonNote(data: {
  id: string;
  body: string;
  mentionUserIds: string[];
}) {
  const { id, body, mentionUserIds } = data;
  return db.personNote.update({
    where: { id },
    data: {
      body,
      mentions: {
        deleteMany: {},
        create: mentionUserIds.map((userId) => ({ userId })),
      },
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
      mentions: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}

export async function deletePersonNote(id: string) {
  return db.personNote.delete({ where: { id } });
}

export async function getOrganizationMembersForMentions(organizationId: string) {
  return db.member.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { user: { name: "asc" } },
  });
}
