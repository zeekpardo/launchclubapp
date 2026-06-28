import { ORPCError } from "@orpc/server";

// Lightweight in-memory fixed-window rate limiter for public (unauthenticated)
// endpoints. Keyed by an arbitrary string (e.g. "contact:1.2.3.4"). This is a
// best-effort defense against abuse/bots; it is per-process, so on a
// horizontally-scaled deployment each instance keeps its own counters. For
// stronger guarantees move the store to Redis/DB, but this meaningfully raises
// the bar for the public form/upload endpoints that previously had none.

interface Bucket {
	count: number;
	resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 50_000;

function sweep(now: number): void {
	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) {
			buckets.delete(key);
		}
	}
}

/**
 * Throw TOO_MANY_REQUESTS if `key` has exceeded `limit` hits within `windowMs`.
 */
export function enforceRateLimit(
	key: string,
	limit: number,
	windowMs: number,
): void {
	const now = Date.now();
	const bucket = buckets.get(key);

	if (!bucket || bucket.resetAt <= now) {
		// Opportunistically prune expired buckets before inserting a new one to
		// keep memory bounded under churn.
		if (buckets.size > MAX_BUCKETS) {
			sweep(now);
		}
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return;
	}

	if (bucket.count >= limit) {
		throw new ORPCError("TOO_MANY_REQUESTS", {
			message: "Too many requests. Please try again later.",
		});
	}

	bucket.count += 1;
}

/** Best-effort client IP from proxy headers (Railway/Vercel set x-forwarded-for). */
export function getClientIp(headers: Headers): string {
	const forwarded = headers.get("x-forwarded-for");
	if (forwarded) {
		// First entry is the originating client.
		return forwarded.split(",")[0]?.trim() || "unknown";
	}
	return headers.get("x-real-ip")?.trim() || "unknown";
}
