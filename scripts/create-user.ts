import { auth } from "@repo/auth";
import { db } from "@repo/database";

interface CliArgs {
	email: string;
	password: string;
	name: string;
	admin: boolean;
}

function parseArgs(): CliArgs {
	const args = process.argv.slice(2);
	const get = (flag: string) => {
		const idx = args.indexOf(flag);
		return idx !== -1 ? args[idx + 1] : undefined;
	};

	return {
		email: get("--email") ?? "hello@noba.cc",
		password: get("--password") ?? "Password123!",
		name: get("--name") ?? "Admin",
		admin: args.includes("--admin"),
	};
}

async function main() {
	const { email, password, name, admin } = parseArgs();

	console.log(`Creating user "${name}" <${email}>...`);

	const existing = await db.user.findUnique({ where: { email } });
	if (existing) {
		console.error(`✗ A user with email ${email} already exists.`);
		process.exit(1);
	}

	await auth.api.signUpEmail({
		body: { email, password, name },
	});

	// Mark verified (dev), and optionally elevate to admin.
	const user = await db.user.update({
		where: { email },
		data: {
			emailVerified: true,
			...(admin ? { role: "admin" } : {}),
		},
	});

	console.log("✓ User created:");
	console.log(`  id:    ${user.id}`);
	console.log(`  email: ${user.email}`);
	console.log(`  role:  ${user.role ?? "(none)"}`);
	console.log(`  password: ${password}`);
	process.exit(0);
}

main().catch((err) => {
	console.error("✗ Failed to create user:", err);
	process.exit(1);
});
