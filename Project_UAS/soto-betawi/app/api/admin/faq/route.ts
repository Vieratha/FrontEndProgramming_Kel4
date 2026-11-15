import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";

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

// INI BAGIAN VALIDASI DATA FAQ
function validateFaq(body: Record<string, unknown>) {
  const question =
    typeof body.question === "string" ? body.question.trim() : "";

  const answer = typeof body.answer === "string" ? body.answer.trim() : "";

  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

  const sortOrder = Number(body.sortOrder ?? 0);

  if (!question || question.length > 200) {
    return {
      error: "Pertanyaan wajib diisi dan maksimal 200 karakter.",
    };
  }

  if (!answer || answer.length > 3000) {
    return {
      error: "Jawaban wajib diisi dan maksimal 3000 karakter.",
    };
  }

  if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    return {
      error: "Urutan FAQ harus berupa angka 0 sampai 9999.",
    };
  }

  return {
    data: {
      question,
      answer,
      isActive,
      sortOrder,
    },
  };
}

// INI BAGIAN MENGAMBIL SELURUH FAQ UNTUK ADMIN
export async function GET() {
  const auth = await checkAdmin();

  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const faqs = await prisma.faq.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return NextResponse.json({ faqs });
  } catch (error) {
    console.error("Gagal mengambil FAQ:", error);

    return NextResponse.json(
      { message: "Gagal mengambil data FAQ." },
      { status: 500 },
    );
  }
}

// INI BAGIAN MENAMBAHKAN FAQ BARU (ADMIN)
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

    const validated = validateFaq(body as Record<string, unknown>);

    if (validated.error) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }

    // INI BAGIAN MENYIMPAN FAQ KE DATABASE
    const faq = await prisma.faq.create({
      data: validated.data!,
    });

    return NextResponse.json(
      {
        message: "FAQ berhasil ditambahkan.",
        faq,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Gagal menambahkan FAQ:", error);

    return NextResponse.json(
      { message: "Gagal menambahkan FAQ." },
      { status: 500 },
    );
  }
}

// INI BAGIAN MENGEDIT FAQ (ADMIN)
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
        { message: "ID FAQ tidak valid." },
        { status: 400 },
      );
    }

    const validated = validateFaq(data);

    if (validated.error) {
      return NextResponse.json({ message: validated.error }, { status: 400 });
    }

    // INI BAGIAN MEMERIKSA FAQ
    const existingFaq = await prisma.faq.findUnique({
      where: { id },
    });

    if (!existingFaq) {
      return NextResponse.json(
        { message: "FAQ tidak ditemukan." },
        { status: 404 },
      );
    }

    // INI BAGIAN MENYIMPAN PERUBAHAN FAQ
    const faq = await prisma.faq.update({
      where: { id },
      data: validated.data!,
    });

    return NextResponse.json({
      message: "FAQ berhasil diperbarui.",
      faq,
    });
  } catch (error) {
    console.error("Gagal memperbarui FAQ:", error);

    return NextResponse.json(
      { message: "Gagal memperbarui FAQ." },
      { status: 500 },
    );
  }
}

// INI BAGIAN MENGHAPUS FAQ (ADMIN)
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
        { message: "ID FAQ tidak valid." },
        { status: 400 },
      );
    }

    const existingFaq = await prisma.faq.findUnique({
      where: { id },
    });

    if (!existingFaq) {
      return NextResponse.json(
        { message: "FAQ tidak ditemukan." },
        { status: 404 },
      );
    }

    await prisma.faq.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "FAQ berhasil dihapus.",
    });
  } catch (error) {
    console.error("Gagal menghapus FAQ:", error);

    return NextResponse.json(
      { message: "Gagal menghapus FAQ." },
      { status: 500 },
    );
  }
}
