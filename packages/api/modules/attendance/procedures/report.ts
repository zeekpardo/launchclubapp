import { ORPCError } from "@orpc/client";
import { getAttendanceRateByGroup, getGroupById, getSiteById, getAreaById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const attendanceReport = protectedProcedure
  .route({ method: "GET", path: "/attendance/report", tags: ["Attendance"] })
  .input(z.object({ groupId: z.string(), since: z.string().datetime().optional() }))
  .handler(async ({ input, context }) => {
    const group = await getGroupById(input.groupId);
    if (!group) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(group.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const rate = await getAttendanceRateByGroup(
      input.groupId,
      input.since ? new Date(input.since) : undefined,
    );
    return { rate };
  });
