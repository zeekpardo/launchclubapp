import { getOrganizationMembership } from "@repo/database";
import { getSignedUrl } from "@repo/storage";
import { config as storageConfig } from "@repo/storage/config";
import { getSession } from "@saas/auth/lib/server";

export const dynamic = "force-dynamic";

// Map the first URL segment (logical key OR physical bucket name) to a logical
// bucket key understood by getSignedUrl.
const BUCKET_ALIASES: Record<string, keyof typeof storageConfig.bucketNames> = {
	avatars: "avatars",
	[storageConfig.bucketNames.avatars]: "avatars",
	customFields: "customFields",
	[storageConfig.bucketNames.customFields]: "customFields",
	consentSignatures: "consentSignatures",
	[storageConfig.bucketNames.consentSignatures]: "consentSignatures",
	consentForms: "consentForms",
	[storageConfig.bucketNames.consentForms]: "consentForms",
};

export const GET = async (
	_req: Request,
	{ params }: { params: Promise<{ path: string[] }> },
) => {
	// Require an authenticated session — these files (uploaded documents,
	// consent signatures, custom-field attachments) must never be served to
	// anonymous requests.
	const session = await getSession();
	if (!session) {
		return new Response("Unauthorized", { status: 401 });
	}

	const { path } = await params;
	const [bucket, ...rest] = path;
	const filePath = rest.join("/");

	if (!(bucket && filePath)) {
		return new Response("Invalid path", { status: 400 });
	}

	const bucketKey = BUCKET_ALIASES[bucket];
	if (!bucketKey) {
		return new Response("Not found", { status: 404 });
	}

	// Org-scope keys that embed an organization id so a member of one org can't
	// fetch another org's files. custom-fields keys are
	// `custom-fields/{orgId}/{personId}/{fieldId}`; consent-forms are
	// `{orgId}/{type}.pdf`. Keys without an embedded org (avatars, form-field
	// uploads, consent signatures) fall back to the authenticated-session check.
	const segments = filePath.split("/");
	let orgIdInKey: string | undefined;
	if (bucketKey === "customFields" && segments[0] === "custom-fields") {
		orgIdInKey = segments[1];
	} else if (bucketKey === "consentForms") {
		orgIdInKey = segments[0];
	}
	if (orgIdInKey) {
		const membership = await getOrganizationMembership(orgIdInKey, session.user.id);
		if (!membership) {
			return new Response("Forbidden", { status: 403 });
		}
	}

	const signedUrl = await getSignedUrl(filePath, { bucket: bucketKey, expiresIn: 60 * 60 });
	const s3Response = await fetch(signedUrl, { cache: "no-store" });
	if (!s3Response.ok) {
		return new Response("Not found", { status: 404 });
	}

	const contentType =
		s3Response.headers.get("Content-Type") ??
		(bucketKey === "avatars" ? "image/png" : "application/octet-stream");
	const fileName = filePath.split("/").pop() ?? "file";

	return new Response(s3Response.body, {
		headers: {
			"Content-Type": contentType,
			"Content-Disposition": `inline; filename="${fileName}"`,
			"Cache-Control": "private, max-age=3600",
		},
	});
};
