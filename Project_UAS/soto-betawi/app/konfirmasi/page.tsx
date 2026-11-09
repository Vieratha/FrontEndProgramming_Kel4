"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PaymentProofForm from "@/app/components/PaymentProofForm";

// INI BAGIAN TIPE DATA ITEM PESANAN
type OrderItem = {
  id: number;
  menuId: number | null;
  menuName: string;
  price: number;
  quantity: number;
};

// INI BAGIAN TIPE DATA RINGKASAN PEMBAYARAN
type PaymentSummary = {
  id: string;
  method: string;
  reference: string | null;
  status: string;
  amount: number;
  payerName: string | null;
  customerReference: string | null;
  proofFileName: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  verificationNote: string | null;
  paidAt: string | null;
  createdAt: string;
};

// INI BAGIAN TIPE DATA PESANAN
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

// INI BAGIAN LABEL STATUS PEMBAYARAN
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

  // INI BAGIAN MENGAMBIL PESANAN DARI DATABASE
  useEffect(() => {
    const controller = new AbortController();

    const fetchOrder = async () => {
      try {
        // Ambil nomor pesanan dari URL.
        const orderNumber = new URLSearchParams(window.location.search).get(
          "order",
        );

        if (!orderNumber) {
          throw new Error("Nomor pesanan tidak ditemukan.");
        }

        // INI BAGIAN MEMINTA DETAIL PESANAN KEPADA API
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

  // INI BAGIAN FORMAT HARGA RUPIAH
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  // INI BAGIAN FORMAT TANGGAL
  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // INI BAGIAN TAMPILAN LOADING
  if (loading) {
    return (
      <main className="konfirmasi-page">
        <p>Memuat data pesanan...</p>
      </main>
    );
  }

  // INI BAGIAN TAMPILAN JIKA PESANAN TIDAK DITEMUKAN
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
        {/* INI BAGIAN ICON BERHASIL */}
        <div className="konfirmasi-icon">✓</div>

        <h1>Pesanan Berhasil Dicatat!</h1>

        <p className="konfirmasi-description">
          Terima kasih, {pesanan.customerName}! Pesanan kamu berhasil disimpan
          ke database Soto Betawi Jakarta.
        </p>

        {/* INI BAGIAN INFORMASI PESANAN */}
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

          {/* INI BAGIAN NOMOR MEJA */}
          {pesanan.orderType === "Makan di Tempat" && pesanan.tableNumber && (
            <div className="konfirmasi-row">
              <span>Nomor Meja</span>
              <strong>{pesanan.tableNumber}</strong>
            </div>
          )}

          {/* INI BAGIAN INFORMASI TAMBAHAN */}
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

          {/* INI BAGIAN STATUS PESANAN */}
          <div className="konfirmasi-row">
            <span>Status Pesanan</span>
            <strong>{pesanan.status}</strong>
          </div>

          {/* INI BAGIAN STATUS PEMBAYARAN */}
          <div className="konfirmasi-row">
            <span>Status Pembayaran</span>
            <strong
              className={
                pesanan.paymentStatus === "LUNAS"
                  ? "payment-status-text paid"
                  : "payment-status-text unpaid"
              }
            >
              {getPaymentLabel(pesanan.paymentStatus)}
            </strong>
          </div>

          {/* INI BAGIAN WAKTU PEMBAYARAN */}
          {pesanan.paidAt && (
            <div className="konfirmasi-row">
              <span>Waktu Pembayaran</span>
              <strong>{formatTanggal(pesanan.paidAt)}</strong>
            </div>
          )}

          {/* INI BAGIAN CATATAN */}
          {pesanan.note && (
            <div className="konfirmasi-row">
              <span>Catatan</span>
              <strong>{pesanan.note}</strong>
            </div>
          )}

          {/* INI BAGIAN DAFTAR MENU */}
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

          {/* INI BAGIAN TOTAL PEMBAYARAN */}
          <div className="konfirmasi-total">
            <span>Total Pembayaran</span>
            <strong>{formatRupiah(pesanan.total)}</strong>
          </div>
        </div>

        {/* INI BAGIAN FORM DAN INFORMASI PEMBAYARAN */}
        <PaymentProofForm
          orderNumber={pesanan.orderNumber}
          orderStatus={pesanan.status}
          paymentMethod={pesanan.paymentMethod}
          paymentStatus={pesanan.paymentStatus}
          total={pesanan.total}
          payments={pesanan.payments ?? []}
        />

        {/* INI BAGIAN TOMBOL NAVIGASI */}
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
