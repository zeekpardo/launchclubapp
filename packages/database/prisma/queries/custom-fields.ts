import { db } from "../client";
import type { CustomFieldType } from "../generated/enums";

export async function getCustomFieldsByOrg(organizationId: string) {
  return db.customField.findMany({
    where: { organizationId },
    orderBy: { order: "asc" },
  });
}

export async function getCustomFieldById(id: string) {
  return db.customField.findUnique({ where: { id } });
}

export async function createCustomField(data: {
  organizationId: string;
  name: string;
  nameEs?: string | null;
  type: CustomFieldType;
  required?: boolean;
  options?: string[];
  order?: number;
}) {
  return db.customField.create({ data });
}

export async function updateCustomField(
  id: string,
  data: Partial<{
    name: string;
    nameEs: string | null;
    type: CustomFieldType;
    required: boolean;
    options: string[];
    order: number;
    collectInApplication: boolean;
  }>,
) {
  return db.customField.update({ where: { id }, data });
}

export async function deleteCustomField(id: string) {
  return db.customField.delete({ where: { id } });
}

export async function reorderCustomFields(ids: string[]) {
  return db.$transaction(
    ids.map((id, index) =>
      db.customField.update({ where: { id }, data: { order: index + 1 } }),
    ),
  );
}

export async function moveCustomField(
  fieldId: string,
  folderId: string | null,
  updatedOrders: { id: string; order: number }[],
) {
  return db.$transaction([
    db.customField.update({
      where: { id: fieldId },
      data: { folderId },
    }),
    ...updatedOrders.map(({ id, order }) =>
      db.customField.update({ where: { id }, data: { order } }),
    ),
  ]);
}

export async function getCollectInApplicationFieldsBySite(siteSlug: string) {
  return db.customField.findMany({
    where: {
      collectInApplication: true,
      organization: {
        areas: { some: { sites: { some: { slug: siteSlug } } } },
      },
    },
    orderBy: { order: "asc" },
  });
}

export async function getCustomFieldValues(personId: string) {
  return db.customFieldValue.findMany({
    where: { personId },
    include: { customField: true },
  });
}

export async function upsertCustomFieldValue(
  customFieldId: string,
  personId: string,
  value: string | null,
) {
  return db.customFieldValue.upsert({
    where: { customFieldId_personId: { customFieldId, personId } },
    create: { customFieldId, personId, value },
    update: { value },
  });
}
