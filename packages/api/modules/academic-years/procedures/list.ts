import { getAcademicYearsByOrganization } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { listAcademicYearsSchema } from "../types";

export const listAcademicYearsProcedure = protectedProcedure
  .route({ method: "GET", path: "/academic-years", tags: ["Academic Years"] })
  .input(listAcademicYearsSchema)
  .handler(async ({ input, context }) => {
    await verifyOrganizationMembership(input.organizationId, context.user.id);
    return getAcademicYearsByOrganization(input.organizationId);
  });
