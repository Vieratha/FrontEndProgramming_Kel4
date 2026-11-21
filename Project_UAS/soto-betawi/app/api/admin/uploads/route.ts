import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";

// Ukuran maksimal file gambar yang dapat diunggah.
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

// Format gambar yang diterima.
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Memastikan hanya admin yang dapat mengunggah gambar.
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

// Memeriksa format gambar berdasarkan signature file.
function detectImageMimeType(bytes: Uint8Array) {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

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

  if (
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

// Mengunggah gambar baru.
export async function POST(request: Request) {
  const auth = await checkAdmin();

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Silakan pilih file gambar terlebih dahulu." },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { message: "Ukuran gambar harus lebih dari 0 dan maksimal 2 MB." },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Format gambar harus JPG, PNG, atau WEBP." },
        { status: 400 },
      );
    }

    const imageBytes = new Uint8Array(await file.arrayBuffer());

    // Memastikan format sebenarnya sesuai dengan tipe file.
    const actualMimeType = detectImageMimeType(imageBytes);

    if (!actualMimeType || actualMimeType !== file.type) {
      return NextResponse.json(
        { message: "File yang dipilih bukan gambar valid." },
        { status: 400 },
      );
    }

    // Membersihkan nama file sebelum disimpan.
    const safeFileName =
      file.name
        .split(/[\\/]/)
        .pop()
        ?.replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 255) || "uploaded-image";

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
