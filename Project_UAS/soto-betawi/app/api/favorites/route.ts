import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";

// INI BAGIAN MEMERIKSA AKUN CUSTOMER
async function checkCustomer() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { message: "Silakan login untuk menggunakan fitur favorit." },
        { status: 401 },
      ),
    };
  }

  if (user.role !== "CUSTOMER") {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { message: "Fitur favorit hanya tersedia untuk customer." },
        { status: 403 },
      ),
    };
  }

  return {
    authorized: true as const,
    user,
  };
}

// GET: MENGAMBIL DAFTAR FAVORIT MILIK CUSTOMER
export async function GET() {
  const auth = await checkCustomer();

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: auth.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
        menu: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            category: true,
            image: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      favorites: favorites.map((favorite) => ({
        ...favorite.menu,
        favoritedAt: favorite.createdAt,
      })),
    });
  } catch (error) {
    console.error("Gagal mengambil menu favorit:", error);

    return NextResponse.json(
      { message: "Gagal mengambil daftar favorit." },
      { status: 500 },
    );
  }
}

// INI BAGIAN VALIDASI ID MENU
function validateMenuId(value: unknown) {
  const menuId = Number(value);

  return Number.isSafeInteger(menuId) && menuId > 0 ? menuId : null;
}

// INI BAGIAN MENAMBAHKAN FAVORIT
export async function POST(request: Request) {
  const auth = await checkCustomer();

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

    const menuId = validateMenuId((body as Record<string, unknown>).menuId);

    if (!menuId) {
      return NextResponse.json(
        { message: "ID menu tidak valid." },
        { status: 400 },
      );
    }

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      select: { id: true },
    });

    if (!menu) {
      return NextResponse.json(
        { message: "Menu tidak ditemukan." },
        { status: 404 },
      );
    }

    // Upsert mencegah favorite ganda.
    await prisma.favorite.upsert({
      where: {
        userId_menuId: {
          userId: auth.user.id,
          menuId,
        },
      },
      create: {
        userId: auth.user.id,
        menuId,
      },
      update: {},
    });

    const favoriteCount = await prisma.favorite.count({
      where: { menuId },
    });

    return NextResponse.json({
      message: "Menu berhasil ditambahkan ke favorit.",
      favoriteCount,
      isFavorited: true,
    });
  } catch (error) {
    console.error("Gagal menambahkan favorit:", error);

    return NextResponse.json(
      { message: "Gagal menyimpan favorit." },
      { status: 500 },
    );
  }
}

// INI BAGIAN MENGHAPUS FAVORIT
export async function DELETE(request: Request) {
  const auth = await checkCustomer();

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

    const menuId = validateMenuId((body as Record<string, unknown>).menuId);

    if (!menuId) {
      return NextResponse.json(
        { message: "ID menu tidak valid." },
        { status: 400 },
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: auth.user.id,
        menuId,
      },
    });

    const favoriteCount = await prisma.favorite.count({
      where: { menuId },
    });

    return NextResponse.json({
      message: "Favorit berhasil dihapus.",
      favoriteCount,
      isFavorited: false,
    });
  } catch (error) {
    console.error("Gagal menghapus favorit:", error);

    return NextResponse.json(
      { message: "Gagal menghapus favorit." },
      { status: 500 },
    );
  }
}
