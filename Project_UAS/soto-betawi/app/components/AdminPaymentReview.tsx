"use client";

import { useState } from "react";

// Data transaksi pembayaran.
type PaymentRecord = {
  id: string;
  method: string;
  reference: string | null;
  status: string;
  amount: number;
  payerName: string | null;
  customerReference: string | null;
  proofMimeType: string | null;
  proofFileName: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  verificationNote: string | null;
  paidAt: string | null;
  createdAt: string;
};

// Props komponen verifikasi pembayaran.
type AdminPaymentReviewProps = {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentMethod: string | null;
  paymentStatus: string;
  payments: PaymentRecord[];
  onUpdated: () => void;
};

function formatRupiah(angka: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);
}

function formatTanggal(tanggal: string) {
  return new Date(tanggal).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Komponen pemeriksaan bukti pembayaran admin.
export default function AdminPaymentReview({
  orderId,
  orderNumber,
  total,
  paymentMethod,
  paymentStatus,
  payments,
  onUpdated,
}: AdminPaymentReviewProps) {
  // Daftar pesanan dari API sudah mengurutkan pembayaran terbaru terlebih dahulu.
  const latestPayment = payments[0] ?? null;

  // State form verifikasi.
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Memeriksa metode pembayaran online.
  const isOnlinePayment =
    paymentMethod === "QRIS" || paymentMethod === "Transfer Bank";

  // Memeriksa apakah bukti menunggu verifikasi.
  const isAwaitingVerification =
    paymentStatus === "MENUNGGU_VERIFIKASI" &&
    latestPayment?.status === "MENUNGGU_VERIFIKASI" &&
    Boolean(latestPayment.proofMimeType);

  // Proses persetujuan atau penolakan pembayaran.
  const handleReview = async (action: "VERIFY_PAYMENT" | "REJECT_PAYMENT") => {
    if (!latestPayment || loading) return;

    // Validasi catatan jika pembayaran ditolak.
    if (action === "REJECT_PAYMENT" && note.trim().length < 3) {
      setError("Catatan penolakan minimal 3 karakter.");
      return;
    }

    // Meminta konfirmasi admin sebelum memproses pembayaran.
    const message =
      action === "VERIFY_PAYMENT"
        ? `Pastikan pembayaran ${formatRupiah(total)} sudah diterima pada rekening atau aplikasi merchant. Verifikasi pembayaran ${orderNumber}?`
        : `Yakin menolak bukti pembayaran ${orderNumber}?`;

    if (!window.confirm(message)) return;

    setLoading(true);
    setError("");

    try {
      // Mengirim keputusan verifikasi ke server.
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: orderId,
          paymentId: latestPayment.id,
          action,
          note: action === "REJECT_PAYMENT" ? note.trim() : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal memperbarui status pembayaran.",
        );
      }

      // Memperbarui daftar pesanan setelah verifikasi.
      setNote("");
      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memproses pembayaran.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Pembayaran kasir tetap menggunakan tombol konfirmasi kasir yang sudah ada.
  if (!isOnlinePayment) {
    return null;
  }

  return (
    <section className="apr-card">
      {/* Header pembayaran */}
      <div className="apr-header">
        <div>
          <h3>Verifikasi Pembayaran Online</h3>
          <p>
            Metode: <strong>{paymentMethod}</strong>
          </p>
        </div>

        <span
          className={
            paymentStatus === "LUNAS"
              ? "apr-status paid"
              : paymentStatus === "MENUNGGU_VERIFIKASI"
                ? "apr-status pending"
                : "apr-status unpaid"
          }
        >
          {paymentStatus === "LUNAS"
            ? "Lunas"
            : paymentStatus === "MENUNGGU_VERIFIKASI"
              ? "Menunggu Verifikasi"
              : paymentStatus}
        </span>
      </div>

      {/* Pesan jika belum ada pembayaran */}
      {!latestPayment && (
        <p className="apr-empty">Belum ada transaksi pembayaran.</p>
      )}

      {/* Bukti pembayaran */}
      {latestPayment && (
        <>
          <div className="apr-information">
            <div>
              <span>Nominal Pesanan</span>
              <strong>{formatRupiah(total)}</strong>
            </div>

            <div>
              <span>Nominal Acuan Sistem</span>
              <strong>{formatRupiah(latestPayment.amount)}</strong>
            </div>

            <div>
              <span>Nama Pengirim</span>
              <strong>{latestPayment.payerName || "Belum diisi"}</strong>
            </div>

            <div>
              <span>Referensi Customer</span>
              <strong>
                {latestPayment.customerReference || "Tidak dicantumkan"}
              </strong>
            </div>

            <div>
              <span>Referensi Internal</span>
              <strong>{latestPayment.reference || "-"}</strong>
            </div>

            <div>
              <span>Nama File</span>
              <strong>{latestPayment.proofFileName || "Belum ada file"}</strong>
            </div>

            {latestPayment.submittedAt && (
              <div>
                <span>Waktu Pengiriman</span>
                <strong>{formatTanggal(latestPayment.submittedAt)}</strong>
              </div>
            )}

            {latestPayment.verifiedAt && (
              <div>
                <span>Waktu Verifikasi</span>
                <strong>{formatTanggal(latestPayment.verifiedAt)}</strong>
              </div>
            )}
          </div>

          {/* Preview gambar bukti */}
          {latestPayment.proofMimeType && (
            <div className="apr-proof">
              <h4>Bukti Pembayaran</h4>

              <a
                href={`/api/admin/payments/proof?paymentId=${encodeURIComponent(latestPayment.id)}`}
                target="_blank"
                rel="noreferrer"
                className="apr-proof-link"
              >
                Buka Bukti dalam Tab Baru
              </a>

              <img
                src={`/api/admin/payments/proof?paymentId=${encodeURIComponent(latestPayment.id)}`}
                alt={`Bukti pembayaran ${orderNumber}`}
                className="apr-proof-image"
              />
            </div>
          )}

          {/* Catatan penolakan */}
          {latestPayment.verificationNote && (
            <div className="apr-rejection-note">
              <strong>Catatan Penolakan Sebelumnya</strong>
              <p>{latestPayment.verificationNote}</p>
            </div>
          )}

          {/* Aksi verifikasi */}
          {isAwaitingVerification && (
            <div className="apr-review">
              <p>
                Cocokkan nama pengirim, nominal, waktu, dan referensi transaksi
                dengan catatan pada rekening atau aplikasi merchant.
              </p>

              <div className="apr-field">
                <label htmlFor="rejection-note">Alasan Penolakan</label>

                <textarea
                  id="rejection-note"
                  rows={3}
                  maxLength={500}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Isi jika bukti tidak sesuai atau transaksi tidak ditemukan."
                />
              </div>

              {error && (
                <p className="apr-error" role="alert">
                  {error}
                </p>
              )}

              <div className="apr-actions">
                <button
                  type="button"
                  className="apr-reject-button"
                  onClick={() => handleReview("REJECT_PAYMENT")}
                  disabled={loading}
                >
                  {loading ? "Memproses..." : "Tolak Bukti"}
                </button>

                <button
                  type="button"
                  className="apr-verify-button"
                  onClick={() => handleReview("VERIFY_PAYMENT")}
                  disabled={loading}
                >
                  {loading ? "Memproses..." : "Verifikasi Pembayaran"}
                </button>
              </div>
            </div>
          )}

          {/* Status pembayaran */}
          {paymentStatus === "LUNAS" && (
            <div className="apr-success">
              Pembayaran telah diverifikasi oleh admin.
            </div>
          )}
        </>
      )}
    </section>
  );
}
