import { removeGuardian } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const removeGuardianProcedure = protectedProcedure
  .route({ method: "DELETE", path: "/guardians", tags: ["Guardians"] })
  .input(z.object({ personId: z.string(), kidId: z.string() }))
  .handler(async ({ input }) => {
    await removeGuardian(input.personId, input.kidId);
    return { success: true };
  });
