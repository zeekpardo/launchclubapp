import { db } from "../client";

export async function getAttendanceByGroup(groupId: string, since?: Date, until?: Date) {
  return db.attendance.findMany({
    where: {
      event: {
        groupId,
        ...(since || until ? {
          startsAt: {
            ...(since ? { gte: since } : {}),
            ...(until ? { lte: until } : {}),
          },
        } : {}),
      },
    },
    include: { person: true, event: true },
    orderBy: [{ event: { startsAt: "asc" } }],
  });
}

export async function getAttendanceByEvent(eventId: string) {
  return db.attendance.findMany({
    where: { eventId },
    include: { person: true },
    orderBy: [{ person: { lastName: "asc" } }, { person: { firstName: "asc" } }],
  });
}

export async function upsertAttendance(data: {
  eventId: string;
  personId: string;
  status: string;
  notes?: string;
}) {
  return db.attendance.upsert({
    where: { eventId_personId: { eventId: data.eventId, personId: data.personId } },
    create: data,
    update: { status: data.status, notes: data.notes },
  });
}

export async function batchUpsertAttendance(
  records: Array<{ eventId: string; personId: string; status: string; notes?: string }>,
) {
  return Promise.all(records.map((r) => upsertAttendance(r)));
}

export async function getAttendanceRateByGroup(groupId: string, since?: Date): Promise<number> { // returns 0–1 fraction
  const events = await db.event.findMany({
    where: {
      eventGroups: { some: { groupId } },
      ...(since ? { startsAt: { gte: since } } : {}),
    },
    include: {
      attendance: true,
      eventGroups: {
        where: { groupId },
        include: { group: { include: { personGroups: true } } },
      },
    },
  });

  if (!events.length) return 0;

  let totalExpected = 0;
  let totalPresent = 0;

  for (const event of events) {
    const group = event.eventGroups[0]?.group;
    const memberCount = group?.personGroups.filter((pg) => pg.role === "MEMBER").length ?? 0;
    const presentCount = event.attendance.filter((a) => a.status === "PRESENT").length;
    totalExpected += memberCount;
    totalPresent += presentCount;
  }

  return totalExpected === 0 ? 0 : totalPresent / totalExpected;
}
