import { db } from "../client";

export async function getHouseholdsByOrganization(organizationId: string) {
  return db.household.findMany({
    where: { organizationId },
    include: { _count: { select: { people: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getHouseholdById(id: string) {
  return db.household.findUnique({
    where: { id },
    include: { people: true },
  });
}

export async function createHousehold(data: {
  organizationId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
}) {
  return db.household.create({ data });
}

export async function updateHousehold(
  id: string,
  data: Partial<Omit<Parameters<typeof createHousehold>[0], "organizationId">>,
) {
  return db.household.update({ where: { id }, data });
}

export async function deleteHousehold(id: string) {
  return db.household.delete({ where: { id } });
}
