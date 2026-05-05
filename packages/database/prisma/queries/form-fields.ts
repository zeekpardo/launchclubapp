import { db } from "../client";
import type { FormFieldType } from "../generated/enums";

export async function getAreaFormFields(areaId: string) {
  return db.formField.findMany({
    where: { areaId },
    orderBy: { order: "asc" },
  });
}

export async function getSiteFormFields(siteId: string) {
  const site = await db.site.findUnique({
    where: { id: siteId },
    select: { areaId: true },
  });

  const [areaFields, siteFields] = await Promise.all([
    site?.areaId
      ? db.formField.findMany({
          where: { areaId: site.areaId },
          orderBy: { order: "asc" },
        })
      : Promise.resolve([]),
    db.formField.findMany({
      where: { siteId },
      orderBy: { order: "asc" },
    }),
  ]);

  return { areaFields, siteFields };
}

export async function getFormFieldsForApplication(siteId: string) {
  return getSiteFormFields(siteId);
}

export async function getFormFieldsBySiteSlug(siteSlug: string) {
  const site = await db.site.findUnique({
    where: { slug: siteSlug },
    select: { id: true, areaId: true },
  });
  if (!site) return { areaFields: [], siteFields: [] };
  return getSiteFormFields(site.id);
}

export async function createFormField(data: {
  label: string;
  fieldKey: string;
  type: FormFieldType;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: { minLength?: number; maxLength?: number; pattern?: string };
  areaId?: string;
  siteId?: string;
}) {
  const count = await db.formField.count({
    where: {
      ...(data.areaId ? { areaId: data.areaId } : {}),
      ...(data.siteId ? { siteId: data.siteId } : {}),
    },
  });

  return db.formField.create({
    data: {
      ...data,
      order: count + 1,
      options: data.options ?? undefined,
      validation: data.validation ?? undefined,
    },
  });
}

export async function updateFormField(
  id: string,
  data: {
    label?: string;
    fieldKey?: string;
    type?: FormFieldType;
    placeholder?: string;
    helpText?: string;
    required?: boolean;
    options?: { label: string; value: string }[];
    validation?: { minLength?: number; maxLength?: number; pattern?: string };
  },
) {
  return db.formField.update({
    where: { id },
    data: {
      ...data,
      options: data.options ?? undefined,
      validation: data.validation ?? undefined,
    },
  });
}

export async function deleteFormField(id: string) {
  return db.formField.delete({ where: { id } });
}

export async function reorderFormFields(ids: string[]) {
  return db.$transaction(
    ids.map((id, index) =>
      db.formField.update({
        where: { id },
        data: { order: index + 1 },
      }),
    ),
  );
}
