import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// INI BAGIAN MENGAMBIL FAQ AKTIF UNTUK CUSTOMER
export async function GET() {
  try {
    const faqs = await prisma.faq.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        question: true,
        answer: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return NextResponse.json(
      { faqs },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Gagal mengambil FAQ publik:", error);

    return NextResponse.json(
      { message: "Gagal mengambil pertanyaan FAQ." },
      { status: 500 },
    );
  }
}
