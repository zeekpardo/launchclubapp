import { markNotificationAsRead } from "@repo/database";
import { protectedProcedure } from "../../../orpc/procedures";
import { markAsReadSchema } from "../types";

export const markAsReadProcedure = protectedProcedure
  .route({
    method: "PATCH",
    path: "/notifications/{id}/read",
    tags: ["Notifications"],
  })
  .input(markAsReadSchema)
  .handler(async ({ input, context }) => {
    return markNotificationAsRead(input.id, context.user.id);
  });
