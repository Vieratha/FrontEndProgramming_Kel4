-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "customerReference" TEXT,
ADD COLUMN     "payerName" TEXT,
ADD COLUMN     "proofData" BYTEA,
ADD COLUMN     "proofFileName" TEXT,
ADD COLUMN     "proofMimeType" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "verificationNote" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
