-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'BELUM_DIBAYAR';

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MANUAL',
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "transactionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN',
    "amount" INTEGER NOT NULL,
    "paymentUrl" TEXT,
    "qrCodeUrl" TEXT,
    "virtualAccountNumber" TEXT,
    "bankName" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transactionId_key" ON "Payment"("transactionId");

-- CreateIndex
CREATE INDEX "Payment_orderId_createdAt_idx" ON "Payment"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- INI BAGIAN MIGRASI DATA PESANAN LAMA
-- Pesanan yang sudah berstatus Selesai dianggap telah dibayar,
-- sesuai alur konfirmasi kasir pada versi sebelumnya.
UPDATE "Order"
SET
  "paymentStatus" = 'LUNAS',
  "paidAt" = "updatedAt"
WHERE "status" = 'Selesai';

-- INI BAGIAN MENCATAT PEMBAYARAN PESANAN LAMA
-- Waktu paidAt menggunakan updatedAt sebagai perkiraan waktu pembayaran.
-- Detail transaksi gateway untuk pesanan lama memang belum tersedia.
INSERT INTO "Payment" (
  "id",
  "orderId",
  "provider",
  "method",
  "status",
  "amount",
  "paidAt",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy_' || "id",
  "id",
  'MANUAL',
  CASE
    WHEN "paymentMethod" = 'QRIS' THEN 'QRIS'
    WHEN "paymentMethod" = 'Transfer Bank' THEN 'TRANSFER_BANK'
    ELSE 'KASIR'
  END,
  'LUNAS',
  "total",
  "updatedAt",
  "updatedAt",
  "updatedAt"
FROM "Order"
WHERE "status" = 'Selesai';