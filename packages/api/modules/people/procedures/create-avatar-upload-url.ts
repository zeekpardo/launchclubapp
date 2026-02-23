import { ORPCError } from "@orpc/server";
import { getPersonById } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";

export const createPersonAvatarUploadUrl = protectedProcedure
  .route({
    method: "POST",
    path: "/people/avatar-upload-url",
    tags: ["People"],
    summary: "Create person avatar upload URL",
    description: "Create a signed upload URL to upload a person avatar to the storage bucket",
  })
  .input(z.object({ personId: z.string() }))
  .handler(async ({ context: { user }, input: { personId } }) => {
    const person = await getPersonById(personId);
    if (!person) throw new ORPCError("NOT_FOUND");
    const membership = await verifyOrganizationMembership(person.organizationId, user.id);
    if (!membership) throw new ORPCError("FORBIDDEN");

    const path = `people/${personId}.png`;
    const signedUploadUrl = await getSignedUploadUrl(path, { bucket: "avatars" });

    return { signedUploadUrl, path };
  });
