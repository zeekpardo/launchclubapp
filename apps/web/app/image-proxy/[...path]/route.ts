import { getSignedUrl } from "@repo/storage";

export const dynamic = "force-dynamic";

export const GET = async (
	_req: Request,
	{ params }: { params: Promise<{ path: string[] }> },
) => {
	const { path } = await params;

	const [bucket, ...rest] = path;
	const filePath = rest.join("/");

	if (!(bucket && filePath)) {
		return new Response("Invalid path", { status: 400 });
	}

	if (bucket === "avatars") {
		const signedUrl = await getSignedUrl(filePath, {
			bucket,
			expiresIn: 60 * 60,
		});

		const s3Response = await fetch(signedUrl, { cache: "no-store" });

		if (!s3Response.ok) {
			return new Response("Not found", { status: 404 });
		}

		return new Response(s3Response.body, {
			headers: {
				"Content-Type":
					s3Response.headers.get("Content-Type") ?? "image/png",
				"Cache-Control": "max-age=3600",
			},
		});
	}

	return new Response("Not found", {
		status: 404,
	});
};
