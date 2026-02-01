/**
 * Database seeding script
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminPassword = await hashPassword("Admin123!");
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: adminPassword,
      name: "Admin User",
      role: "admin",
      verified: true,
    },
  });

  console.log("✅ Created admin user:", admin.email);

  // Create test users
  const testPassword = await hashPassword("Test123!");
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "user1@example.com" },
      update: {},
      create: {
        email: "user1@example.com",
        password: testPassword,
        name: "Test User 1",
        role: "user",
        verified: true,
        bio: "This is test user 1",
      },
    }),
    prisma.user.upsert({
      where: { email: "user2@example.com" },
      update: {},
      create: {
        email: "user2@example.com",
        password: testPassword,
        name: "Test User 2",
        role: "user",
        verified: true,
        bio: "This is test user 2",
      },
    }),
  ]);

  console.log("✅ Created test users:", users.map((u) => u.email).join(", "));

  // Create example data
  const examples = await Promise.all([
    prisma.example.create({
      data: {
        name: "Example 1",
        description: "This is the first example",
        tags: ["test", "demo"],
        userId: users[0].id,
        views: 10,
        likes: 5,
      },
    }),
    prisma.example.create({
      data: {
        name: "Example 2",
        description: "This is the second example",
        tags: ["test", "sample"],
        userId: users[0].id,
        views: 20,
        likes: 8,
      },
    }),
    prisma.example.create({
      data: {
        name: "Example 3",
        description: "This is the third example",
        tags: ["demo", "sample"],
        userId: users[1].id,
        views: 15,
        likes: 3,
      },
    }),
  ]);

  console.log("✅ Created examples:", examples.length);

  // Create activity logs
  await Promise.all(
    users.map((user) =>
      prisma.activity.create({
        data: {
          userId: user.id,
          action: "account_created",
          description: "User account was created",
          metadata: {
            source: "seed",
          },
        },
      })
    )
  );

  console.log("✅ Created activity logs");

  console.log("\n🎉 Database seeding completed!");
  console.log("\n📝 Test Credentials:");
  console.log("   Admin: admin@example.com / Admin123!");
  console.log("   User 1: user1@example.com / Test123!");
  console.log("   User 2: user2@example.com / Test123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
