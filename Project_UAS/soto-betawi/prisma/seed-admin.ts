import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const adminName = process.env.ADMIN_NAME?.trim();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!process.env.DIRECT_URL) {
    throw new Error("DIRECT_URL belum diatur di file .env");
  }

  if (!adminName || !adminEmail || !adminPassword) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL, dan ADMIN_PASSWORD wajib diatur di .env",
    );
  }

  if (adminPassword.length < 12) {
    throw new Error("Password admin minimal 12 karakter.");
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.upsert({
      where: {
        email: adminEmail,
      },
      update: {
        name: adminName,
        passwordHash,
        role: "ADMIN",
      },
      create: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      },
    });

    console.log("Akun administrator berhasil disiapkan.");
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Gagal membuat administrator:", error);
  process.exitCode = 1;
});
