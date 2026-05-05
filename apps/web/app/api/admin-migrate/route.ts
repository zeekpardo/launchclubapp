import { execSync } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
	const secret = req.headers.get("x-migrate-secret");
	if (!secret || secret !== process.env.MIGRATE_SECRET) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const dbDir = path.join(process.cwd(), "..", "..", "packages", "database");
	const prismaBin = path.join(dbDir, "node_modules", ".bin", "prisma");
	const output: string[] = [];

	try {
		const resolveOut = execSync(
			`${prismaBin} migrate resolve --applied 20260505000000_init`,
			{ cwd: dbDir, encoding: "utf8", env: process.env },
		);
		output.push("resolve: " + resolveOut.trim());
	} catch (e: unknown) {
		output.push("resolve (skipped): " + String(e instanceof Error ? e.message : e));
	}

	try {
		const deployOut = execSync(`${prismaBin} migrate deploy`, {
			cwd: dbDir,
			encoding: "utf8",
			env: process.env,
		});
		output.push("deploy: " + deployOut.trim());
	} catch (e: unknown) {
		return NextResponse.json(
			{ error: String(e instanceof Error ? e.message : e), output },
			{ status: 500 },
		);
	}

	return NextResponse.json({ ok: true, output });
}
