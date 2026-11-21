"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import { PAYMENT_INFO } from "@/app/lib/payment-info";

// Data pembayaran dari API.
export type PaymentSummary = {
  id: string;
  method: string;
  reference: string | null;
  status: string;
  amount: number;
  payerName: string | null;
  customerReference: string | null;
  proofFileName: string | null;
  submittedAt: string | null;
  verifiedAt?: string | null;
  rejectedAt: string | null;
  verificationNote: string | null;
  paidAt?: string | null;
  createdAt: string;
};

// Props form pembayaran.
type PaymentProofFormProps = {
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string | null;
  paymentStatus: string;
  total: number;
  payments: PaymentSummary[];
  onPaymentUpdate: (payment: PaymentSummary) => void;
};

function formatRupiah(angka: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);
}

function getPaymentLabel(status: string) {
  const labels: Record<string, string> = {
    BELUM_DIBAYAR: "Belum Dibayar",
    MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
    MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
    LUNAS: "Lunas",
    GAGAL: "Bukti Ditolak",
    KEDALUWARSA: "Kedaluwarsa",
    DIBATALKAN: "Dibatalkan",
    DIKEMBALIKAN: "Dikembalikan",
  };

  return labels[status] || status;
}

function formatTanggal(tanggal: string) {
  return new Date(tanggal).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function PaymentProofForm({
  orderNumber,
  orderStatus,
  paymentMethod,
  paymentStatus,
  total,
  payments,
  onPaymentUpdate,
}: PaymentProofFormProps) {
  // Status pembayaran mengikuti halaman konfirmasi.
  const currentStatus = paymentStatus;
  const latestPayment = payments[0] ?? null;

  const [payerName, setPayerName] = useState("");
  const [customerReference, setCustomerReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // INI BAGIAN FORMAT FILE YANG DIIZINKAN
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxFileSize = 1 * 1024 * 1024;

  // INI BAGIAN MEMERIKSA METODE PEMBAYARAN
  const isQris = paymentMethod === "QRIS";
  const isBankTransfer = paymentMethod === "Transfer Bank";
  const isOnlinePayment = isQris || isBankTransfer;

  // INI BAGIAN MEMERIKSA KELENGKAPAN INSTRUKSI PEMBAYARAN
  const paymentInfoReady = isQris
    ? Boolean(PAYMENT_INFO.qris.imagePath.trim())
    : isBankTransfer
      ? Boolean(
          PAYMENT_INFO.bankTransfer.bankName.trim() &&
          PAYMENT_INFO.bankTransfer.accountNumber.trim() &&
          PAYMENT_INFO.bankTransfer.accountName.trim(),
        )
      : false;

  // Metode kasir tetap menggunakan proses konfirmasi admin yang sudah ada.
  if (!isOnlinePayment) {
    return (
      <section className="payment-proof-card">
        <h2>Informasi Pembayaran</h2>

        <div className="payment-proof-info">
          <strong>Bayar di Kasir</strong>
          <p>
            Silakan lakukan pembayaran langsung kepada kasir restoran.
            Pembayaran akan dikonfirmasi oleh admin setelah uang diterima.
          </p>
        </div>
      </section>
    );
  }

  // INI BAGIAN MEMPROSES UPLOAD BUKTI PEMBAYARAN
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (submitting) return;

    if (orderStatus === "Dibatalkan" || orderStatus === "Selesai") {
      setError("Pesanan ini tidak dapat menerima bukti pembayaran.");
      return;
    }

    if (!paymentInfoReady) {
      setError(
        "Informasi pembayaran restoran belum dikonfigurasi. Hubungi administrator.",
      );
      return;
    }

    if (payerName.trim().length < 3 || payerName.trim().length > 100) {
      setError("Nama pengirim harus berisi 3 sampai 100 karakter.");
      return;
    }

    if (!proofFile) {
      setError("Pilih gambar bukti pembayaran terlebih dahulu.");
      return;
    }

    if (!allowedTypes.includes(proofFile.type)) {
      setError("Format file hanya boleh JPG, PNG, atau WebP.");
      return;
    }

    if (proofFile.size <= 0 || proofFile.size > maxFileSize) {
      setError("Ukuran file harus lebih dari 0 dan maksimal 1 MB.");
      return;
    }

    setSubmitting(true);

    try {
      // INI BAGIAN MENYUSUN FORM DATA
      const formData = new FormData();

      formData.append("orderNumber", orderNumber);
      formData.append("payerName", payerName.trim());
      formData.append("customerReference", customerReference.trim());
      formData.append("proof", proofFile);

      // INI BAGIAN MENGIRIM BUKTI KE API
      const response = await fetch("/api/payment-proof", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengirim bukti pembayaran.");
      }

      // INI BAGIAN MEMERIKSA RESPONS PEMBAYARAN
      if (!result.payment || typeof result.payment.id !== "string") {
        throw new Error("Respons pembayaran dari server tidak lengkap.");
      }

      onPaymentUpdate(result.payment as PaymentSummary);

      setSuccess(
        "Bukti pembayaran berhasil dikirim. Admin akan memeriksa pembayaranmu.",
      );

      // INI BAGIAN MENGOSONGKAN FORM
      setPayerName("");
      setCustomerReference("");
      setProofFile(null);

      const fileInput = document.getElementById(
        "payment-proof-file",
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengirim bukti.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="payment-proof-card">
      <div className="payment-proof-header">
        <h2>{isQris ? "Pembayaran QRIS" : "Pembayaran Transfer Bank"}</h2>

        <p>Nomor Pesanan: {orderNumber}</p>
      </div>

      <div className="payment-proof-total">
        <span>Total yang harus dibayar</span>
        <strong>{formatRupiah(total)}</strong>
      </div>

      {/* INI BAGIAN STATUS PEMBAYARAN */}
      <div className="payment-proof-status">
        <span>Status Pembayaran</span>

        <strong
          className={
            currentStatus === "LUNAS"
              ? "payment-status-text paid"
              : currentStatus === "GAGAL"
                ? "payment-status-text failed"
                : "payment-status-text unpaid"
          }
        >
          {getPaymentLabel(currentStatus)}
        </strong>
      </div>

      {/* INI BAGIAN INSTRUKSI QRIS */}
      {isQris && paymentInfoReady && (
        <div className="payment-proof-instruction">
          <h3>Scan QRIS Restoran</h3>

          <Image
            src={PAYMENT_INFO.qris.imagePath}
            alt="QRIS resmi Soto Betawi Jakarta"
            width={640}
            height={640}
            sizes="(max-width: 640px) 100vw, 480px"
            className="payment-qris-image"
          />

          <p>
            Scan QRIS menggunakan aplikasi pembayaran yang mendukung QRIS.
            Pastikan nominal pembayaran sesuai dengan total pesanan.
          </p>

          <p>
            Nama Merchant: <strong>{PAYMENT_INFO.qris.merchantName}</strong>
          </p>
        </div>
      )}

      {/* INI BAGIAN INSTRUKSI TRANSFER BANK */}
      {isBankTransfer && paymentInfoReady && (
        <div className="payment-proof-instruction">
          <h3>Rekening Tujuan</h3>

          <div className="payment-bank-detail">
            <span>Bank</span>
            <strong>{PAYMENT_INFO.bankTransfer.bankName}</strong>
          </div>

          <div className="payment-bank-detail">
            <span>Nomor Rekening</span>
            <strong>{PAYMENT_INFO.bankTransfer.accountNumber}</strong>
          </div>

          <div className="payment-bank-detail">
            <span>Nama Pemilik Rekening</span>
            <strong>{PAYMENT_INFO.bankTransfer.accountName}</strong>
          </div>

          <p>
            Transfer sesuai nominal pesanan, kemudian unggah bukti transfer yang
            menampilkan informasi transaksi.
          </p>
        </div>
      )}

      {!paymentInfoReady && (
        <div className="payment-proof-warning">
          Informasi QRIS atau rekening belum dikonfigurasi oleh administrator.
          Silakan hubungi restoran.
        </div>
      )}

      {currentStatus === "LUNAS" && (
        <div className="payment-proof-success">
          Pembayaran telah diverifikasi oleh administrator. Terima kasih!
        </div>
      )}

      {/* INI BAGIAN STATUS MENUNGGU VERIFIKASI */}
      {currentStatus === "MENUNGGU_VERIFIKASI" && (
        <div className="payment-proof-pending">
          <strong>Bukti pembayaran sudah diterima.</strong>
          <p>
            Silakan tunggu admin memeriksa transaksi. Kamu tidak perlu
            mengunggah bukti yang sama lagi.
          </p>

          {latestPayment?.submittedAt && (
            <small>
              Dikirim pada: {formatTanggal(latestPayment.submittedAt)}
            </small>
          )}
        </div>
      )}

      {currentStatus === "GAGAL" && latestPayment?.verificationNote && (
        <div className="payment-proof-rejected">
          <strong>Bukti sebelumnya ditolak.</strong>
          <p>{latestPayment.verificationNote}</p>
          <small>Silakan periksa kembali dan kirim bukti yang benar.</small>
        </div>
      )}

      {/* INI BAGIAN FORM UPLOAD BUKTI */}
      {(currentStatus === "MENUNGGU_PEMBAYARAN" || currentStatus === "GAGAL") &&
        orderStatus !== "Dibatalkan" &&
        orderStatus !== "Selesai" &&
        paymentInfoReady && (
          <form className="payment-proof-form" onSubmit={handleSubmit}>
            <h3>Kirim Bukti Pembayaran</h3>

            <div className="payment-proof-field">
              <label htmlFor="payerName">Nama Pengirim</label>

              <input
                id="payerName"
                type="text"
                value={payerName}
                onChange={(event) => setPayerName(event.target.value)}
                placeholder="Masukkan nama pemilik rekening"
                minLength={3}
                maxLength={100}
                required
              />
            </div>

            <div className="payment-proof-field">
              <label htmlFor="customerReference">
                Nomor Referensi Transaksi
                <span> (Opsional)</span>
              </label>

              <input
                id="customerReference"
                type="text"
                value={customerReference}
                onChange={(event) => setCustomerReference(event.target.value)}
                placeholder="Masukkan nomor referensi jika tersedia"
                maxLength={100}
              />
            </div>

            {/* INI BAGIAN FILE BUKTI */}
            <div className="payment-proof-field">
              <label htmlFor="payment-proof-file">
                Gambar Bukti Pembayaran
              </label>

              <input
                id="payment-proof-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setProofFile(event.target.files?.[0] ?? null)
                }
                required
              />

              <small>Format JPG, PNG, atau WebP. Ukuran maksimal 1 MB.</small>

              {proofFile && (
                <span className="payment-proof-file-name">
                  File dipilih: {proofFile.name}
                </span>
              )}
            </div>

            {error && (
              <p className="payment-proof-error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="payment-proof-success" role="status">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="payment-proof-submit"
              disabled={submitting}
            >
              {submitting ? "Mengirim Bukti..." : "Kirim Bukti Pembayaran"}
            </button>
          </form>
        )}

      {/* INI BAGIAN PESAN UNTUK STATUS LAIN */}
      {currentStatus !== "LUNAS" &&
        currentStatus !== "GAGAL" &&
        currentStatus !== "MENUNGGU_VERIFIKASI" &&
        currentStatus !== "MENUNGGU_PEMBAYARAN" && (
          <p className="payment-proof-warning">
            Status pembayaran saat ini: {getPaymentLabel(currentStatus)}.
          </p>
        )}
    </section>
  );
}
