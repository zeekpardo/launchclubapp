import { ORPCError } from "@orpc/client";
import {
  createApplication,
  countRecentApplicationsByEmail,
  countRecentApplicationsBySite,
  getSiteBySlug,
  getCollectInApplicationFieldsBySite,
  getFormFieldsForApplication,
} from "@repo/database";
import { publicProcedure } from "../../../orpc/procedures";
import { submitApplicationSchema } from "../types";

const ONE_HOUR_MS = 60 * 60 * 1000;

// Per-email: max 5 submissions in any rolling 1-hour window
const EMAIL_LIMIT = 5;

// Per-site: max 200 submissions in any rolling 1-hour window
const SITE_LIMIT = 200;

async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Allow in development when secret is not configured
    if (process.env.NODE_ENV !== "production") return true;
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "CAPTCHA is not configured." });
  }
  const body = new URLSearchParams({ secret, response: token });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = await res.json() as { success: boolean };
  return data.success === true;
}

export const submitApplication = publicProcedure
  .route({
    method: "POST",
    path: "/applications/submit",
    tags: ["Applications"],
    summary: "Submit a public application for a site",
  })
  .input(submitApplicationSchema)
  .handler(async ({ input }) => {
    const captchaValid = await verifyCaptcha(input.captchaToken);
    if (!captchaValid) {
      throw new ORPCError("FORBIDDEN", { message: "CAPTCHA verification failed. Please try again." });
    }

    const site = await getSiteBySlug(input.siteSlug);
    if (!site) throw new ORPCError("NOT_FOUND");
    if (!site.acceptApplications) {
      throw new ORPCError("FORBIDDEN", {
        message: "Applications are not currently being accepted for this site.",
      });
    }

    // Rate limit: per email address
    if (input.parentEmail) {
      const emailCount = await countRecentApplicationsByEmail(input.parentEmail, ONE_HOUR_MS);
      if (emailCount >= EMAIL_LIMIT) {
        throw new ORPCError("TOO_MANY_REQUESTS", {
          message: "Too many submissions from this email address. Please try again later.",
        });
      }
    }

    // Rate limit: per site (prevent flooding a specific site)
    const siteCount = await countRecentApplicationsBySite(site.id, ONE_HOUR_MS);
    if (siteCount >= SITE_LIMIT) {
      throw new ORPCError("TOO_MANY_REQUESTS", {
        message: "This site is temporarily unavailable for new applications. Please try again later.",
      });
    }

    // Fetch valid field IDs for this site to prevent cross-tenant field injection
    const [validCustomFields, { areaFields, siteFields }] = await Promise.all([
      getCollectInApplicationFieldsBySite(input.siteSlug),
      getFormFieldsForApplication(site.id),
    ]);

    const validCustomFieldIds = new Set(validCustomFields.map((f) => f.id));
    const validFormFieldIds = new Set([...areaFields, ...siteFields].map((f) => f.id));

    const { siteSlug, captchaToken: _captcha, children, customFieldValues, profileFieldValues, ...parentData } = input;

    const safeCustomFieldValues = customFieldValues?.filter((v) => validFormFieldIds.has(v.formFieldId));
    const safeProfileFieldValues = profileFieldValues?.filter((v) => validCustomFieldIds.has(v.customFieldId));

    return createApplication({
      siteId: site.id,
      ...parentData,
      children: children.map(({ profileFieldValues: childPfv, ...child }) => {
        const safeChildPfv = childPfv?.filter((v) => validCustomFieldIds.has(v.customFieldId));
        return {
          ...child,
          birthday: child.birthday ? new Date(child.birthday) : undefined,
          profileFieldValues: safeChildPfv?.length ? safeChildPfv : undefined,
        };
      }),
      customFieldValues: safeCustomFieldValues?.length ? safeCustomFieldValues : undefined,
      profileFieldValues: safeProfileFieldValues?.length ? safeProfileFieldValues : undefined,
    });
  });
