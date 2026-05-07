import { ORPCError } from "@orpc/client";
import { getOrganizationBySlug, getFormBySlug } from "@repo/database";
import { publicProcedure } from "../../../orpc/procedures";
import { publicGetFormSchema } from "../types";

export const publicGetForm = publicProcedure
  .route({ method: "GET", path: "/public/forms/{orgSlug}/{formSlug}", tags: ["Forms"], summary: "Get a published form by org and form slug" })
  .input(publicGetFormSchema)
  .handler(async ({ input }) => {
    const org = await getOrganizationBySlug(input.orgSlug);
    if (!org) throw new ORPCError("NOT_FOUND");

    const form = await getFormBySlug(org.id, input.formSlug);
    if (!form) throw new ORPCError("NOT_FOUND");

    if (form.deletedAt) throw new ORPCError("NOT_FOUND");

    if (form.status === "UNPUBLISHED") {
      throw new ORPCError("NOT_FOUND", { message: "This form isn't available." });
    }

    return form;
  });
