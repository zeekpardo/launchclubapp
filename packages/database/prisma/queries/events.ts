import { type EventType } from "../generated/enums";
import { db } from "../client";

interface EventData {
  groupId: string;
  name: string;
  description?: string;
  eventType?: EventType;
  guestName?: string;
  guestCompany?: string;
  guestIndustry?: string;
  startsAt: Date;
  endsAt?: Date;
}

export async function getEventsByGroup(groupId: string) {
  return db.event.findMany({
    where: { groupId },
    include: {
      _count: { select: { attendance: true } },
      group: { select: { id: true, name: true, _count: { select: { personGroups: true } } } },
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function getEventById(id: string) {
  return db.event.findUnique({
    where: { id },
    include: { group: true, attendance: { include: { person: true } } },
  });
}

export async function createEvent(data: EventData) {
  return db.event.create({ data });
}

export async function updateEvent(
  id: string,
  data: Partial<Omit<EventData, "groupId">>,
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
  // Scope filter: groupIds > siteIds > siteId/areaId UI filter > org-wide
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
      group: groupWhere
        ? { ...groupWhere }
        : { site: siteWhere },
    },
    include: {
      _count: { select: { attendance: true } },
      group: { select: { id: true, name: true, _count: { select: { personGroups: true } } } },
    },
    orderBy: { startsAt: "desc" },
  });
}

export async function batchCreateEvents(events: EventData[]) {
  return db.event.createMany({ data: events });
}
