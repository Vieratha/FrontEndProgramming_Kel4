import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// INI BAGIAN MENGAMBIL LOKASI AKTIF UNTUK CUSTOMER
export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        openingHours: true,
        imagePath: true,
        mapUrl: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return NextResponse.json(
      { locations },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Gagal mengambil lokasi publik:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data lokasi." },
      { status: 500 },
    );
  }
}
