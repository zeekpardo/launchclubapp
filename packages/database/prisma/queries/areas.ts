import { db } from "../client";

export async function getAreasByOrganization(organizationId: string) {
  return db.area.findMany({
    where: { organizationId },
    include: { _count: { select: { sites: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getAreaById(id: string) {
  return db.area.findUnique({
    where: { id },
    include: { sites: true },
  });
}

export async function createArea(data: {
  organizationId: string;
  name: string;
  description?: string;
}) {
  return db.area.create({ data });
}

export async function updateArea(id: string, data: { name?: string; description?: string }) {
  return db.area.update({ where: { id }, data });
}

export async function deleteArea(id: string) {
  return db.area.delete({ where: { id } });
}
