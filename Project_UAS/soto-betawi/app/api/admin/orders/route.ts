import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// INI BAGIAN TIPE DATA REQUEST ADMIN
type UpdateOrderRequest = {
  id: string;
  status?: string;
  action?: string;
  paymentId?: string;
  note?: string;
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

    // INI BAGIAN VERIFIKASI DAN PENOLAKAN PEMBAYARAN ONLINE
    if (data.action === "VERIFY_PAYMENT" || data.action === "REJECT_PAYMENT") {
      // INI BAGIAN MEMERIKSA ID PEMBAYARAN
      const paymentId =
        typeof data.paymentId === "string" ? data.paymentId.trim() : "";

      if (!paymentId) {
        return NextResponse.json(
          { message: "ID pembayaran wajib diisi." },
          { status: 400 },
        );
      }

      // INI BAGIAN MEMERIKSA CATATAN ADMIN
      const verificationNote =
        typeof data.note === "string" ? data.note.trim() : "";

      if (
        data.action === "REJECT_PAYMENT" &&
        (verificationNote.length < 3 || verificationNote.length > 500)
      ) {
        return NextResponse.json(
          {
            message: "Alasan penolakan harus berisi 3 sampai 500 karakter.",
          },
          {
            status: 400,
          },
        );
      }

      // INI BAGIAN MEMERIKSA STATUS ORDER
      if (
        existingOrder.paymentStatus !== "MENUNGGU_VERIFIKASI" ||
        existingOrder.status === "Dibatalkan" ||
        existingOrder.status === "Selesai"
      ) {
        return NextResponse.json(
          {
            message:
              "Pesanan tidak berada dalam kondisi yang dapat diverifikasi.",
          },
          {
            status: 409,
          },
        );
      }

      // INI BAGIAN MENGAMBIL TRANSAKSI PEMBAYARAN
      const payment = await prisma.payment.findFirst({
        where: {
          id: paymentId,
          orderId: existingOrder.id,
        },
        select: {
          id: true,
          method: true,
          status: true,
          amount: true,
          proofData: true,
        },
      });

      if (!payment || !payment.proofData) {
        return NextResponse.json(
          {
            message: "Bukti pembayaran tidak ditemukan.",
          },
          {
            status: 404,
          },
        );
      }

      // INI BAGIAN MEMERIKSA STATUS TRANSAKSI
      if (
        payment.status !== "MENUNGGU_VERIFIKASI" ||
        !["QRIS", "TRANSFER_BANK"].includes(payment.method)
      ) {
        return NextResponse.json(
          {
            message: "Transaksi ini tidak dapat diverifikasi.",
          },
          {
            status: 409,
          },
        );
      }

      // INI BAGIAN MEMERIKSA KECocOKAN NOMINAL
      if (payment.amount !== existingOrder.total) {
        return NextResponse.json(
          {
            message: "Nominal pembayaran tidak sesuai dengan total pesanan.",
          },
          {
            status: 400,
          },
        );
      }

      // INI BAGIAN MENENTUKAN WAKTU KEPUTUSAN ADMIN
      const reviewedAt = new Date();

      try {
        // INI BAGIAN MENYIMPAN KEPUTUSAN SECARA ATOMIK
        // Order dan Payment harus berubah bersama-sama.
        const updatedOrder = await prisma.$transaction(async (tx) => {
          if (data.action === "VERIFY_PAYMENT") {
            // INI BAGIAN MENGUBAH STATUS ORDER MENJADI LUNAS
            const orderUpdated = await tx.order.updateMany({
              where: {
                id: existingOrder.id,
                paymentStatus: "MENUNGGU_VERIFIKASI",
                status: {
                  notIn: ["Dibatalkan", "Selesai"],
                },
              },
              data: {
                paymentStatus: "LUNAS",
                paidAt: reviewedAt,
              },
            });

            if (orderUpdated.count !== 1) {
              throw new Error("PAYMENT_REVIEW_CONFLICT");
            }

            // INI BAGIAN MENGUBAH STATUS PAYMENT MENJADI LUNAS
            const paymentUpdated = await tx.payment.updateMany({
              where: {
                id: payment.id,
                orderId: existingOrder.id,
                status: "MENUNGGU_VERIFIKASI",
              },
              data: {
                status: "LUNAS",
                verifiedAt: reviewedAt,
                paidAt: reviewedAt,
                verificationNote: null,
              },
            });

            if (paymentUpdated.count !== 1) {
              throw new Error("PAYMENT_REVIEW_CONFLICT");
            }
          } else {
            // INI BAGIAN MENGUBAH STATUS PAYMENT MENJADI GAGAL
            const paymentUpdated = await tx.payment.updateMany({
              where: {
                id: payment.id,
                orderId: existingOrder.id,
                status: "MENUNGGU_VERIFIKASI",
              },
              data: {
                status: "GAGAL",
                rejectedAt: reviewedAt,
                verificationNote,
              },
            });

            if (paymentUpdated.count !== 1) {
              throw new Error("PAYMENT_REVIEW_CONFLICT");
            }

            // INI BAGIAN MENGUBAH STATUS ORDER MENJADI GAGAL
            const orderUpdated = await tx.order.updateMany({
              where: {
                id: existingOrder.id,
                paymentStatus: "MENUNGGU_VERIFIKASI",
                status: {
                  notIn: ["Dibatalkan", "Selesai"],
                },
              },
              data: {
                paymentStatus: "GAGAL",
                paidAt: null,
              },
            });

            if (orderUpdated.count !== 1) {
              throw new Error("PAYMENT_REVIEW_CONFLICT");
            }
          }

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
            { message: "Pesanan tidak ditemukan." },
            { status: 404 },
          );
        }

        return NextResponse.json({
          message:
            data.action === "VERIFY_PAYMENT"
              ? "Pembayaran berhasil diverifikasi dan ditandai Lunas."
              : "Bukti pembayaran ditolak. Customer dapat mengirim bukti baru.",
          order: updatedOrder,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "PAYMENT_REVIEW_CONFLICT"
        ) {
          return NextResponse.json(
            {
              message:
                "Pembayaran sudah berubah. Muat ulang data sebelum mencoba lagi.",
            },
            {
              status: 409,
            },
          );
        }

        throw error;
      }
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
        data:
          targetStatus === "Dibatalkan"
            ? {
                status: targetStatus,
                paymentStatus: "DIBATALKAN",
              }
            : {
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
            status: {
              in: ["MENUNGGU_PEMBAYARAN", "MENUNGGU_VERIFIKASI"],
            },
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
