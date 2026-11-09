import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// INI BAGIAN MENGAMBIL BUKTI PEMBAYARAN KHUSUS ADMIN
export async function GET(request: Request) {
  try {
    // INI BAGIAN MEMERIKSA HAK AKSES ADMIN
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Akses hanya untuk administrator." },
        { status: 403 },
      );
    }

    // INI BAGIAN MEMBACA ID PEMBAYARAN
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId")?.trim();

    if (!paymentId) {
      return NextResponse.json(
        { message: "ID pembayaran wajib diisi." },
        { status: 400 },
      );
    }

    // INI BAGIAN MENGAMBIL FILE DARI DATABASE
    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      select: {
        proofData: true,
        proofMimeType: true,
        proofFileName: true,
      },
    });

    if (!payment || !payment.proofData || !payment.proofMimeType) {
      return NextResponse.json(
        { message: "Bukti pembayaran tidak ditemukan." },
        { status: 404 },
      );
    }

    // INI BAGIAN MEMBATASI JENIS FILE YANG DITAMPILKAN
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedMimeTypes.includes(payment.proofMimeType)) {
      return NextResponse.json(
        { message: "Format file tidak diizinkan." },
        { status: 415 },
      );
    }

    // INI BAGIAN MENGIRIM FILE KE BROWSER ADMIN
    const fileBuffer = Buffer.from(payment.proofData);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": payment.proofMimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Admin payment proof error:", error);

    return NextResponse.json(
      { message: "Gagal mengambil bukti pembayaran." },
      { status: 500 },
    );
  }
}
