-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "note" TEXT,
ADD COLUMN     "orderType" TEXT NOT NULL DEFAULT 'Bawa Pulang',
ADD COLUMN     "tableNumber" TEXT,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "paymentMethod" DROP NOT NULL;
