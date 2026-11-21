import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  getCurrentUser,
  verifyPassword,
  hashPassword,
  deleteOtherSessions,
} from "@/app/lib/auth";

export const runtime = "nodejs";

// Proses penggantian password customer.
export async function POST(request: Request) {
  try {
    // Memeriksa session user.
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    if (user.role !== "CUSTOMER") {
      return NextResponse.json(
        { message: "Akses hanya tersedia untuk customer." },
        { status: 403 },
      );
    }

    // Memvalidasi data request.
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Format data tidak valid." },
        { status: 400 },
      );
    }

    const data = body as Record<string, unknown>;

    const currentPassword =
      typeof data.currentPassword === "string" ? data.currentPassword : "";

    const newPassword =
      typeof data.newPassword === "string" ? data.newPassword : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Password lama dan baru wajib diisi." },
        { status: 400 },
      );
    }

    // Memvalidasi password baru.
    if (newPassword.length < 8 || Buffer.byteLength(newPassword, "utf8") > 72) {
      return NextResponse.json(
        {
          message:
            "Password baru harus minimal 8 karakter dan maksimal 72 byte.",
        },
        { status: 400 },
      );
    }

    // Mengambil hash password dari database.
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!account) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan." },
        { status: 404 },
      );
    }

    // Memeriksa password lama.
    const isPasswordValid = await verifyPassword(
      currentPassword,
      account.passwordHash,
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Password saat ini tidak sesuai." },
        { status: 400 },
      );
    }

    // Memastikan password baru berbeda dari password lama.
    const isSamePassword = await verifyPassword(
      newPassword,
      account.passwordHash,
    );

    if (isSamePassword) {
      return NextResponse.json(
        { message: "Password baru harus berbeda dari password lama." },
        { status: 400 },
      );
    }

    // Membuat hash untuk password baru.
    const newPasswordHash = await hashPassword(newPassword);

    // Memperbarui password di database.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // Mengakhiri session pada perangkat lain.
    await deleteOtherSessions(user.id);

    return NextResponse.json({
      message: "Password berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Gagal mengganti password:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengganti password." },
      { status: 500 },
    );
  }
}
