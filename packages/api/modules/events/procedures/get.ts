import { ORPCError } from "@orpc/client";
import { getEventById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getEvent = protectedProcedure
  .route({ method: "GET", path: "/events/{id}", tags: ["Events"] })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const event = await getEventById(input.id);
    if (!event) throw new ORPCError("NOT_FOUND");
    return event;
  });
