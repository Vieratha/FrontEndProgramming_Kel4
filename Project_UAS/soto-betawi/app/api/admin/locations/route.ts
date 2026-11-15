import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";

// INI BAGIAN GAMBAR LOKASI YANG DIIZINKAN
const ALLOWED_IMAGES = ["/images/map-menteng.jpeg", "/images/map-kemang.jpeg"];

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

// INI BAGIAN MEMERIKSA LINK GOOGLE MAPS
function validateMapUrl(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return {
      error: null,
      value: null as string | null,
    };
  }

  if (typeof value !== "string" || value.length > 1000) {
    return {
      error: "Link Google Maps tidak valid.",
      value: null,
    };
  }

  try {
    const parsedUrl = new URL(value.trim());

    // Hanya menerima HTTPS.
    if (parsedUrl.protocol !== "https:") {
      throw new Error("Protocol tidak diizinkan.");
    }

    // INI BAGIAN HOST GOOGLE MAPS YANG DIIZINKAN
    const allowedHosts = [
      "google.com",
      "www.google.com",
      "maps.google.com",
      "maps.app.goo.gl",
      "goo.gl",
    ];

    if (!allowedHosts.includes(parsedUrl.hostname.toLowerCase())) {
      throw new Error("Domain tidak diizinkan.");
    }

    return {
      error: null,
      value: parsedUrl.toString(),
    };
  } catch {
    return {
      error: "Gunakan link Google Maps resmi yang diawali https://.",
      value: null,
    };
  }
}

// INI BAGIAN VALIDASI DATA LOKASI
function validateLocation(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";

  const address = typeof body.address === "string" ? body.address.trim() : "";

  const city = typeof body.city === "string" ? body.city.trim() : "";

  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  const openingHours =
    typeof body.openingHours === "string" ? body.openingHours.trim() : "";

  const imagePath =
    typeof body.imagePath === "string" ? body.imagePath.trim() : "";

  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

  const sortOrder = Number(body.sortOrder ?? 0);

  // INI BAGIAN VALIDASI NAMA CABANG
  if (!name || name.length > 100) {
    return {
      error: "Nama cabang wajib diisi dan maksimal 100 karakter.",
    };
  }

  // INI BAGIAN VALIDASI ALAMAT
  if (!address || address.length > 500) {
    return {
      error: "Alamat wajib diisi dan maksimal 500 karakter.",
    };
  }

  // INI BAGIAN VALIDASI KOTA
  if (!city || city.length > 100) {
    return {
      error: "Kota atau wilayah wajib diisi.",
    };
  }

  // INI BAGIAN VALIDASI NOMOR TELEPON
  if (phone.length > 30) {
    return {
      error: "Nomor telepon maksimal 30 karakter.",
    };
  }

  if (phone && !/^[0-9+().\-\s]+$/.test(phone)) {
    return {
      error: "Format nomor telepon tidak valid.",
    };
  }

  // INI BAGIAN VALIDASI JAM OPERASIONAL
  if (!openingHours || openingHours.length > 200) {
    return {
      error: "Jam operasional wajib diisi dan maksimal 200 karakter.",
    };
  }

  // INI BAGIAN VALIDASI GAMBAR
  if (!ALLOWED_IMAGES.includes(imagePath)) {
    return {
      error: "Pilih gambar lokasi yang tersedia.",
    };
  }

  // INI BAGIAN VALIDASI URUTAN
  if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    return {
      error: "Urutan lokasi harus berupa angka 0 sampai 9999.",
    };
  }

  // INI BAGIAN VALIDASI LINK GOOGLE MAPS
  const mapValidation = validateMapUrl(body.mapUrl);

  if (mapValidation.error) {
    return {
      error: mapValidation.error,
    };
  }

  return {
    data: {
      name,
      address,
      city,
      phone: phone || null,
      openingHours,
      imagePath,
      mapUrl: mapValidation.value,
      isActive,
      sortOrder,
    },
  };
}

// INI BAGIAN MENGAMBIL SELURUH LOKASI UNTUK ADMIN
export async function GET() {
  const auth = await checkAdmin();

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const locations = await prisma.location.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Gagal mengambil lokasi:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data lokasi." },
      { status: 500 },
    );
  }
}

// INI BAGIAN MENAMBAHKAN LOKASI BARU
export async function POST(request: Request) {
  const auth = await checkAdmin();

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Format data tidak valid." },
        { status: 400 },
      );
    }

    const validated = validateLocation(body as Record<string, unknown>);

    if (validated.error) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }

    // INI BAGIAN MENYIMPAN LOKASI KE DATABASE
    const location = await prisma.location.create({
      data: validated.data!,
    });

    return NextResponse.json(
      {
        message: "Lokasi berhasil ditambahkan.",
        location,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Gagal menambahkan lokasi:", error);

    return NextResponse.json(
      { message: "Gagal menambahkan lokasi." },
      { status: 500 },
    );
  }
}

// INI BAGIAN MENGEDIT LOKASI
export async function PATCH(request: Request) {
  const auth = await checkAdmin();

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Format data tidak valid." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;
    const id = Number(data.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "ID lokasi tidak valid." },
        { status: 400 },
      );
    }

    const validated = validateLocation(data);

    if (validated.error) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }

    // INI BAGIAN MEMERIKSA LOKASI
    const existingLocation = await prisma.location.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { message: "Lokasi tidak ditemukan." },
        { status: 404 },
      );
    }

    // INI BAGIAN MENYIMPAN PERUBAHAN LOKASI
    const location = await prisma.location.update({
      where: { id },
      data: validated.data!,
    });

    return NextResponse.json({
      message: "Lokasi berhasil diperbarui.",
      location,
    });
  } catch (error) {
    console.error("Gagal memperbarui lokasi:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui lokasi." },
      { status: 500 },
    );
  }
}

// INI BAGIAN MENGHAPUS LOKASI
export async function DELETE(request: Request) {
  const auth = await checkAdmin();

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Format data tidak valid." },
        { status: 400 },
      );
    }

    const id = Number((body as Record<string, unknown>).id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "ID lokasi tidak valid." },
        { status: 400 },
      );
    }

    const existingLocation = await prisma.location.findUnique({
      where: { id },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { message: "Lokasi tidak ditemukan." },
        { status: 404 },
      );
    }

    // INI BAGIAN MENGHAPUS LOKASI DARI DATABASE
    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Lokasi berhasil dihapus.",
    });
  } catch (error) {
    console.error("Gagal menghapus lokasi:", error);

    return NextResponse.json(
      { message: "Gagal menghapus lokasi." },
      { status: 500 },
    );
  }
}
