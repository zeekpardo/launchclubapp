import { type EventType } from "../generated/enums";
import { db } from "../client";

interface EventData {
  groupIds: string[];
  name: string;
  description?: string;
  eventType?: EventType;
  guestName?: string;
  guestCompany?: string;
  guestIndustry?: string;
  startsAt: Date;
  endsAt?: Date;
}

const eventGroupInclude = {
  _count: { select: { attendance: true } },
  eventGroups: {
    include: {
      group: {
        select: {
          id: true,
          name: true,
          _count: { select: { personGroups: true } },
        },
      },
    },
  },
} as const;

export async function getEventsByGroup(groupId: string) {
  return db.event.findMany({
    where: { eventGroups: { some: { groupId } } },
    include: eventGroupInclude,
    orderBy: { startsAt: "desc" },
  });
}

export async function getEventById(id: string) {
  return db.event.findUnique({
    where: { id },
    include: {
      eventGroups: { include: { group: true } },
      attendance: { include: { person: true } },
    },
  });
}

export async function createEvent(data: EventData) {
  const { groupIds, ...eventData } = data;
  return db.$transaction(async (tx) => {
    const event = await tx.event.create({ data: eventData });
    if (groupIds.length > 0) {
      await tx.eventGroup.createMany({
        data: groupIds.map((groupId) => ({ eventId: event.id, groupId })),
        skipDuplicates: true,
      });
    }
    return event;
  });
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<EventData, "groupIds">>,
) {
  return db.event.update({ where: { id }, data });
}

export async function deleteEvent(id: string) {
  return db.event.delete({ where: { id } });
}

export async function getEventsByOrganization(
  organizationId: string,
  filters?: { areaId?: string; siteId?: string; groupIds?: string[]; siteIds?: string[] },
) {
  const groupWhere = filters?.groupIds
    ? { id: { in: filters.groupIds } }
    : filters?.siteIds
      ? { siteId: { in: filters.siteIds } }
      : undefined;

  const siteWhere = filters?.siteId
    ? { id: filters.siteId }
    : filters?.areaId
      ? { area: { id: filters.areaId } }
      : { area: { organizationId } };

  return db.event.findMany({
    where: {
      eventGroups: {
        some: {
          group: groupWhere
            ? { ...groupWhere }
            : { site: siteWhere },
        },
      },
    },
    include: eventGroupInclude,
    orderBy: { startsAt: "desc" },
  });
}

export async function syncEventGroups(eventId: string, groupIds: string[]) {
  return db.$transaction([
    db.eventGroup.deleteMany({ where: { eventId } }),
    db.eventGroup.createMany({
      data: groupIds.map((groupId) => ({ eventId, groupId })),
      skipDuplicates: true,
    }),
  ]);
}

export async function batchCreateEvents(events: EventData[]) {
  return db.$transaction(async (tx) => {
    let count = 0;
    for (const { groupIds, ...eventData } of events) {
      const event = await tx.event.create({ data: eventData });
      if (groupIds.length > 0) {
        await tx.eventGroup.createMany({
          data: groupIds.map((groupId) => ({ eventId: event.id, groupId })),
          skipDuplicates: true,
        });
      }
      count++;
    }
    return { count };
  });
}
