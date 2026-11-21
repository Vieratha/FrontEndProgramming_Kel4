import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { prisma } from "@/app/lib/prisma";
import { createSession, hashPassword } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    // Memeriksa field wajib pendaftaran.
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Semua field wajib diisi." },
        { status: 400 },
      );
    }

    // Memvalidasi format email.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Email tidak valid." },
        { status: 400 },
      );
    }

    // Memvalidasi panjang password.
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password minimal 8 karakter." },
        { status: 400 },
      );
    }

    // bcrypt memiliki batas input password 72 byte.
    // Validasi dilakukan berdasarkan byte UTF-8, bukan jumlah karakter.
    if (Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json(
        { message: "Password maksimal 72 byte (UTF-8)." },
        { status: 400 },
      );
    }

    // Memeriksa apakah email sudah digunakan.
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email sudah terdaftar." },
        { status: 409 },
      );
    }

    // Membuat hash password.
    const passwordHash = await hashPassword(password);

    // Menyimpan akun baru ke database.
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "CUSTOMER",
      },
    });

    // Membuat session setelah pendaftaran berhasil.
    await createSession(user.id);

    return NextResponse.json(
      {
        message: "Registrasi berhasil.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      { message: "Terjadi kesalahan saat registrasi." },
      { status: 500 },
    );
  }
}
