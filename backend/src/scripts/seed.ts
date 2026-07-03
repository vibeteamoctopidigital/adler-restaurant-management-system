/**
 * Seed Script — Creates a default admin account if none exists.
 *
 * Usage:  npx tsx src/scripts/seed.ts
 */
import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../utils/bcrypt";

const DEFAULT_ADMIN = {
  email: "admin@adler.com",
  password: "Admin@123456",
  firstName: "Adler",
  lastName: "Admin",
};

async function main() {
  const connectionString = process.env.DATABASE_URL!;
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    console.log("✅ Connected to database.");

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: DEFAULT_ADMIN.email },
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin already exists: ${DEFAULT_ADMIN.email}`);
      console.log("   Skipping seed.");
      return;
    }

    // Hash password and create admin
    const passwordHash = await hashPassword(DEFAULT_ADMIN.password);

    const admin = await prisma.admin.create({
      data: {
        email: DEFAULT_ADMIN.email,
        passwordHash,
        firstName: DEFAULT_ADMIN.firstName,
        lastName: DEFAULT_ADMIN.lastName,
      },
    });

    console.log("🌱 Default admin created successfully:");
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log(`   ID:       ${admin.id}`);
    console.log("");
    console.log("⚠️  Change this password after first login!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
