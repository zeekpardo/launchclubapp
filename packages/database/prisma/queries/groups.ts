import { db } from "../client";

export async function getGroupsBySite(siteId: string) {
  return db.group.findMany({
    where: { siteId },
    include: { _count: { select: { personGroups: true, events: true } } },
    orderBy: { name: "asc" },
  });
}

const groupListInclude = {
  site: { include: { area: true } },
  _count: { select: { personGroups: { where: { role: "MEMBER" } } } },
  personGroups: {
    where: { role: "LEADER" },
    include: { person: { select: { firstName: true, lastName: true } } },
    take: 1,
  },
} as const;

export async function getGroupsByOrganization(organizationId: string) {
  return db.group.findMany({
    where: { site: { area: { organizationId } } },
    include: groupListInclude,
    orderBy: { name: "asc" },
  });
}

export async function getGroupById(id: string) {
  return db.group.findUnique({
    where: { id },
    include: {
      site: { include: { area: true } },
      personGroups: {
        include: {
          person: {
            include: {
              guardians: {
                include: {
                  person: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function createGroup(data: {
  siteId: string;
  name: string;
  description?: string;
  gradeLevel?: string;
  startDate?: Date;
  endDate?: Date;
  meetingDay?: string;
  meetingTime?: string;
  meetingEndTime?: string;
  meetingRecurrence?: string;
}) {
  return db.group.create({ data });
}

export async function updateGroup(
  id: string,
  data: Partial<Omit<Parameters<typeof createGroup>[0], "siteId">>,
) {
  return db.group.update({ where: { id }, data });
}

export async function deleteGroup(id: string) {
  return db.group.delete({ where: { id } });
}

export async function addPersonToGroup(personId: string, groupId: string, role = "MEMBER") {
  return db.personGroup.upsert({
    where: { personId_groupId: { personId, groupId } },
    create: { personId, groupId, role },
    update: { role },
  });
}

export async function removePersonFromGroup(personId: string, groupId: string) {
  return db.personGroup.delete({ where: { personId_groupId: { personId, groupId } } });
}

export async function countGroupsByOrganization(organizationId: string) {
  return db.group.count({ where: { site: { area: { organizationId } } } });
}

export async function getGroupsByUserSites(userId: string) {
  return db.group.findMany({
    where: { site: { userSites: { some: { userId } } } },
    include: groupListInclude,
    orderBy: { name: "asc" },
  });
}

export async function getGroupsByUserGroups(userId: string) {
  return db.group.findMany({
    where: { userGroups: { some: { userId } } },
    include: groupListInclude,
    orderBy: { name: "asc" },
  });
}

export async function getUserGroupIds(userId: string): Promise<string[]> {
  const userGroups = await db.userGroup.findMany({
    where: { userId },
    select: { groupId: true },
  });
  return userGroups.map((ug) => ug.groupId);
}

export async function getUserSiteIds(userId: string): Promise<string[]> {
  const userSites = await db.userSite.findMany({
    where: { userId },
    select: { siteId: true },
  });
  return userSites.map((us) => us.siteId);
}
