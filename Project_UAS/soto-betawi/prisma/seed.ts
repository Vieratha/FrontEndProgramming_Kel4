import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const menuCount = await prisma.menu.count();

  if (menuCount > 0) {
    console.log("Menu sudah tersedia. Seeding dilewati.");
    return;
  }

  await prisma.menu.createMany({
    data: [
      {
        name: "Soto Betawi",
        description: "Soto khas Betawi dengan kuah gurih.",
        price: 35000,
        category: "Makanan",
        image: "/images/menu-soto.jpeg",
        status: "Tersedia",
      },
      {
        name: "Kerak Telor",
        description: "Makanan tradisional khas Betawi.",
        price: 25000,
        category: "Makanan",
        image: "/images/menu-kerak-telor.jpeg",
        status: "Tersedia",
      },
      {
        name: "Nasi Uduk",
        description: "Nasi gurih dengan lauk pilihan.",
        price: 28000,
        category: "Makanan",
        image: "/images/menu-nasi-uduk.jpeg",
        status: "Tersedia",
      },
      {
        name: "Bir Pletok",
        description: "Minuman rempah tradisional Betawi.",
        price: 15000,
        category: "Minuman",
        image: "/images/menu-bir-pletok.jpeg",
        status: "Tersedia",
      },
    ],
  });

  console.log("Berhasil memasukkan 4 menu awal.");
}

main()
  .catch((error) => {
    console.error("Seeding gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
