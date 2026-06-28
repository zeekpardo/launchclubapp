import { ORPCError } from "@orpc/client";
import { logger } from "@repo/logs";
import { sendEmail } from "@repo/mail";
import { config } from "../../../config";
import { localeMiddleware } from "../../../orpc/middleware/locale-middleware";
import { publicProcedure } from "../../../orpc/procedures";
import { enforceRateLimit, getClientIp } from "../../../orpc/rate-limit";
import { contactFormSchema } from "../types";

export const submitContactForm = publicProcedure
	.route({
		method: "POST",
		path: "/contact",
		tags: ["Contact"],
		summary: "Submit contact form",
	})
	.input(contactFormSchema)
	.use(localeMiddleware)
	.handler(
		async ({ input: { email, name, message }, context }) => {
			enforceRateLimit(`contact:${getClientIp(context.headers)}`, 5, 60 * 60 * 1000);
			try {
				await sendEmail({
					to: config.contactFormTo,
					locale: context.locale,
					subject: "Contact Form Submission",
					text: `Name: ${name}\n\nEmail: ${email}\n\nMessage: ${message}`,
				});
			} catch (error) {
				logger.error(error);
				throw new ORPCError("INTERNAL_SERVER_ERROR");
			}
		},
	);
