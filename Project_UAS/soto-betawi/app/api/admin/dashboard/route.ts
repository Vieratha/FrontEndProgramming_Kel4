import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// INI BAGIAN MENGAMBIL STATISTIK DASHBOARD ADMIN
export async function GET() {
  try {
    // INI BAGIAN MEMERIKSA HAK AKSES ADMIN
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

    // INI BAGIAN MENENTUKAN TANGGAL HARI INI DI JAKARTA
    const now = new Date();

    const jakartaDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const [year, month, day] = jakartaDate.split("-").map(Number);

    const startOfDay = new Date(Date.UTC(year, month - 1, day, -7, 0, 0));

    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // INI BAGIAN MENGAMBIL DATA STATISTIK DARI DATABASE
    const [
      totalPesanan,
      pesananHariIni,
      pendapatan,
      totalMenu,
      menuTersedia,
      pesananTerbaru,
      totalItemTerjual,
      penjualanMenu,
    ] = await Promise.all([
      // INI BAGIAN MENGHITUNG SEMUA PESANAN
      prisma.order.count(),

      // INI BAGIAN MENGHITUNG PESANAN HARI INI
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      }),

      // INI BAGIAN MENGHITUNG NILAI PESANAN SELESAI
      prisma.order.aggregate({
        where: {
          status: "Selesai",
        },
        _sum: {
          total: true,
        },
      }),

      // INI BAGIAN MENGHITUNG TOTAL MENU
      prisma.menu.count(),

      // INI BAGIAN MENGHITUNG MENU TERSEDIA
      prisma.menu.count({
        where: {
          status: "Tersedia",
        },
      }),

      // INI BAGIAN MENGAMBIL LIMA PESANAN TERBARU
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
          createdAt: true,
        },
      }),

      // INI BAGIAN MENGHITUNG SELURUH ITEM TERJUAL
      prisma.orderItem.aggregate({
        where: {
          order: {
            is: {
              status: "Selesai",
            },
          },
        },
        _sum: {
          quantity: true,
        },
      }),

      // INI BAGIAN MENGAMBIL LIMA MENU TERLARIS
      prisma.orderItem.groupBy({
        by: ["menuName"],
        where: {
          order: {
            is: {
              status: "Selesai",
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
    ]);

    // INI BAGIAN MENGEMBALIKAN DATA DASHBOARD
    return NextResponse.json({
      statistics: {
        totalPesanan,
        pesananHariIni,
        totalPendapatan: pendapatan._sum.total ?? 0,
        totalMenu,
        menuTersedia,
        totalMenuTerjual: totalItemTerjual._sum.quantity ?? 0,
      },

      pesananTerbaru,

      // INI BAGIAN DATA MENU TERLARIS
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
