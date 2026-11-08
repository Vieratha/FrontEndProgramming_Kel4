import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// INI BAGIAN TIPE DATA REQUEST
type UpdateOrderRequest = {
  id: string;
  status: string;
};

// INI BAGIAN MEMERIKSA OBJECT REQUEST
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// INI BAGIAN MEMERIKSA HAK AKSES ADMIN
async function checkAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 },
      ),
    };
  }

  if (user.role !== "ADMIN") {
    return {
      authorized: false,
      response: NextResponse.json(
        { message: "Akses hanya untuk administrator." },
        { status: 403 },
      ),
    };
  }

  return {
    authorized: true,
    response: null,
  };
}

// INI BAGIAN MENENTUKAN STATUS SELANJUTNYA
function getAllowedNextStatuses(
  currentStatus: string,
  orderType: string,
): string[] {
  switch (currentStatus) {
    case "Menunggu Konfirmasi":
      return ["Dikonfirmasi", "Dibatalkan"];

    case "Dikonfirmasi":
      return ["Diproses", "Dibatalkan"];

    case "Diproses":
      return orderType === "Makan di Tempat"
        ? ["Siap Disajikan"]
        : ["Siap Diambil"];

    case "Siap Disajikan":
    case "Siap Diambil":
      return ["Selesai"];

    default:
      return [];
  }
}

// INI BAGIAN MENGAMBIL SELURUH PESANAN ADMIN
export async function GET() {
  try {
    // INI BAGIAN MEMERIKSA ADMIN
    const access = await checkAdmin();

    if (!access.authorized) {
      return access.response;
    }

    // INI BAGIAN MENGAMBIL PESANAN DARI DATABASE
    const orders = await prisma.order.findMany({
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      orders,
    });
  } catch (error) {
    console.error("Admin orders GET error:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil data pesanan.",
      },
      {
        status: 500,
      },
    );
  }
}

// INI BAGIAN MEMPERBARUI STATUS PESANAN
export async function PATCH(request: Request) {
  try {
    // INI BAGIAN MEMERIKSA ADMIN
    const access = await checkAdmin();

    if (!access.authorized) {
      return access.response;
    }

    // INI BAGIAN MEMERIKSA FORMAT REQUEST
    const body: unknown = await request.json();

    if (!isRecord(body)) {
      return NextResponse.json(
        {
          message: "Format data tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    const data = body as UpdateOrderRequest;

    const orderId = typeof data.id === "string" ? data.id.trim() : "";

    const targetStatus =
      typeof data.status === "string" ? data.status.trim() : "";

    if (!orderId || !targetStatus) {
      return NextResponse.json(
        {
          message: "ID dan status pesanan wajib diisi.",
        },
        {
          status: 400,
        },
      );
    }

    // INI BAGIAN MENGAMBIL PESANAN YANG AKAN DIUBAH
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderType: true,
        status: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          message: "Pesanan tidak ditemukan.",
        },
        {
          status: 404,
        },
      );
    }

    // INI BAGIAN MEMERIKSA URUTAN STATUS PESANAN
    const allowedStatuses = getAllowedNextStatuses(
      existingOrder.status,
      existingOrder.orderType,
    );

    if (!allowedStatuses.includes(targetStatus)) {
      return NextResponse.json(
        {
          message:
            "Perubahan status tidak diperbolehkan. Periksa urutan proses pesanan.",
        },
        {
          status: 400,
        },
      );
    }

    // INI BAGIAN MENYIMPAN PERUBAHAN STATUS
    // Pemeriksaan status lama mencegah perubahan bersamaan menimpa satu sama lain.
    const updated = await prisma.order.updateMany({
      where: {
        id: existingOrder.id,
        status: existingOrder.status,
      },
      data: {
        status: targetStatus,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        {
          message: "Status pesanan sudah berubah. Muat ulang daftar pesanan.",
        },
        {
          status: 409,
        },
      );
    }

    // INI BAGIAN MENGAMBIL DATA PESANAN TERBARU
    const updatedOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      message: "Status pesanan berhasil diperbarui.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Admin orders PATCH error:", error);

    return NextResponse.json(
      {
        message: "Gagal memperbarui status pesanan.",
      },
      {
        status: 500,
      },
    );
  }
}
