import { db } from "../client";

export async function getApplicationsBySite(siteId: string, status?: string) {
  return db.application.findMany({
    where: { siteId, ...(status ? { status } : {}) },
    include: { site: { include: { area: true } }, children: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApplicationsByOrganization(organizationId: string, status?: string) {
  return db.application.findMany({
    where: { site: { area: { organizationId } }, ...(status ? { status } : {}) },
    include: { site: { include: { area: true } }, children: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getApplicationById(id: string) {
  return db.application.findUnique({
    where: { id },
    include: {
      site: { include: { area: true } },
      children: {
        include: {
          profileFieldValues: { include: { customField: true }, orderBy: { customField: { order: "asc" } } },
          formFieldValues: { include: { formField: true }, orderBy: { formField: { order: "asc" } } },
        },
      },
      customFieldValues: { include: { formField: true }, orderBy: { formField: { order: "asc" } } },
      profileFieldValues: { include: { customField: true }, orderBy: { customField: { order: "asc" } } },
    },
  });
}

export async function createApplication(data: {
  siteId: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail?: string;
  parentPhone?: string;
  parentAddressLine1?: string;
  parentCity?: string;
  parentStateProvince?: string;
  parentPostalCode?: string;
  parentCountry?: string;
  spouseFirstName?: string;
  spouseLastName?: string;
  spouseEmail?: string;
  spousePhone?: string;
  children?: {
    firstName: string;
    lastName: string;
    birthday?: Date;
    grade?: string;
    isPartOfChurch?: boolean;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactEmail?: string;
    observationConsent?: boolean;
    termsConsent?: boolean;
    photoVideoConsent?: boolean;
    photoUrl?: string;
    observationConsentFileUrl?: string;
    termsConsentFileUrl?: string;
    photoVideoConsentFileUrl?: string;
    profileFieldValues?: { customFieldId: string; value: string }[];
    formFieldValues?: { formFieldId: string; value: string }[];
  }[];
  customFieldValues?: { formFieldId: string; value: string }[];
  profileFieldValues?: { customFieldId: string; value: string }[];
}) {
  const { children, customFieldValues, profileFieldValues, ...applicationData } = data;
  return db.application.create({
    data: {
      ...applicationData,
      children: children?.length
        ? {
            create: children.map(({ profileFieldValues: childPfv, formFieldValues: childFfv, ...child }) => ({
              ...child,
              ...(childPfv?.length ? { profileFieldValues: { create: childPfv } } : {}),
              ...(childFfv?.length ? { formFieldValues: { create: childFfv } } : {}),
            })),
          }
        : undefined,
      customFieldValues: customFieldValues?.length
        ? { create: customFieldValues }
        : undefined,
      profileFieldValues: profileFieldValues?.length
        ? { create: profileFieldValues }
        : undefined,
    },
    include: {
      children: true,
      customFieldValues: { include: { formField: true } },
      profileFieldValues: { include: { customField: true } },
    },
  });
}

export async function reviewApplication(
  id: string,
  status: string,
  reviewedBy: string,
) {
  return db.application.update({
    where: { id },
    data: { status, reviewedBy, reviewedAt: new Date() },
  });
}

export async function migrateApplicationToPeople(
  applicationId: string,
  organizationId: string,
  groupAssignments?: { applicationChildId: string; groupId: string }[],
) {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: { children: { include: { profileFieldValues: true } }, profileFieldValues: true },
  });
  if (!application) throw new Error("Application not found");

  return db.$transaction(async (tx) => {
    // 1. Household
    const household = await tx.household.create({
      data: {
        organizationId,
        name: `${application.parentLastName} Family`,
        addressLine1: application.parentAddressLine1 ?? undefined,
        city: application.parentCity ?? undefined,
        stateProvince: application.parentStateProvince ?? undefined,
        postalCode: application.parentPostalCode ?? undefined,
        country: application.parentCountry ?? undefined,
        phone: application.parentPhone ?? undefined,
        email: application.parentEmail ?? undefined,
      },
    });

    // 2. Parent
    const parent = await tx.person.create({
      data: {
        organizationId,
        householdId: household.id,
        firstName: application.parentFirstName,
        lastName: application.parentLastName,
        email: application.parentEmail ?? undefined,
        phone: application.parentPhone ?? undefined,
        personType: "PARENT",
      },
    });

    // 3. Spouse (optional)
    let spouse: { id: string } | null = null;
    if (application.spouseFirstName) {
      spouse = await tx.person.create({
        data: {
          organizationId,
          householdId: household.id,
          firstName: application.spouseFirstName,
          lastName: application.spouseLastName ?? application.parentLastName,
          email: application.spouseEmail ?? undefined,
          phone: application.spousePhone ?? undefined,
          personType: "PARENT",
        },
      });
    }

    // 4. Children + guardian links
    for (const child of application.children) {
      const childPerson = await tx.person.create({
        data: {
          organizationId,
          householdId: household.id,
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: child.birthday ?? undefined,
          grade: child.grade ?? undefined,
          personType: "STUDENT",
        },
      });

      await tx.guardian.create({ data: { personId: parent.id, kidId: childPerson.id } });

      if (spouse) {
        await tx.guardian.create({ data: { personId: spouse.id, kidId: childPerson.id } });
      }

      const childGroupId = groupAssignments?.find(
        (a) => a.applicationChildId === child.id,
      )?.groupId;
      if (childGroupId) {
        await tx.personGroup.create({ data: { personId: childPerson.id, groupId: childGroupId, role: "MEMBER" } });
      }

      // Write profile field values to the child's record (per-child values take priority)
      const pfvSource = child.profileFieldValues.length
        ? child.profileFieldValues
        : application.profileFieldValues;
      for (const pfv of pfvSource) {
        await tx.customFieldValue.upsert({
          where: { customFieldId_personId: { customFieldId: pfv.customFieldId, personId: childPerson.id } },
          create: { customFieldId: pfv.customFieldId, personId: childPerson.id, value: pfv.value },
          update: { value: pfv.value },
        });
      }
    }

    return household;
  });
}

export async function getAllApplications({ limit, offset, query }: { limit: number; offset: number; query?: string }) {
  return db.application.findMany({
    where: query
      ? {
          OR: [
            { parentFirstName: { contains: query, mode: "insensitive" } },
            { parentLastName: { contains: query, mode: "insensitive" } },
            { parentEmail: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { site: { include: { area: { include: { organization: true } } } }, children: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function countAllApplications({ query }: { query?: string }) {
  return db.application.count({
    where: query
      ? {
          OR: [
            { parentFirstName: { contains: query, mode: "insensitive" } },
            { parentLastName: { contains: query, mode: "insensitive" } },
            { parentEmail: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
  });
}

export async function getApplicationsByUserSites(userId: string, status?: string) {
  return db.application.findMany({
    where: { site: { userSites: { some: { userId } } }, ...(status ? { status } : {}) },
    include: { site: { include: { area: true } }, children: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function countRecentApplicationsByEmail(email: string, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  return db.application.count({
    where: { parentEmail: email, createdAt: { gte: since } },
  });
}

export async function countRecentApplicationsBySite(siteId: string, windowMs: number) {
  const since = new Date(Date.now() - windowMs);
  return db.application.count({
    where: { siteId, createdAt: { gte: since } },
  });
}

export async function countRecentApplications(organizationId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return db.application.findMany({
    where: { site: { area: { organizationId } }, createdAt: { gte: since } },
    include: { site: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}
