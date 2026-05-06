import { ORPCError } from "@orpc/client";
import { createAcademicYear } from "@repo/database";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";
import { createAcademicYearSchema } from "../types";

export const createAcademicYearProcedure = protectedProcedure
  .route({ method: "POST", path: "/academic-years", tags: ["Academic Years"] })
  .input(createAcademicYearSchema)
  .handler(async ({ input, context }) => {
    const membership = await verifyOrganizationMembership(input.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    if (!["owner", "admin"].includes(membership.role)) throw new ORPCError("FORBIDDEN");
    return createAcademicYear({
      organizationId: input.organizationId,
      label: input.label,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      isActive: input.isActive,
    });
  });
