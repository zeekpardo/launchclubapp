import { db } from "@repo/database";

// Seeds an org area with two sites (GBBC created first so it is formSites[0],
// NTCC second) and a published STUDENT form WITHOUT a site selector, linked to
// both. Used to verify that a per-site share link (?site=ntcc) routes the
// application to NTCC and not the first-linked site (GBBC).
async function main() {
	const org = await db.organization.findFirst({ where: { slug: "test-org" } });
	if (!org) throw new Error("Test Org not found — run seed:invite first.");

	// reset prior run
	await db.form.deleteMany({ where: { organizationId: org.id, slug: "wrong-site-test" } });
	await db.site.deleteMany({ where: { slug: { in: ["gbbc", "ntcc"] } } });

	const area = await db.area.findFirst({ where: { organizationId: org.id, name: "Test Area" } })
		?? await db.area.create({ data: { organizationId: org.id, name: "Test Area" } });

	// GBBC first → becomes formSites[0] (the wrong fallback target)
	const gbbc = await db.site.create({ data: { areaId: area.id, name: "GBBC", slug: "gbbc" } });
	const ntcc = await db.site.create({ data: { areaId: area.id, name: "NTCC", slug: "ntcc" } });

	const form = await db.form.create({
		data: {
			organizationId: org.id,
			slug: "wrong-site-test",
			name: "Wrong Site Test Form",
			type: "STUDENT",
			status: "PUBLISHED",
			formSites: { create: [{ siteId: gbbc.id }, { siteId: ntcc.id }] },
		},
	});

	console.log("✓ Seeded form-sites.");
	console.log(`  org slug:   ${org.slug}`);
	console.log(`  form slug:  ${form.slug}`);
	console.log(`  GBBC (formSites[0]): ${gbbc.id}  slug=gbbc`);
	console.log(`  NTCC (formSites[1]): ${ntcc.id}  slug=ntcc`);
	console.log("");
	console.log(`  NTCC apply link: http://localhost:3000/apply/${org.slug}/forms/${form.slug}?site=ntcc`);
	process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
