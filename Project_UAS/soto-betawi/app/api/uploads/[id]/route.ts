import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// INI BAGIAN MENAMPILKAN GAMBAR DARI DATABASE
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const imageId = Number(id);

    // INI BAGIAN MEMERIKSA ID GAMBAR
    if (!Number.isSafeInteger(imageId) || imageId <= 0) {
      return NextResponse.json(
        { message: "ID gambar tidak valid." },
        { status: 400 },
      );
    }

    // INI BAGIAN MENGAMBIL GAMBAR DARI DATABASE
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

    // INI BAGIAN MENGIRIM GAMBAR KE BROWSER
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
