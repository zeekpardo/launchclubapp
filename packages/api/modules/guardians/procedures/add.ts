import { addGuardian } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const addGuardianProcedure = protectedProcedure
  .route({ method: "POST", path: "/guardians", tags: ["Guardians"] })
  .input(z.object({ personId: z.string(), kidId: z.string(), relation: z.string().optional() }))
  .handler(async ({ input }) => {
    return addGuardian(input.personId, input.kidId, input.relation);
  });
