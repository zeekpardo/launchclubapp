import { routing } from "@i18n/routing";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { withQuery } from "ufo";
import { config as appConfig } from "@/config";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(req: NextRequest) {
	const { pathname, origin } = req.nextUrl;

	const sessionCookie = getSessionCookie(req);

	if (pathname === "/app" || pathname.startsWith("/app/")) {
		const response = NextResponse.next();

		if (!appConfig.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}

		if (!sessionCookie) {
			return NextResponse.redirect(
				new URL(
					withQuery("/auth/login", {
						redirectTo: pathname,
					}),
					origin,
				),
			);
		}

		return response;
	}

	if (pathname.startsWith("/auth")) {
		if (!appConfig.saas.enabled) {
			return NextResponse.redirect(new URL("/", origin));
		}

		return NextResponse.next();
	}

	const pathsWithoutLocale = [
		"/onboarding",
		"/new-organization",
		"/choose-plan",
		"/organization-invitation",
		"/apply",
	];

	if (pathsWithoutLocale.some((path) => pathname.startsWith(path))) {
		return NextResponse.next();
	}

	if (!appConfig.marketing.enabled) {
		// Keep legal pages (privacy policy, terms) reachable even with marketing
		// disabled — they're linked from the auth and SaaS footers and are
		// legally required. They live under (marketing)/[locale]/legal, so allow
		// both "/legal/..." and a locale-prefixed "/<locale>/legal/..." through.
		const segments = pathname.split("/").filter(Boolean);
		const isLegal = segments[0] === "legal" || segments[1] === "legal";
		if (!isLegal) {
			return NextResponse.redirect(new URL("/app", origin));
		}
	}

	return intlMiddleware(req);
}

export const config = {
	matcher: [
		"/((?!api|image-proxy|images|fonts|_next/static|_next/image|favicon.ico|icon.png|sitemap.xml|robots.txt).*)",
	],
};
