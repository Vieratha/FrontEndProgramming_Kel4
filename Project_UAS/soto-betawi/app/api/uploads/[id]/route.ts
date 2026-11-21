import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mengambil gambar yang tersimpan di database.
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const imageId = Number(id);

    // Memvalidasi ID gambar.
    if (!Number.isSafeInteger(imageId) || imageId <= 0) {
      return NextResponse.json(
        { message: "ID gambar tidak valid." },
        { status: 400 },
      );
    }

    // Mengambil data gambar dari database.
    const image = await prisma.uploadedImage.findUnique({
      where: {
        id: imageId,
      },
      select: {
        data: true,
        mimeType: true,
      },
    });

    if (!image) {
      return NextResponse.json(
        { message: "Gambar tidak ditemukan." },
        { status: 404 },
      );
    }

    // Mengirim gambar ke browser.
    return new NextResponse(Buffer.from(image.data), {
      headers: {
        "Content-Type": image.mimeType,
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Gagal menampilkan gambar:", error);

    return NextResponse.json(
      { message: "Gagal menampilkan gambar." },
      { status: 500 },
    );
  }
}
