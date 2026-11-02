import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";

// Memastikan hanya ADMIN yang dapat mengubah data menu
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

// Validasi data menu dari request
function validateMenu(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category : "";
  const image = typeof body.image === "string" ? body.image.trim() : "";
  const price = Number(body.price);
  const status = typeof body.status === "string" ? body.status : "Tersedia";

  if (!name || name.length > 100) {
    return { error: "Nama menu wajib diisi (maksimal 100 karakter)." };
  }

  if (!description || description.length > 1000) {
    return {
      error: "Deskripsi wajib diisi (maksimal 1000 karakter).",
    };
  }

  if (!Number.isSafeInteger(price) || price <= 0) {
    return { error: "Harga harus berupa bilangan bulat lebih dari nol." };
  }

  if (!["Makanan", "Minuman"].includes(category)) {
    return { error: "Kategori menu tidak valid." };
  }

  if (!["Tersedia", "Habis"].includes(status)) {
    return { error: "Status menu tidak valid." };
  }

  // Untuk sementara hanya menerima path gambar lokal di public/images
  if (
    !image.startsWith("/images/") ||
    image.startsWith("//") ||
    image.includes("..") ||
    image.startsWith("data:")
  ) {
    return {
      error:
        "Gambar harus menggunakan path lokal, contohnya /images/menu-soto.jpeg.",
    };
  }

  return {
    data: {
      name,
      description,
      category,
      image,
      price,
      status,
    },
  };
}

// GET: mengambil seluruh menu (publik)
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

// POST: menambahkan menu baru (ADMIN)
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

    const validated = validateMenu(body as Record<string, unknown>);

    if (validated.error) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }

    const menu = await prisma.menu.create({
      data: validated.data!,
    });

    return NextResponse.json(
      {
        message: "Menu berhasil ditambahkan.",
        menu,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Gagal menambahkan menu:", error);

    return NextResponse.json(
      { message: "Gagal menambahkan menu." },
      { status: 500 },
    );
  }
}

// PATCH: mengedit menu (ADMIN)
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
        { message: "ID menu tidak valid." },
        { status: 400 },
      );
    }

    const validated = validateMenu(data);

    if (validated.error) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }

    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      return NextResponse.json(
        { message: "Menu tidak ditemukan." },
        { status: 404 },
      );
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: validated.data!,
    });

    return NextResponse.json({
      message: "Menu berhasil diperbarui.",
      menu,
    });
  } catch (error) {
    console.error("Gagal memperbarui menu:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui menu." },
      { status: 500 },
    );
  }
}

// DELETE: menghapus menu (ADMIN)
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
        { message: "ID menu tidak valid." },
        { status: 400 },
      );
    }

    const existingMenu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      return NextResponse.json(
        { message: "Menu tidak ditemukan." },
        { status: 404 },
      );
    }

    await prisma.menu.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Menu berhasil dihapus.",
    });
  } catch (error) {
    console.error("Gagal menghapus menu:", error);

    return NextResponse.json(
      { message: "Gagal menghapus menu." },
      { status: 500 },
    );
  }
}
