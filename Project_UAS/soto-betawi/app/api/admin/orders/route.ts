import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// INI BAGIAN TIPE DATA REQUEST
type UpdateOrderRequest = {
  id: string;
  status?: string;
  action?: string;
};

// INI BAGIAN FIELD PEMBAYARAN YANG BOLEH DIKIRIM KE FRONTEND
// proofData sengaja tidak disertakan karena diambil melalui API khusus admin.
const paymentSelect = {
  id: true,
  provider: true,
  method: true,
  reference: true,
  transactionId: true,
  status: true,
  amount: true,
  payerName: true,
  customerReference: true,
  proofMimeType: true,
  proofFileName: true,
  submittedAt: true,
  verifiedAt: true,
  rejectedAt: true,
  verificationNote: true,
  paidAt: true,
  createdAt: true,
} as const;

// INI BAGIAN MEMERIKSA OBJECT REQUEST
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// INI BAGIAN MEMERIKSA HAK AKSES ADMIN
async function checkAdmin(): Promise<
  | { authorized: true; response: null }
  | { authorized: false; response: NextResponse }
> {
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

        payments: {
          orderBy: {
            createdAt: "desc",
          },
          select: paymentSelect,
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

// INI BAGIAN MEMPERBARUI PESANAN DAN PEMBAYARAN
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

    if (!orderId) {
      return NextResponse.json(
        {
          message: "ID pesanan wajib diisi.",
        },
        {
          status: 400,
        },
      );
    }

    // INI BAGIAN MENGAMBIL DATA PESANAN
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderNumber: true,
        orderType: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        total: true,
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

    // INI BAGIAN KONFIRMASI PEMBAYARAN MANUAL OLEH KASIR
    if (data.action === "MARK_PAID") {
      // Pesanan yang dibatalkan tidak dapat menerima pembayaran baru.
      if (existingOrder.status === "Dibatalkan") {
        return NextResponse.json(
          {
            message: "Pesanan yang dibatalkan tidak dapat dibayar.",
          },
          {
            status: 400,
          },
        );
      }

      // INI BAGIAN MEMERIKSA STATUS PEMBAYARAN
      if (existingOrder.paymentStatus === "LUNAS") {
        return NextResponse.json(
          {
            message: "Pembayaran pesanan ini sudah Lunas.",
          },
          {
            status: 409,
          },
        );
      }

      // INI BAGIAN MEMERIKSA METODE PEMBAYARAN
      const paymentMethod = existingOrder.paymentMethod || "Bayar di Kasir";

      if (paymentMethod !== "Bayar di Kasir") {
        return NextResponse.json(
          {
            message:
              "Pembayaran manual hanya berlaku untuk metode Bayar di Kasir.",
          },
          {
            status: 400,
          },
        );
      }

      // INI BAGIAN MENYIMPAN KONFIRMASI KASIR SECARA ATOMIK
      const paidAt = new Date();
      const paymentReference = `KASIR-${existingOrder.orderNumber}`;

      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Pastikan status pembayaran belum berubah oleh request lain.
        const updated = await tx.order.updateMany({
          where: {
            id: existingOrder.id,
            paymentStatus: "BELUM_DIBAYAR",
            status: {
              not: "Dibatalkan",
            },
          },
          data: {
            paymentStatus: "LUNAS",
            paidAt,
          },
        });

        if (updated.count !== 1) {
          return null;
        }

        // INI BAGIAN MENCATAT TRANSAKSI KASIR
        // Upsert mencegah pembayaran kasir tercatat dua kali.
        await tx.payment.upsert({
          where: {
            reference: paymentReference,
          },
          create: {
            orderId: existingOrder.id,
            provider: "MANUAL",
            method: "KASIR",
            reference: paymentReference,
            status: "LUNAS",
            amount: existingOrder.total,
            paidAt,
          },
          update: {
            status: "LUNAS",
            amount: existingOrder.total,
            paidAt,
          },
        });

        // INI BAGIAN MENGAMBIL PESANAN TERBARU
        return tx.order.findUnique({
          where: {
            id: existingOrder.id,
          },
          include: {
            items: {
              orderBy: {
                id: "asc",
              },
            },
            payments: {
              orderBy: {
                createdAt: "desc",
              },
              select: paymentSelect,
            },
          },
        });
      });

      if (!updatedOrder) {
        return NextResponse.json(
          {
            message:
              "Pembayaran sudah berubah. Silakan refresh daftar pesanan.",
          },
          {
            status: 409,
          },
        );
      }

      return NextResponse.json({
        message: "Pembayaran berhasil ditandai Lunas.",
        order: updatedOrder,
      });
    }

    // INI BAGIAN MEMVALIDASI STATUS PESANAN
    const targetStatus =
      typeof data.status === "string" ? data.status.trim() : "";

    if (!targetStatus) {
      return NextResponse.json(
        {
          message: "Status pesanan wajib diisi.",
        },
        {
          status: 400,
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

    // INI BAGIAN MEMERIKSA PEMBAYARAN SEBELUM PESANAN SELESAI
    if (targetStatus === "Selesai" && existingOrder.paymentStatus !== "LUNAS") {
      return NextResponse.json(
        {
          message:
            "Pesanan belum dapat diselesaikan karena pembayaran belum Lunas.",
        },
        {
          status: 400,
        },
      );
    }

    // INI BAGIAN MENCEGAH PEMBATALAN PESANAN YANG SUDAH DIBAYAR
    if (
      targetStatus === "Dibatalkan" &&
      existingOrder.paymentStatus === "LUNAS"
    ) {
      return NextResponse.json(
        {
          message:
            "Pesanan sudah dibayar. Proses pengembalian dana perlu dilakukan terlebih dahulu.",
        },
        {
          status: 400,
        },
      );
    }

    // INI BAGIAN MENYIMPAN PERUBAHAN STATUS SECARA ATOMIK
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: {
          id: existingOrder.id,
          status: existingOrder.status,
          paymentStatus: existingOrder.paymentStatus,
        },
        data: {
          status: targetStatus,
        },
      });

      if (updated.count !== 1) {
        return null;
      }

      // INI BAGIAN MEMBATALKAN TRANSAKSI PEMBAYARAN YANG BELUM LUNAS
      if (targetStatus === "Dibatalkan") {
        await tx.payment.updateMany({
          where: {
            orderId: existingOrder.id,
            status: "MENUNGGU_PEMBAYARAN",
          },
          data: {
            status: "DIBATALKAN",
          },
        });
      }

      // INI BAGIAN MENGAMBIL DATA PESANAN TERBARU
      return tx.order.findUnique({
        where: {
          id: existingOrder.id,
        },
        include: {
          items: {
            orderBy: {
              id: "asc",
            },
          },
          payments: {
            orderBy: {
              createdAt: "desc",
            },
            select: paymentSelect,
          },
        },
      });
    });

    if (!updatedOrder) {
      return NextResponse.json(
        {
          message: "Data pesanan sudah berubah. Muat ulang daftar pesanan.",
        },
        {
          status: 409,
        },
      );
    }

    return NextResponse.json({
      message:
        targetStatus === "Dibatalkan"
          ? "Pesanan dan transaksi pembayaran berhasil dibatalkan."
          : "Status pesanan berhasil diperbarui.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Admin orders PATCH error:", error);

    return NextResponse.json(
      {
        message: "Gagal memperbarui pesanan.",
      },
      {
        status: 500,
      },
    );
  }
}
