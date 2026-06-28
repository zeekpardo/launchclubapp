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
    // Dedup-aware: a form submission may already have created these people on
    // submit, so reuse existing records (by email / household + name) rather
    // than creating duplicates. This makes approval-migration idempotent.

    // 1. Parent (+ household) — reuse existing parent by email when possible
    const existingParent = application.parentEmail
      ? await tx.person.findFirst({
          where: { organizationId, email: application.parentEmail, personType: "PARENT" },
        })
      : null;

    let parent: { id: string };
    let householdId: string;

    if (existingParent) {
      parent = existingParent;
      if (existingParent.householdId) {
        householdId = existingParent.householdId;
      } else {
        const household = await tx.household.create({
          data: { organizationId, name: `${application.parentLastName} Family` },
        });
        householdId = household.id;
        await tx.person.update({ where: { id: existingParent.id }, data: { householdId } });
      }
    } else {
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
      householdId = household.id;
      parent = await tx.person.create({
        data: {
          organizationId,
          householdId,
          firstName: application.parentFirstName,
          lastName: application.parentLastName,
          email: application.parentEmail ?? undefined,
          phone: application.parentPhone ?? undefined,
          personType: "PARENT",
        },
      });
    }

    // 2. Spouse (optional) — reuse by email, else create
    let spouse: { id: string } | null = null;
    if (application.spouseFirstName) {
      const existingSpouse = application.spouseEmail
        ? await tx.person.findFirst({
            where: { organizationId, email: application.spouseEmail, personType: "PARENT" },
          })
        : null;
      spouse =
        existingSpouse ??
        (await tx.person.create({
          data: {
            organizationId,
            householdId,
            firstName: application.spouseFirstName,
            lastName: application.spouseLastName ?? application.parentLastName,
            email: application.spouseEmail ?? undefined,
            phone: application.spousePhone ?? undefined,
            personType: "PARENT",
          },
        }));
    }

    // 3. Children + guardian links — reuse existing student in the household
    for (const child of application.children) {
      const existingChild = await tx.person.findFirst({
        where: {
          organizationId,
          householdId,
          firstName: { equals: child.firstName, mode: "insensitive" },
          lastName: { equals: child.lastName, mode: "insensitive" },
          personType: "STUDENT",
          ...(child.birthday ? { dateOfBirth: child.birthday } : {}),
        },
      });

      const childPerson =
        existingChild ??
        (await tx.person.create({
          data: {
            organizationId,
            householdId,
            firstName: child.firstName,
            lastName: child.lastName,
            dateOfBirth: child.birthday ?? undefined,
            grade: child.grade ?? undefined,
            personType: "STUDENT",
          },
        }));

      await tx.guardian.upsert({
        where: { personId_kidId: { personId: parent.id, kidId: childPerson.id } },
        create: { personId: parent.id, kidId: childPerson.id },
        update: {},
      });

      if (spouse) {
        await tx.guardian.upsert({
          where: { personId_kidId: { personId: spouse.id, kidId: childPerson.id } },
          create: { personId: spouse.id, kidId: childPerson.id },
          update: {},
        });
      }

      const childGroupId = groupAssignments?.find(
        (a) => a.applicationChildId === child.id,
      )?.groupId;
      if (childGroupId) {
        await tx.personGroup.upsert({
          where: { personId_groupId: { personId: childPerson.id, groupId: childGroupId } },
          create: { personId: childPerson.id, groupId: childGroupId, role: "MEMBER" },
          update: {},
        });
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

    return { householdId, parentId: parent.id };
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
