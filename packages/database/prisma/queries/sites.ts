import { db } from "../client";

export async function getSitesByArea(areaId: string) {
  return db.site.findMany({
    where: { areaId },
    include: { _count: { select: { groups: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getSitesByOrganization(organizationId: string) {
  return db.site.findMany({
    where: { area: { organizationId } },
    include: { area: true, _count: { select: { groups: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getSiteById(id: string) {
  return db.site.findUnique({
    where: { id },
    include: { area: true, groups: true },
  });
}

export async function getSiteBySlug(slug: string) {
  return db.site.findUnique({ where: { slug }, include: { area: { select: { organizationId: true } } } });
}

export async function getSitesByUser(userId: string) {
  return db.site.findMany({
    where: { userSites: { some: { userId } } },
    include: { area: true, _count: { select: { groups: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createSite(data: {
  areaId: string;
  name: string;
  slug: string;
  addressLine1?: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  acceptApplications?: boolean;
  applicationDeadline?: Date | null;
}) {
  return db.site.create({ data });
}

export async function updateSite(
  id: string,
  data: Partial<Omit<Parameters<typeof createSite>[0], "areaId">>,
) {
  return db.site.update({ where: { id }, data });
}

export async function deleteSite(id: string) {
  return db.site.delete({ where: { id } });
}

export async function addUserToSite(userId: string, siteId: string) {
  return db.userSite.upsert({
    where: { userId_siteId: { userId, siteId } },
    create: { userId, siteId },
    update: {},
  });
}

export async function removeUserFromSite(userId: string, siteId: string) {
  return db.userSite.delete({ where: { userId_siteId: { userId, siteId } } });
}
