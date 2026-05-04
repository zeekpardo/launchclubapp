import { ORPCError } from "@orpc/client";
import { batchUpsertAttendance, getEventById, getSiteById, getAreaById, getUserSiteIds } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { canAccessSite, canManageGroup } from "../../organizations/lib/site-access";
import { protectedProcedure } from "../../../orpc/procedures";

const attendanceRecordSchema = z.object({
  eventId: z.string().max(36),
  personId: z.string().max(36),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  notes: z.string().max(1000).optional(),
});

export const recordAttendance = protectedProcedure
  .route({ method: "POST", path: "/attendance/batch", tags: ["Attendance"] })
  .input(z.object({ records: z.array(attendanceRecordSchema).max(500) }))
  .handler(async ({ input, context }) => {
    if (input.records.length === 0) return batchUpsertAttendance(input.records);
    const eventId = input.records[0].eventId;
    const event = await getEventById(eventId);
    if (!event) throw new ORPCError("NOT_FOUND");
    const firstGroup = event.eventGroups[0]?.group;
    if (!firstGroup) throw new ORPCError("NOT_FOUND");
    const site = await getSiteById(firstGroup.siteId);
    if (!site) throw new ORPCError("NOT_FOUND");
    const area = await getAreaById(site.areaId);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    const isOwner = membership.role === "owner" || membership.role === "admin" || context.user.role === "admin";
    if (!isOwner) {
      const userSiteIds = await getUserSiteIds(context.user.id);
      if (userSiteIds.length > 0) {
        if (!(await canAccessSite(context.user.id, firstGroup.siteId))) throw new ORPCError("FORBIDDEN");
      } else {
        if (!(await canManageGroup(context.user.id, firstGroup.id))) throw new ORPCError("FORBIDDEN");
      }
    }
    return batchUpsertAttendance(input.records);
  });
