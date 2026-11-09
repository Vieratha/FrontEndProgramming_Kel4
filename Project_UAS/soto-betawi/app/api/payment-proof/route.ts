import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// INI BAGIAN BATAS UKURAN DAN JENIS FILE
const MAX_FILE_SIZE = 1 * 1024 * 1024;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// INI BAGIAN MENGUNGGAH BUKTI PEMBAYARAN CUSTOMER
export async function POST(request: Request) {
  try {
    // INI BAGIAN MEMBACA USER YANG SEDANG LOGIN
    const user = await getCurrentUser();

    // INI BAGIAN MEMBACA FORM DATA
    const formData = await request.formData();

    const orderNumberValue = formData.get("orderNumber");
    const payerNameValue = formData.get("payerName");
    const customerReferenceValue = formData.get("customerReference");
    const proofValue = formData.get("proof");

    // INI BAGIAN VALIDASI NOMOR PESANAN
    const orderNumber =
      typeof orderNumberValue === "string" ? orderNumberValue.trim() : "";

    if (!orderNumber) {
      return NextResponse.json(
        { message: "Nomor pesanan wajib diisi." },
        { status: 400 },
      );
    }

    // INI BAGIAN VALIDASI NAMA PENGIRIM
    const payerName =
      typeof payerNameValue === "string" ? payerNameValue.trim() : "";

    if (payerName.length < 3 || payerName.length > 100) {
      return NextResponse.json(
        { message: "Nama pengirim harus berisi 3 sampai 100 karakter." },
        { status: 400 },
      );
    }

    // INI BAGIAN VALIDASI REFERENSI TRANSAKSI
    const customerReference =
      typeof customerReferenceValue === "string"
        ? customerReferenceValue.trim()
        : "";

    if (customerReference.length > 100) {
      return NextResponse.json(
        { message: "Referensi transaksi maksimal 100 karakter." },
        { status: 400 },
      );
    }

    // INI BAGIAN VALIDASI FILE BUKTI
    if (!(proofValue instanceof File)) {
      return NextResponse.json(
        { message: "File bukti pembayaran wajib diunggah." },
        { status: 400 },
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(proofValue.type)) {
      return NextResponse.json(
        {
          message: "Format bukti hanya boleh JPG, PNG, atau WebP.",
        },
        { status: 400 },
      );
    }

    if (proofValue.size <= 0 || proofValue.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: "Ukuran file harus lebih dari 0 dan maksimal 1 MB.",
        },
        { status: 400 },
      );
    }

    // INI BAGIAN MENGUBAH FILE MENJADI DATA BINER
    const proofBuffer = Buffer.from(await proofValue.arrayBuffer());

    // INI BAGIAN MEMERIKSA SIGNATURE FILE
    // Pemeriksaan ini memastikan isi file sesuai dengan format gambar.
    const isJpeg =
      proofBuffer.length >= 3 &&
      proofBuffer[0] === 0xff &&
      proofBuffer[1] === 0xd8 &&
      proofBuffer[2] === 0xff;

    const isPng =
      proofBuffer.length >= 8 &&
      proofBuffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

    const isWebp =
      proofBuffer.length >= 12 &&
      proofBuffer.toString("ascii", 0, 4) === "RIFF" &&
      proofBuffer.toString("ascii", 8, 12) === "WEBP";

    const validFile =
      (proofValue.type === "image/jpeg" && isJpeg) ||
      (proofValue.type === "image/png" && isPng) ||
      (proofValue.type === "image/webp" && isWebp);

    if (!validFile) {
      return NextResponse.json(
        {
          message: "Isi file tidak sesuai dengan format gambar yang diizinkan.",
        },
        {
          status: 400,
        },
      );
    }

    // INI BAGIAN MENGAMBIL DATA PESANAN
    const order = await prisma.order.findUnique({
      where: {
        orderNumber,
      },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        total: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Pesanan tidak ditemukan." },
        { status: 404 },
      );
    }

    // INI BAGIAN MEMERIKSA KEPEMILIKAN PESANAN
    const isOwner =
      user !== null && user !== undefined && order.userId === user.id;

    const isGuestOrder = order.userId === null && user === null;

    if (!isOwner && !isGuestOrder) {
      return NextResponse.json(
        {
          message: "Pesanan tidak ditemukan atau akses ditolak.",
        },
        {
          status: 404,
        },
      );
    }

    // INI BAGIAN MEMERIKSA JENIS PEMBAYARAN
    if (
      order.paymentMethod !== "QRIS" &&
      order.paymentMethod !== "Transfer Bank"
    ) {
      return NextResponse.json(
        {
          message: "Upload bukti hanya berlaku untuk QRIS dan Transfer Bank.",
        },
        {
          status: 400,
        },
      );
    }

    // INI BAGIAN MEMERIKSA STATUS PESANAN
    if (order.status === "Dibatalkan" || order.status === "Selesai") {
      return NextResponse.json(
        {
          message: "Pesanan ini tidak dapat menerima bukti pembayaran.",
        },
        {
          status: 400,
        },
      );
    }

    // INI BAGIAN MEMERIKSA STATUS PEMBAYARAN
    if (
      order.paymentStatus === "LUNAS" ||
      order.paymentStatus === "MENUNGGU_VERIFIKASI"
    ) {
      return NextResponse.json(
        {
          message: "Pembayaran sudah lunas atau sedang menunggu verifikasi.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      order.paymentStatus !== "MENUNGGU_PEMBAYARAN" &&
      order.paymentStatus !== "GAGAL"
    ) {
      return NextResponse.json(
        {
          message: "Status pembayaran tidak mengizinkan upload bukti.",
        },
        {
          status: 400,
        },
      );
    }

    // INI BAGIAN MENYIMPAN BUKTI PEMBAYARAN
    const result = await prisma.$transaction(async (tx) => {
      // Ambil transaksi terakhir untuk pesanan ini.
      const latestPayment = await tx.payment.findFirst({
        where: {
          orderId: order.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // INI BAGIAN MEMASTIKAN TRANSAKSI MASIH DAPAT DIPROSES
      if (
        latestPayment &&
        latestPayment.status !== "MENUNGGU_PEMBAYARAN" &&
        latestPayment.status !== "GAGAL" &&
        latestPayment.status !== "DIBATALKAN" &&
        latestPayment.status !== "KEDALUWARSA"
      ) {
        return {
          error: "Transaksi pembayaran terakhir tidak dapat digunakan.",
          status: 409,
        };
      }

      // INI BAGIAN MENGUNCI STATUS PESANAN
      const updatedOrder = await tx.order.updateMany({
        where: {
          id: order.id,
          paymentStatus: order.paymentStatus,
          status: {
            notIn: ["Dibatalkan", "Selesai"],
          },
        },
        data: {
          paymentStatus: "MENUNGGU_VERIFIKASI",
        },
      });

      if (updatedOrder.count !== 1) {
        return {
          error: "Status pesanan sudah berubah. Silakan muat ulang.",
          status: 409,
        };
      }

      // INI BAGIAN DATA BUKTI PEMBAYARAN
      const proofData = {
        payerName,
        customerReference: customerReference || null,
        proofData: proofBuffer,
        proofMimeType: proofValue.type,
        proofFileName: proofValue.name
          .replace(/[\\/:*?"<>|]/g, "_")
          .slice(0, 150),
        submittedAt: new Date(),
        status: "MENUNGGU_VERIFIKASI",
      };

      // INI BAGIAN MEMPERBARUI ATAU MEMBUAT TRANSAKSI BARU
      if (latestPayment && latestPayment.status === "MENUNGGU_PEMBAYARAN") {
        await tx.payment.update({
          where: {
            id: latestPayment.id,
          },
          data: proofData,
        });
      } else {
        // Percobaan baru dibuat sebagai Payment record baru.
        // Bukti yang ditolak sebelumnya tetap tersimpan.
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: "MANUAL",
            method: order.paymentMethod === "QRIS" ? "QRIS" : "TRANSFER_BANK",
            reference: `${order.paymentMethod === "QRIS" ? "QRIS" : "TRANSFER"}-${order.orderNumber}-${randomBytes(4).toString("hex").toUpperCase()}`,
            amount: order.total,
            ...proofData,
          },
        });
      }

      return {
        success: true,
      };
    });

    if ("error" in result) {
      return NextResponse.json(
        {
          message: result.error,
        },
        {
          status: result.status,
        },
      );
    }

    // INI BAGIAN MENGAMBIL TRANSAKSI TERBARU SETELAH UPLOAD
    const latestPayment = await prisma.payment.findFirst({
      where: {
        orderId: order.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        method: true,
        reference: true,
        status: true,
        amount: true,
        payerName: true,
        customerReference: true,
        proofFileName: true,
        submittedAt: true,
        rejectedAt: true,
        verificationNote: true,
        createdAt: true,
      },
    });

    // INI BAGIAN MENGIRIM HASIL UPLOAD KE CUSTOMER
    return NextResponse.json(
      {
        message:
          "Bukti pembayaran berhasil dikirim dan sedang menunggu verifikasi admin.",
        payment: latestPayment,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Payment proof upload error:", error);

    return NextResponse.json(
      {
        message: "Gagal mengirim bukti pembayaran.",
      },
      {
        status: 500,
      },
    );
  }
}
