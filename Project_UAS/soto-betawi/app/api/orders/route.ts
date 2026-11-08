import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

// INI BAGIAN TIPE DATA ITEM CHECKOUT
type CheckoutItem = {
  menuId: number;
  quantity: number;
};

// INI BAGIAN MEMERIKSA OBJECT REQUEST
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// INI BAGIAN MENGAMBIL DATA PESANAN
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);

    const orderNumber = searchParams.get("order")?.trim();

    // INI BAGIAN MENGAMBIL SATU PESANAN BERDASARKAN NOMOR
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

      // Nomor pesanan acak menjadi kode akses untuk membuka struk.
      // Jangan membagikan nomor pesanan kepada orang yang tidak dipercaya.

      return NextResponse.json({
        order,
      });
    }

    // INI BAGIAN MEMERIKSA LOGIN UNTUK RIWAYAT PESANAN
    if (!user) {
      return NextResponse.json(
        {
          message: "Silakan login untuk melihat seluruh riwayat pesanan.",
        },
        {
          status: 401,
        },
      );
    }

    // INI BAGIAN MENENTUKAN PESANAN BERDASARKAN ROLE
    const where =
      user.role === "ADMIN"
        ? {}
        : {
            userId: user.id,
          };

    const orders = await prisma.order.findMany({
      where,
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

// INI BAGIAN MEMBUAT PESANAN BARU
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    // INI BAGIAN MEMERIKSA FORMAT REQUEST
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

    // INI BAGIAN DATA CUSTOMER
    const customerName =
      typeof body.customerName === "string" ? body.customerName.trim() : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim().replace(/[\s-]/g, "")
        : "";

    const address = typeof body.address === "string" ? body.address.trim() : "";

    const paymentMethod =
      typeof body.paymentMethod === "string" ? body.paymentMethod.trim() : "";

    // INI BAGIAN JENIS PESANAN
    const orderType =
      typeof body.orderType === "string" ? body.orderType.trim() : "";

    const tableNumber =
      typeof body.tableNumber === "string" ? body.tableNumber.trim() : "";

    const note = typeof body.note === "string" ? body.note.trim() : "";

    // INI BAGIAN VALIDASI NAMA CUSTOMER
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

    // INI BAGIAN VALIDASI NOMOR TELEPON
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

    // INI BAGIAN VALIDASI ALAMAT
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

    // INI BAGIAN VALIDASI METODE PEMBAYARAN
    const allowedPayments = [
      "Bayar di Kasir",
      "COD",
      "Transfer Bank",
      "E-Wallet",
    ];

    if (paymentMethod && !allowedPayments.includes(paymentMethod)) {
      return NextResponse.json(
        {
          message: "Metode pembayaran tidak valid.",
        },
        {
          status: 400,
        },
      );
    }

    // INI BAGIAN VALIDASI JENIS PESANAN
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

    // INI BAGIAN VALIDASI NOMOR MEJA
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

    // INI BAGIAN VALIDASI KERANJANG
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

    // INI BAGIAN MENCEGAH MENU DUPLIKAT
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

    // INI BAGIAN MENGAMBIL HARGA MENU DARI DATABASE
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

    // INI BAGIAN MENYUSUN ITEM PESANAN
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

    // INI BAGIAN MENGHITUNG TOTAL HARGA
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

    // INI BAGIAN MENGAMBIL USER YANG SEDANG LOGIN
    // Customer yang belum login tetap dapat melakukan pemesanan.
    const user = await getCurrentUser();

    // INI BAGIAN MEMBUAT NOMOR PESANAN ACAK
    const orderNumber = `SB-${randomBytes(16).toString("hex").toUpperCase()}`;

    // INI BAGIAN MENYIMPAN PESANAN KE DATABASE
    const order = await prisma.order.create({
      data: {
        orderNumber,

        // Hubungkan pesanan dengan akun jika customer sudah login.
        userId: user?.id ?? null,

        customerName,
        phone: phone || null,
        address: address || null,
        paymentMethod: paymentMethod || "Bayar di Kasir",

        orderType,

        tableNumber: orderType === "Makan di Tempat" ? tableNumber : null,

        note: note || null,

        total,
        status: "Menunggu Konfirmasi",

        // INI BAGIAN MENYIMPAN RINCIAN ITEM PESANAN
        items: {
          create: orderItems,
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
