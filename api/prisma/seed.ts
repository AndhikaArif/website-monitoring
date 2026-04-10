import { PrismaClient, UserRole } from "../src/generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@mail.com";
  const username = "admin";

  // 🔍 cek apakah admin sudah ada
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existing) {
    console.log("⚠️ Admin sudah ada, skip seed");
    return;
  }

  // 🔐 hash password
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 💾 create admin
  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      username,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log("✅ Admin berhasil dibuat:");
  console.log({
    email: admin.email,
    username: admin.username,
    password: "admin123",
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
