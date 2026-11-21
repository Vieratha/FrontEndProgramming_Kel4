"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PaymentProofForm, {
  type PaymentSummary,
} from "@/app/components/PaymentProofForm";

// Data item dan pesanan dari API.
type OrderItem = {
  id: number;
  menuId: number | null;
  menuName: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string | null;
  address: string | null;
  paymentMethod: string | null;
  orderType: string;
  tableNumber: string | null;
  note: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
  payments: PaymentSummary[];
};

// Mengubah kode status pembayaran menjadi label.
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

export default function KonfirmasiPage() {
  const [pesanan, setPesanan] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mengambil detail pesanan berdasarkan nomor dari URL.
  useEffect(() => {
    const controller = new AbortController();

    const fetchOrder = async () => {
      try {
        const orderNumber = new URLSearchParams(window.location.search).get(
          "order",
        );

        if (!orderNumber) {
          throw new Error("Nomor pesanan tidak ditemukan.");
        }

        const response = await fetch(
          `/api/orders?order=${encodeURIComponent(orderNumber)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil data pesanan.");
        }

        if (!controller.signal.aborted) {
          setPesanan(result.order as Order);
          setError("");
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat mengambil pesanan.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      controller.abort();
    };
  }, []);

  // Sinkronkan status di halaman ini setelah pembayaran diperbarui.
  const handlePaymentUpdate = (payment: PaymentSummary) => {
    setPesanan((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        paymentStatus: payment.status,
        payments: [
          payment,
          ...previous.payments.filter(
            (existingPayment) => existingPayment.id !== payment.id,
          ),
        ],
      };
    });
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <main className="konfirmasi-page">
        <p>Memuat data pesanan...</p>
      </main>
    );
  }

  if (error || !pesanan) {
    return (
      <main className="konfirmasi-page">
        <section className="konfirmasi-card">
          <h1>Pesanan Tidak Ditemukan</h1>

          <p className="konfirmasi-description">
            {error || "Data pesanan tidak tersedia."}
          </p>

          <Link href="/" className="konfirmasi-button">
            Kembali ke Beranda
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="konfirmasi-page">
      <section className="konfirmasi-card">
        <div className="konfirmasi-icon">✓</div>

        <h1>Pesanan Berhasil Dicatat!</h1>

        <p className="konfirmasi-description">
          Terima kasih, {pesanan.customerName}! Pesanan kamu berhasil disimpan
          ke database Soto Betawi Jakarta.
        </p>

        {/* Informasi pesanan */}
        <div className="konfirmasi-info">
          <h2>Detail Pesanan</h2>

          <div className="konfirmasi-row">
            <span>Nomor Pesanan</span>
            <strong>{pesanan.orderNumber}</strong>
          </div>

          <div className="konfirmasi-row">
            <span>Tanggal Pesanan</span>
            <strong>{formatTanggal(pesanan.createdAt)}</strong>
          </div>

          <div className="konfirmasi-row">
            <span>Nama Pemesan</span>
            <strong>{pesanan.customerName}</strong>
          </div>

          <div className="konfirmasi-row">
            <span>Jenis Pesanan</span>
            <strong>{pesanan.orderType}</strong>
          </div>

          {pesanan.orderType === "Makan di Tempat" && pesanan.tableNumber && (
            <div className="konfirmasi-row">
              <span>Nomor Meja</span>
              <strong>{pesanan.tableNumber}</strong>
            </div>
          )}

          {pesanan.phone && (
            <div className="konfirmasi-row">
              <span>Nomor Telepon</span>
              <strong>{pesanan.phone}</strong>
            </div>
          )}

          <div className="konfirmasi-row">
            <span>Metode Pembayaran</span>
            <strong>{pesanan.paymentMethod || "Bayar di Kasir"}</strong>
          </div>

          <div className="konfirmasi-row">
            <span>Status Pesanan</span>
            <strong>{pesanan.status}</strong>
          </div>

          <div className="konfirmasi-row">
            <span>Status Pembayaran</span>
            <strong
              className={
                pesanan.paymentStatus === "LUNAS"
                  ? "payment-status-text paid"
                  : pesanan.paymentStatus === "GAGAL"
                    ? "payment-status-text failed"
                    : "payment-status-text unpaid"
              }
            >
              {getPaymentLabel(pesanan.paymentStatus)}
            </strong>
          </div>

          {pesanan.paidAt && (
            <div className="konfirmasi-row">
              <span>Waktu Pembayaran</span>
              <strong>{formatTanggal(pesanan.paidAt)}</strong>
            </div>
          )}

          {pesanan.note && (
            <div className="konfirmasi-row">
              <span>Catatan</span>
              <strong>{pesanan.note}</strong>
            </div>
          )}

          <h2 className="konfirmasi-menu-title">Menu yang Dipesan</h2>

          <div className="konfirmasi-items">
            {pesanan.items.map((item) => (
              <div className="konfirmasi-item" key={item.id}>
                <div>
                  <h3>{item.menuName}</h3>
                  <p>Jumlah: {item.quantity}</p>
                </div>

                <strong>{formatRupiah(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>

          <div className="konfirmasi-total">
            <span>Total Pembayaran</span>
            <strong>{formatRupiah(pesanan.total)}</strong>
          </div>
        </div>

        {/* Form pembayaran */}
        <PaymentProofForm
          orderNumber={pesanan.orderNumber}
          orderStatus={pesanan.status}
          paymentMethod={pesanan.paymentMethod}
          paymentStatus={pesanan.paymentStatus}
          total={pesanan.total}
          payments={pesanan.payments ?? []}
          onPaymentUpdate={handlePaymentUpdate}
        />

        {/* Navigasi setelah konfirmasi */}
        <div className="konfirmasi-actions">
          <Link href="/" className="konfirmasi-button">
            Kembali ke Beranda
          </Link>

          <Link href="/riwayat" className="konfirmasi-secondary">
            Lihat Riwayat Pesanan
          </Link>
        </div>
      </section>
    </main>
  );
}
