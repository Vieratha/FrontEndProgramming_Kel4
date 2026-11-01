import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error("Gagal mengambil menu:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data menu." },
      { status: 500 },
    );
  }
}
