-- CreateTable
CREATE TABLE "Faq" (
    "id" SERIAL NOT NULL,
    "question" VARCHAR(200) NOT NULL,
    "answer" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Faq_isActive_sortOrder_idx" ON "Faq"("isActive", "sortOrder");

-- INI BAGIAN MENAMBAHKAN FAQ AWAL
INSERT INTO "Faq" (
  "question",
  "answer",
  "isActive",
  "sortOrder",
  "updatedAt"
)
VALUES
(
  'Apa saja menu yang tersedia?',
  'Daftar menu dan harga terbaru dapat dilihat pada bagian Menu di halaman utama. Ketersediaan menu dapat berubah.',
  true,
  1,
  CURRENT_TIMESTAMP
),
(
  'Apakah Soto Betawi bisa dibawa pulang?',
  'Bisa. Kuah dan isian dapat dipisah supaya tetap praktis dibawa pulang.',
  true,
  2,
  CURRENT_TIMESTAMP
);