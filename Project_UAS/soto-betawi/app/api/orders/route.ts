import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
import { randomBytes } from "crypto";
import { PAYMENT_AVAILABILITY } from "@/app/lib/payment-info";

export const runtime = "nodejs";

// Data item yang dikirim saat checkout.
type CheckoutItem = {
  menuId: number;
  quantity: number;
};

// Field pembayaran yang boleh ditampilkan kepada customer.
// Isi file bukti tidak dikirim melalui API detail atau riwayat pesanan.
const customerPaymentSelect = {
  id: true,
  method: true,
  reference: true,
  status: true,
  amount: true,
  payerName: true,
  customerReference: true,
  proofFileName: true,
  submittedAt: true,
  verifiedAt: true,
  rejectedAt: true,
  verificationNote: true,
  paidAt: true,
  createdAt: true,
} as const;

// Memeriksa format object request.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Mengambil data pesanan.
export async function GET(request: Request) {
  try {
    // Memeriksa user yang sedang login.
    const user = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("order")?.trim();

    // Mengambil satu pesanan berdasarkan nomor pesanan.
    if (orderNumber) {
      const order = await prisma.order.findUnique({
        where: {
          orderNumber,
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
            select: customerPaymentSelect,
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          {
            message: "Pesanan tidak ditemukan.",
          },
          {
            status: 404,
          },
        );
      }

      // Memeriksa hak akses terhadap pesanan.
      const isAdmin = user?.role === "ADMIN";

      const isOwner =
        user !== null && user !== undefined && order.userId === user.id;

      // Guest hanya dapat membuka pesanan guest
      // selama tidak sedang menggunakan akun lain.
      const isGuestOrder = order.userId === null && !user;

      if (!isAdmin && !isOwner && !isGuestOrder) {
        return NextResponse.json(
          {
            message: "Pesanan tidak ditemukan atau akses ditolak.",
          },
          {
            status: 404,
          },
        );
      }

      return NextResponse.json({
        order,
      });
    }

    // Memeriksa session sebelum mengambil riwayat pesanan.
    if (!user) {
      return NextResponse.json(
        {
          message: "Silakan login untuk melihat riwayat pesanan akun.",
        },
        {
          status: 401,
        },
      );
    }

    // Menentukan data pesanan sesuai role user.
    const where =
      user.role === "ADMIN"
        ? {}
        : {
            userId: user.id,
          };

    // Mengambil daftar pesanan dari database.
    const orders = await prisma.order.findMany({
      where,
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
          select: customerPaymentSelect,
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
    console.error("Gagal mengambil pesanan:", error);

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

// Proses pembuatan pesanan baru.
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    // Memvalidasi format data checkout.
    if (!isRecord(body)) {
      return NextResponse.json(
        {
          message: "Format data pesanan tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    // Mengambil data customer dari request.
    const customerName =
      typeof body.customerName === "string" ? body.customerName.trim() : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim().replace(/[\s-]/g, "")
        : "";

    const address = typeof body.address === "string" ? body.address.trim() : "";

    const paymentMethod =
      typeof body.paymentMethod === "string" ? body.paymentMethod.trim() : "";

    // Memeriksa jenis pesanan.
    const orderType =
      typeof body.orderType === "string" ? body.orderType.trim() : "";

    const tableNumber =
      typeof body.tableNumber === "string" ? body.tableNumber.trim() : "";

    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (customerName.length < 3 || customerName.length > 100) {
      return NextResponse.json(
        {
          message: "Nama pemesan harus berisi 3 sampai 100 karakter.",
        },
        {
          status: 400,
        },
      );
    }

    if (phone && !/^08[0-9]{8,11}$/.test(phone)) {
      return NextResponse.json(
        {
          message: "Nomor telepon tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    if (address && address.length < 10) {
      return NextResponse.json(
        {
          message: "Alamat harus berisi minimal 10 karakter.",
        },
        {
          status: 400,
        },
      );
    }

    // Validasi metode pembayaran.
    const selectedPaymentMethod = paymentMethod || "Bayar di Kasir";

    // Metode online hanya tersedia jika konfigurasi sudah lengkap.
    const allowedPayments = ["Bayar di Kasir"];

    if (PAYMENT_AVAILABILITY.qris) {
      allowedPayments.push("QRIS");
    }

    if (PAYMENT_AVAILABILITY.bankTransfer) {
      allowedPayments.push("Transfer Bank");
    }

    if (!allowedPayments.includes(selectedPaymentMethod)) {
      return NextResponse.json(
        {
          message: "Metode pembayaran tidak tersedia atau belum dikonfigurasi.",
        },
        {
          status: 400,
        },
      );
    }

    const allowedOrderTypes = ["Makan di Tempat", "Bawa Pulang"];

    if (!allowedOrderTypes.includes(orderType)) {
      return NextResponse.json(
        {
          message: "Jenis pesanan tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    if (orderType === "Makan di Tempat" && !/^[0-9]{1,4}$/.test(tableNumber)) {
      return NextResponse.json(
        {
          message: "Nomor meja wajib diisi dengan 1 sampai 4 digit.",
        },
        {
          status: 400,
        },
      );
    }

    if (note.length > 500) {
      return NextResponse.json(
        {
          message: "Catatan maksimal 500 karakter.",
        },
        {
          status: 400,
        },
      );
    }

    // Validasi item pada keranjang.
    if (
      !Array.isArray(body.items) ||
      body.items.length === 0 ||
      body.items.length > 30
    ) {
      return NextResponse.json(
        {
          message: "Keranjang kosong atau jumlah menu tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    const items: CheckoutItem[] = [];

    for (const rawItem of body.items) {
      if (!isRecord(rawItem)) {
        return NextResponse.json(
          {
            message: "Data item pesanan tidak valid.",
          },
          {
            status: 400,
          },
        );
      }

      const menuId = Number(rawItem.menuId);
      const quantity = Number(rawItem.quantity);

      if (
        !Number.isSafeInteger(menuId) ||
        menuId <= 0 ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0 ||
        quantity > 99
      ) {
        return NextResponse.json(
          {
            message: "ID menu atau jumlah pesanan tidak valid.",
          },
          {
            status: 400,
          },
        );
      }

      items.push({
        menuId,
        quantity,
      });
    }

    // Menggabungkan item menu yang duplikat.
    const menuIds = items.map((item) => item.menuId);

    if (new Set(menuIds).size !== menuIds.length) {
      return NextResponse.json(
        {
          message: "Menu duplikat pada keranjang tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    // Mengambil harga menu terbaru dari database.
    const menus = await prisma.menu.findMany({
      where: {
        id: {
          in: menuIds,
        },
        status: "Tersedia",
      },
    });

    if (menus.length !== items.length) {
      return NextResponse.json(
        {
          message: "Ada menu yang sudah tidak tersedia.",
        },
        {
          status: 400,
        },
      );
    }

    // Menyusun rincian item pesanan.
    const menuMap = new Map(menus.map((menu) => [menu.id, menu]));

    const orderItems = items.map((item) => {
      const menu = menuMap.get(item.menuId);

      if (!menu) {
        throw new Error("Data menu tidak ditemukan.");
      }

      return {
        menuId: menu.id,
        menuName: menu.name,
        price: menu.price,
        quantity: item.quantity,
      };
    });

    // Menghitung total berdasarkan harga dari database.
    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    if (!Number.isSafeInteger(total) || total <= 0) {
      return NextResponse.json(
        {
          message: "Total pesanan tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    // Mengambil user yang sedang login.
    // Customer yang belum login tetap dapat melakukan pemesanan.
    const user = await getCurrentUser();

    // Membuat nomor pesanan.
    const orderNumber = `SB-${randomBytes(16).toString("hex").toUpperCase()}`;

    // Menentukan status awal pembayaran.
    const isCashierPayment = selectedPaymentMethod === "Bayar di Kasir";

    const paymentStatus = isCashierPayment
      ? "BELUM_DIBAYAR"
      : "MENUNGGU_PEMBAYARAN";

    const paymentMethodCode =
      selectedPaymentMethod === "Bayar di Kasir"
        ? "KASIR"
        : selectedPaymentMethod === "QRIS"
          ? "QRIS"
          : "TRANSFER_BANK";

    // Membuat referensi transaksi pembayaran.
    const paymentReference = `${paymentMethodCode}-${orderNumber}`;

    // Menyimpan pesanan dan pembayaran ke database.
    // Nested write memastikan semua data tersimpan bersama.
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user?.id ?? null,

        customerName,
        phone: phone || null,
        address: address || null,
        paymentMethod: selectedPaymentMethod,

        orderType,

        tableNumber: orderType === "Makan di Tempat" ? tableNumber : null,

        note: note || null,

        total,
        status: "Menunggu Konfirmasi",

        // Status awal transaksi pembayaran.
        paymentStatus,
        paidAt: null,

        // Menyimpan rincian item pesanan.
        items: {
          create: orderItems,
        },

        // Membuat catatan transaksi pembayaran.
        payments: {
          create: {
            provider: "MANUAL",
            method: paymentMethodCode,
            reference: paymentReference,
            status: "MENUNGGU_PEMBAYARAN",
            amount: total,
          },
        },
      },

      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Pesanan berhasil dibuat.",
        order,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Checkout API error:", error);

    return NextResponse.json(
      {
        message: "Gagal membuat pesanan.",
      },
      {
        status: 500,
      },
    );
  }
}
