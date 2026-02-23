import { PrismaPg } from "@prisma/adapter-pg";
import { createId } from "@paralleldrive/cuid2";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "./generated/client";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "hello@noba.cc";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "LaunchClub2025!";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists — skipping.`);
    return;
  }

  const now = new Date();
  const userId = createId();

  await prisma.user.create({
    data: {
      id: userId,
      name: "Zeek Pardo",
      email,
      emailVerified: true,
      role: "admin",
      createdAt: now,
      updatedAt: now,
      onboardingComplete: true,
    },
  });

  await prisma.account.create({
    data: {
      id: createId(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log(`✓ Created super admin: ${email}`);
  console.log(`  Password: ${process.env.SEED_ADMIN_PASSWORD ? "(from SEED_ADMIN_PASSWORD env)" : password}`);
  console.log("  Change this password after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
