import { db } from "../client";

export async function getAcademicYearsByOrganization(organizationId: string) {
  return db.academicYear.findMany({
    where: { organizationId },
    orderBy: { label: "desc" },
  });
}

export async function getAcademicYearById(id: string) {
  return db.academicYear.findUnique({ where: { id } });
}

export async function createAcademicYear(data: {
  organizationId: string;
  label: string;
  startDate?: Date | null;
  endDate?: Date | null;
  isActive?: boolean;
}) {
  return db.academicYear.create({ data });
}

export async function updateAcademicYear(
  id: string,
  data: {
    label?: string;
    startDate?: Date | null;
    endDate?: Date | null;
    isActive?: boolean;
  },
) {
  return db.academicYear.update({ where: { id }, data });
}

export async function deleteAcademicYear(id: string) {
  return db.academicYear.delete({ where: { id } });
}

export async function deactivateOtherAcademicYears(organizationId: string, exceptId: string) {
  return db.academicYear.updateMany({
    where: { organizationId, id: { not: exceptId }, isActive: true },
    data: { isActive: false },
  });
}
