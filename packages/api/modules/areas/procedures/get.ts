import { ORPCError } from "@orpc/client";
import { getAreaById } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { protectedProcedure } from "../../../orpc/procedures";

export const getArea = protectedProcedure
  .route({ method: "GET", path: "/areas/{id}", tags: ["Areas"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    const area = await getAreaById(input.id);
    if (!area) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(area.organizationId, context.user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");
    return area;
  });
