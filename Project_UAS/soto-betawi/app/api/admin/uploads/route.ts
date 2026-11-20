import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";

// INI BAGIAN BATAS UKURAN GAMBAR
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

// INI BAGIAN TIPE GAMBAR YANG DIIZINKAN
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// INI BAGIAN MEMERIKSA HAK AKSES ADMIN
async function checkAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 },
      ),
    };
  }

  if (user.role !== "ADMIN") {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { message: "Kamu tidak memiliki akses administrator." },
        { status: 403 },
      ),
    };
  }

  return {
    authorized: true as const,
  };
}

// INI BAGIAN MEMERIKSA FORMAT ASLI FILE GAMBAR
function detectImageMimeType(bytes: Uint8Array) {
  // Format JPEG
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // Format PNG
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // Format WEBP
  if (
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

// INI BAGIAN MENGUNGGAH GAMBAR BARU
export async function POST(request: Request) {
  const auth = await checkAdmin();

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    // INI BAGIAN MEMBACA FILE DARI FORM DATA
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Silakan pilih file gambar terlebih dahulu." },
        { status: 400 },
      );
    }

    // INI BAGIAN MEMERIKSA UKURAN FILE
    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { message: "Ukuran gambar harus lebih dari 0 dan maksimal 2 MB." },
        { status: 400 },
      );
    }

    // INI BAGIAN MEMERIKSA TIPE FILE
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Format gambar harus JPG, PNG, atau WEBP." },
        { status: 400 },
      );
    }

    // INI BAGIAN MEMBACA DATA GAMBAR
    const imageBytes = new Uint8Array(await file.arrayBuffer());

    // INI BAGIAN MEMERIKSA FORMAT ASLI GAMBAR
    const actualMimeType = detectImageMimeType(imageBytes);

    if (!actualMimeType || actualMimeType !== file.type) {
      return NextResponse.json(
        { message: "File yang dipilih bukan gambar valid." },
        { status: 400 },
      );
    }

    // INI BAGIAN MEMBERSIHKAN NAMA FILE
    const safeFileName =
      file.name
        .split(/[\\/]/)
        .pop()
        ?.replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 255) || "uploaded-image";

    // INI BAGIAN MENYIMPAN GAMBAR KE POSTGRESQL
    const uploadedImage = await prisma.uploadedImage.create({
      data: {
        data: Buffer.from(imageBytes),
        mimeType: actualMimeType,
        fileName: safeFileName,
      },
      select: {
        id: true,
      },
    });

    // INI BAGIAN MENGIRIM URL GAMBAR KE ADMIN
    return NextResponse.json(
      {
        message: "Gambar berhasil diunggah.",
        imageUrl: `/api/uploads/${uploadedImage.id}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Gagal mengunggah gambar:", error);

    return NextResponse.json(
      { message: "Gagal menyimpan gambar." },
      { status: 500 },
    );
  }
}
