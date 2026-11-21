import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// INI BAGIAN MENGAMBIL STATISTIK DASHBOARD ADMIN
export async function GET() {
  try {
    // MEMERIKSA HAK AKSES ADMIN
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Akses hanya untuk administrator." },
        { status: 403 },
      );
    }

    // MENENTUKAN TANGGAL HARI INI DI JAKARTA
    const jakartaDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const [year, month, day] = jakartaDate.split("-").map(Number);

    const startOfDay = new Date(Date.UTC(year, month - 1, day, -7, 0, 0));

    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // MENGAMBIL DATA STATISTIK DARI DATABASE
    const [
      totalPesanan,
      pesananHariIni,
      pendapatan,
      totalMenu,
      menuTersedia,
      pesananTerbaru,
      totalItemTerjual,
      penjualanMenu,
      pembayaranBelumLunas,
      pesananMenungguKonfirmasi,
      pembayaranMenungguVerifikasi,
      totalCustomer,
    ] = await Promise.all([
      // MENGHITUNG SELURUH PESANAN
      prisma.order.count(),

      // MENGHITUNG PESANAN HARI INI
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      }),

      // MENGHITUNG PENDAPATAN DARI PEMBAYARAN LUNAS
      prisma.order.aggregate({
        where: {
          paymentStatus: "LUNAS",
        },
        _sum: {
          total: true,
        },
      }),

      // MENGHITUNG TOTAL MENU TERDAFTAR
      prisma.menu.count(),

      // MENGHITUNG MENU YANG TERSEDIA
      prisma.menu.count({
        where: {
          status: "Tersedia",
        },
      }),

      // MENGAMBIL LIMA PESANAN TERBARU
      prisma.order.findMany({
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      }),

      // MENGHITUNG ITEM TERJUAL
      // Hanya pesanan selesai dengan pembayaran lunas.
      prisma.orderItem.aggregate({
        where: {
          order: {
            is: {
              status: "Selesai",
              paymentStatus: "LUNAS",
            },
          },
        },
        _sum: {
          quantity: true,
        },
      }),

      // MENGAMBIL LIMA MENU TERLARIS
      prisma.orderItem.groupBy({
        by: ["menuName"],
        where: {
          order: {
            is: {
              status: "Selesai",
              paymentStatus: "LUNAS",
            },
          },
        },
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },
        take: 5,
      }),

      // MENGHITUNG PESANAN YANG BELUM LUNAS
      prisma.order.count({
        where: {
          paymentStatus: {
            in: [
              "BELUM_DIBAYAR",
              "MENUNGGU_PEMBAYARAN",
              "MENUNGGU_VERIFIKASI",
              "GAGAL",
            ],
          },
          status: {
            not: "Dibatalkan",
          },
        },
      }),

      // MENGHITUNG PESANAN MENUNGGU KONFIRMASI
      prisma.order.count({
        where: {
          status: "Menunggu Konfirmasi",
        },
      }),

      // MENGHITUNG PEMBAYARAN MENUNGGU VERIFIKASI
      prisma.order.count({
        where: {
          paymentStatus: "MENUNGGU_VERIFIKASI",
          status: {
            notIn: ["Dibatalkan", "Selesai"],
          },
        },
      }),

      // MENGHITUNG TOTAL CUSTOMER TERDAFTAR
      prisma.user.count({
        where: {
          role: "CUSTOMER",
        },
      }),
    ]);

    // MENGEMBALIKAN DATA DASHBOARD
    return NextResponse.json({
      statistics: {
        totalPesanan,
        pesananHariIni,
        totalPendapatan: pendapatan._sum.total ?? 0,
        totalMenu,
        menuTersedia,
        totalMenuTerjual: totalItemTerjual._sum.quantity ?? 0,
        pembayaranBelumLunas,
        pesananMenungguKonfirmasi,
        pembayaranMenungguVerifikasi,
        totalCustomer,
      },

      pesananTerbaru,

      // DATA MENU TERLARIS
      menuTerlaris: penjualanMenu.map((item) => ({
        name: item.menuName,
        quantity: item._sum.quantity ?? 0,
      })),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil statistik dashboard.",
      },
      {
        status: 500,
      },
    );
  }
}
