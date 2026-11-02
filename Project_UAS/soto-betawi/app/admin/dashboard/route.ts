import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
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

    // Awal hari berdasarkan zona waktu Jakarta
    const now = new Date();

    const jakartaDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

    const [year, month, day] = jakartaDate.split("-").map(Number);

    // Konversi tengah malam Jakarta menjadi UTC
    const startOfDay = new Date(Date.UTC(year, month - 1, day, -7, 0, 0));

    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalPesanan,
      pesananHariIni,
      totalPendapatan,
      totalMenu,
      menuTersedia,
      pesananTerbaru,
      penjualanMenu,
    ] = await Promise.all([
      prisma.order.count(),

      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      }),

      // Hanya pesanan yang sudah dikonfirmasi/selesai
      prisma.order.aggregate({
        where: {
          status: "Selesai",
        },
        _sum: {
          total: true,
        },
      }),

      prisma.menu.count(),

      prisma.menu.count({
        where: {
          status: "Tersedia",
        },
      }),

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

      prisma.orderItem.groupBy({
        by: ["menuName"],
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

    const menuTerlaris = penjualanMenu.map((item) => ({
      name: item.menuName,
      quantity: item._sum.quantity ?? 0,
    }));

    return NextResponse.json({
      statistics: {
        totalPesanan,
        pesananHariIni,
        totalPendapatan: totalPendapatan._sum.total ?? 0,
        totalMenu,
        menuTersedia,
      },
      pesananTerbaru,
      menuTerlaris,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { message: "Gagal mengambil statistik dashboard." },
      { status: 500 },
    );
  }
}
