import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

type CheckoutItem = {
  menuId: number;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Silakan login sebelum melakukan checkout." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const customerName = String(body.customerName ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();
    const paymentMethod = String(body.paymentMethod ?? "").trim();

    if (customerName.length < 3) {
      return NextResponse.json(
        { message: "Nama minimal 3 karakter." },
        { status: 400 },
      );
    }

    if (!/^08[0-9]{8,11}$/.test(phone.replace(/[\s-]/g, ""))) {
      return NextResponse.json(
        { message: "Nomor telepon tidak valid." },
        { status: 400 },
      );
    }

    if (address.length < 10) {
      return NextResponse.json(
        { message: "Alamat minimal 10 karakter." },
        { status: 400 },
      );
    }

    if (!["COD", "Transfer Bank", "E-Wallet"].includes(paymentMethod)) {
      return NextResponse.json(
        { message: "Metode pembayaran tidak valid." },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { message: "Keranjang masih kosong." },
        { status: 400 },
      );
    }

    const items: CheckoutItem[] = body.items.map(
      (item: { menuId: number; quantity: number }) => ({
        menuId: Number(item.menuId),
        quantity: Number(item.quantity),
      }),
    );

    if (
      items.some(
        (item) =>
          !Number.isSafeInteger(item.menuId) ||
          item.menuId <= 0 ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity <= 0 ||
          item.quantity > 99,
      )
    ) {
      return NextResponse.json(
        { message: "Data menu atau jumlah pesanan tidak valid." },
        { status: 400 },
      );
    }

    const menuIds = items.map((item) => item.menuId);

    if (new Set(menuIds).size !== menuIds.length) {
      return NextResponse.json(
        { message: "Menu duplikat pada keranjang tidak valid." },
        { status: 400 },
      );
    }

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
        { message: "Ada menu yang sudah tidak tersedia." },
        { status: 400 },
      );
    }

    const orderItems = items.map((item) => {
      const menu = menus.find((candidate) => candidate.id === item.menuId)!;

      return {
        menuId: menu.id,
        menuName: menu.name,
        price: menu.price,
        quantity: item.quantity,
      };
    });

    const total = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const orderNumber = `SB-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        customerName,
        phone: phone.replace(/[\s-]/g, ""),
        address,
        paymentMethod,
        total,
        status: "Menunggu Konfirmasi",
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(
      {
        message: "Pesanan berhasil dibuat.",
        order,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Checkout API error:", error);

    return NextResponse.json(
      { message: "Gagal membuat pesanan." },
      { status: 500 },
    );
  }
}
