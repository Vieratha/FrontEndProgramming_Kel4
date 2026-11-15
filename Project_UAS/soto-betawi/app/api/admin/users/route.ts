import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser, hashPassword } from "@/app/lib/auth";

export const runtime = "nodejs";

// Memastikan hanya ADMIN yang dapat mengakses endpoint ini
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
    currentUser: user,
  };
}

// GET: mengambil seluruh daftar user (ADMIN)
export async function GET() {
  const auth = await checkAdmin();

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Gagal mengambil data user:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data pengguna." },
      { status: 500 },
    );
  }
}

// POST: menambahkan user baru (ADMIN)
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

    const data = body as Record<string, unknown>;
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const email =
      typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const password = typeof data.password === "string" ? data.password : "";
    const role = typeof data.role === "string" ? data.role : "CUSTOMER";

    if (!name || name.length > 100) {
      return NextResponse.json(
        { message: "Nama wajib diisi (maksimal 100 karakter)." },
        { status: 400 },
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "Format email tidak valid." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password minimal 8 karakter." },
        { status: 400 },
      );
    }

    if (!["ADMIN", "CUSTOMER"].includes(role)) {
      return NextResponse.json(
        { message: "Role pengguna tidak valid." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email sudah terdaftar." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: "Pengguna berhasil ditambahkan.",
        user: newUser,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Gagal menambahkan user:", error);

    return NextResponse.json(
      { message: "Gagal menambahkan pengguna." },
      { status: 500 },
    );
  }
}

// PATCH: mengedit user (ADMIN)
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
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const email =
      typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const role = typeof data.role === "string" ? data.role : "";
    const password = typeof data.password === "string" ? data.password : "";

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "ID pengguna tidak valid." },
        { status: 400 },
      );
    }

    if (!name || name.length > 100) {
      return NextResponse.json(
        { message: "Nama wajib diisi (maksimal 100 karakter)." },
        { status: 400 },
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "Format email tidak valid." },
        { status: 400 },
      );
    }

    if (!["ADMIN", "CUSTOMER"].includes(role)) {
      return NextResponse.json(
        { message: "Role pengguna tidak valid." },
        { status: 400 },
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { message: "Password baru minimal 8 karakter." },
        { status: 400 },
      );
    }

    // Mencegah admin menurunkan role akunnya sendiri
    if (id === auth.currentUser.id && role !== "ADMIN") {
      return NextResponse.json(
        { message: "Kamu tidak dapat mengubah role akunmu sendiri." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan." },
        { status: 404 },
      );
    }

    // Cek duplikasi email jika email diubah
    if (email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });

      if (emailTaken) {
        return NextResponse.json(
          { message: "Email sudah digunakan pengguna lain." },
          { status: 409 },
        );
      }
    }

    const updateData: {
      name: string;
      email: string;
      role: string;
      passwordHash?: string;
    } = {
      name,
      email,
      role,
    };

    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Data pengguna berhasil diperbarui.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Gagal memperbarui user:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui pengguna." },
      { status: 500 },
    );
  }
}

// DELETE: menghapus user (ADMIN)
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
        { message: "ID pengguna tidak valid." },
        { status: 400 },
      );
    }

    if (id === auth.currentUser.id) {
      return NextResponse.json(
        { message: "Kamu tidak dapat menghapus akunmu sendiri." },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "Pengguna tidak ditemukan." },
        { status: 404 },
      );
    }

    const totalOrders = await prisma.order.count({
      where: {
        userId: id,
      },
    });

    if (totalOrders > 0) {
      return NextResponse.json(
        {
          message:
            "Pengguna tidak dapat dihapus karena masih memiliki riwayat pesanan.",
        },
        {
          status: 409,
        },
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Pengguna berhasil dihapus.",
    });
  } catch (error) {
    console.error("Gagal menghapus user:", error);

    return NextResponse.json(
      { message: "Gagal menghapus pengguna." },
      { status: 500 },
    );
  }
}
