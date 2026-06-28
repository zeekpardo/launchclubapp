import { withContentCollections } from "@content-collections/next";
// @ts-expect-error - PrismaPlugin is not typed
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";
import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin("./modules/i18n/request.ts");

// Cloudflare Turnstile is used on the public application form.
// All Turnstile assets (script, iframe, verification) live on this origin.
const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

// Allow local MinIO (http) uploads in dev; prod only allows https.
const DEV_CONNECT =
	process.env.NODE_ENV === "development" ? " http://localhost:*" : "";

const ContentSecurityPolicy = `
	default-src 'self';
	script-src 'self' 'unsafe-inline' 'unsafe-eval' ${TURNSTILE_ORIGIN};
	style-src 'self' 'unsafe-inline';
	img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com;
	font-src 'self';
	connect-src 'self' https: blob:${DEV_CONNECT} ${TURNSTILE_ORIGIN};
	frame-src ${TURNSTILE_ORIGIN};
	frame-ancestors 'none';
	base-uri 'self';
	form-action 'self';
`
	.replace(/\t/g, " ")
	.replace(/\n/g, "")
	.replace(/\s{2,}/g, " ")
	.trim();

const securityHeaders = [
	{ key: "X-DNS-Prefetch-Control", value: "on" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	// DENY — this app is never intentionally embedded. frame-ancestors in CSP covers
	// modern browsers; X-Frame-Options covers older ones.
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=()",
	},
	{
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	},
	{ key: "Content-Security-Policy", value: ContentSecurityPolicy },
];

const nextConfig: NextConfig = {
	output: "standalone",
	transpilePackages: [
		"@repo/api",
		"@repo/auth",
		"@repo/database",
		"@repo/ui",
	],
	images: {
		remotePatterns: [
			{
				// google profile images
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			{
				// github profile images
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
		],
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders,
			},
		];
	},
	async redirects() {
		return [
			{
				source: "/app/settings",
				destination: "/app/settings/general",
				permanent: true,
			},
			{
				source: "/app/:organizationSlug/settings",
				destination: "/app/:organizationSlug/settings/general",
				permanent: true,
			},
			{
				source: "/app/admin",
				destination: "/app/admin/users",
				permanent: true,
			},
		];
	},
	webpack: (config, { webpack, isServer }) => {
		config.plugins.push(
			new webpack.IgnorePlugin({
				resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
			}),
		);

		if (isServer) {
			config.plugins.push(new PrismaPlugin());
		}

		return config;
	},
};

export default withContentCollections(withNextIntl(nextConfig));
