import { db } from "@repo/database";

// Sets up a test organization owned by hello@noba.cc and a pending invitation
// for an invitee, so we can exercise the invited-signup flow end to end.
async function main() {
	const owner = await db.user.findUnique({
		where: { email: "hello@noba.cc" },
	});
	if (!owner) {
		throw new Error("Owner user hello@noba.cc not found — run create:user first.");
	}

	const inviteeEmail = "invitee@example.com";

	// Clean any prior run.
	await db.user.deleteMany({ where: { email: inviteeEmail } });

	let org = await db.organization.findFirst({
		where: { slug: "test-org" },
	});
	if (!org) {
		org = await db.organization.create({
			data: {
				name: "Test Org",
				slug: "test-org",
				createdAt: new Date(),
			},
		});
	}

	await db.member.upsert({
		where: {
			organizationId_userId: { organizationId: org.id, userId: owner.id },
		},
		create: {
			organizationId: org.id,
			userId: owner.id,
			role: "owner",
			createdAt: new Date(),
		},
		update: {},
	});

	// Remove old pending invites for this email, then create a fresh one.
	await db.invitation.deleteMany({
		where: { organizationId: org.id, email: inviteeEmail },
	});
	const invitation = await db.invitation.create({
		data: {
			organizationId: org.id,
			email: inviteeEmail,
			role: "member",
			status: "pending",
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
			inviterId: owner.id,
		},
	});

	console.log("✓ Seeded.");
	console.log(`  org:        ${org.name} (${org.id}) slug=${org.slug}`);
	console.log(`  invitee:    ${inviteeEmail}`);
	console.log(`  invitation: ${invitation.id}`);
	console.log("");
	console.log(
		`  Invite link: http://localhost:3000/auth/signup?invitationId=${invitation.id}&email=${encodeURIComponent(inviteeEmail)}`,
	);
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
