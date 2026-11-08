"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// INI BAGIAN TIPE DATA ITEM PESANAN
type OrderItem = {
  id: number;
  menuId: number | null;
  menuName: string;
  price: number;
  quantity: number;
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
};

// INI BAGIAN LABEL STATUS PEMBAYARAN
function getPaymentLabel(status: string) {
  const labels: Record<string, string> = {
    BELUM_DIBAYAR: "Belum Dibayar",
    MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
    LUNAS: "Lunas",
    GAGAL: "Gagal",
    KEDALUWARSA: "Kedaluwarsa",
    DIBATALKAN: "Dibatalkan",
    DIKEMBALIKAN: "Dikembalikan",
  };

  return labels[status] || status;
}

export default function RiwayatPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGuest, setIsGuest] = useState(false);

  // INI BAGIAN MENGAMBIL RIWAYAT PESANAN DARI DATABASE
  useEffect(() => {
    const controller = new AbortController();

    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders", {
          cache: "no-store",
          signal: controller.signal,
        });

        // INI BAGIAN MEMERIKSA STATUS LOGIN
        if (response.status === 401) {
          if (!controller.signal.aborted) {
            setIsGuest(true);
            setOrders([]);
            setError("");
          }

          return;
        }

        if (!response.ok) {
          const result = await response.json();

          throw new Error(result.message || "Gagal mengambil riwayat pesanan.");
        }

        // INI BAGIAN MENGAMBIL PESANAN AKUN DARI DATABASE
        const result = await response.json();

        const accountOrders: Order[] = Array.isArray(result.orders)
          ? result.orders
          : [];

        if (!controller.signal.aborted) {
          setOrders(accountOrders);
          setIsGuest(false);
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
              : "Terjadi kesalahan saat mengambil riwayat.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      controller.abort();
    };
  }, []);

  // INI BAGIAN FORMAT RUPIAH
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

  return (
    <main className="riwayat-page">
      <div className="riwayat-container">
        {/* INI BAGIAN HEADER RIWAYAT */}
        <div className="riwayat-header">
          <h1>Riwayat Pesanan</h1>
          <p>Lihat kembali daftar pesanan yang pernah kamu buat.</p>
        </div>

        {/* INI BAGIAN LOADING */}
        {loading ? (
          <p>Memuat riwayat pesanan...</p>
        ) : error ? (
          /* INI BAGIAN PESAN ERROR */
          <div className="riwayat-empty">
            <h2>Gagal Memuat Riwayat</h2>
            <p>{error}</p>
          </div>
        ) : isGuest ? (
          /* INI BAGIAN RIWAYAT UNTUK GUEST */
          <div className="riwayat-empty">
            <h2>Login untuk Melihat Riwayat</h2>

            <p>
              Riwayat pesanan akun hanya tersedia setelah kamu login. Jika
              melakukan pemesanan sebagai guest, gunakan nomor pesanan pada
              halaman konfirmasi untuk melihat detail pesanan tersebut.
            </p>

            <div className="riwayat-actions">
              <Link href="/login" className="riwayat-button">
                Login
              </Link>

              <Link href="/register" className="riwayat-button">
                Buat Akun
              </Link>
            </div>
          </div>
        ) : orders.length === 0 ? (
          /* INI BAGIAN KETIKA BELUM ADA PESANAN */
          <div className="riwayat-empty">
            <h2>Belum Ada Pesanan</h2>

            <p>
              Kamu belum memiliki riwayat pesanan. Yuk pilih makanan favoritmu!
            </p>

            <Link href="/" className="riwayat-button">
              Lihat Menu
            </Link>
          </div>
        ) : (
          /* INI BAGIAN DAFTAR RIWAYAT PESANAN */
          <div className="riwayat-list">
            {orders.map((order) => (
              <article className="riwayat-card" key={order.id}>
                {/* INI BAGIAN HEADER KARTU PESANAN */}
                <div className="riwayat-card-header">
                  <div>
                    <h2>{order.orderNumber}</h2>
                    <p>{formatTanggal(order.createdAt)}</p>
                  </div>

                  <span className="riwayat-status">{order.status}</span>
                </div>

                {/* INI BAGIAN DETAIL CUSTOMER */}
                <div className="riwayat-detail">
                  <p>
                    <strong>Nama Pemesan:</strong> {order.customerName}
                  </p>

                  <p>
                    <strong>Jenis Pesanan:</strong> {order.orderType}
                  </p>

                  {order.tableNumber && (
                    <p>
                      <strong>Nomor Meja:</strong> {order.tableNumber}
                    </p>
                  )}

                  {order.phone && (
                    <p>
                      <strong>Nomor Telepon:</strong> {order.phone}
                    </p>
                  )}

                  {/* INI BAGIAN METODE PEMBAYARAN */}
                  <p>
                    <strong>Metode Pembayaran:</strong>{" "}
                    {order.paymentMethod || "Bayar di Kasir"}
                  </p>

                  {/* INI BAGIAN STATUS PEMBAYARAN */}
                  <p>
                    <strong>Status Pembayaran:</strong>{" "}
                    <span
                      className={
                        order.paymentStatus === "LUNAS"
                          ? "payment-status-text paid"
                          : "payment-status-text unpaid"
                      }
                    >
                      {getPaymentLabel(order.paymentStatus)}
                    </span>
                  </p>

                  {/* INI BAGIAN WAKTU PEMBAYARAN */}
                  {order.paidAt && (
                    <p>
                      <strong>Waktu Pembayaran:</strong>{" "}
                      {formatTanggal(order.paidAt)}
                    </p>
                  )}

                  {/* INI BAGIAN CATATAN */}
                  {order.note && (
                    <p>
                      <strong>Catatan:</strong> {order.note}
                    </p>
                  )}
                </div>

                {/* INI BAGIAN DAFTAR MENU */}
                <div className="riwayat-items">
                  <h3>Daftar Menu</h3>

                  {order.items.map((item) => (
                    <div className="riwayat-item" key={item.id}>
                      <span>
                        {item.menuName} × {item.quantity}
                      </span>

                      <strong>
                        {formatRupiah(item.price * item.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>

                {/* INI BAGIAN TOTAL PESANAN */}
                <div className="riwayat-total">
                  <span>Total Pembayaran</span>
                  <strong>{formatRupiah(order.total)}</strong>
                </div>

                {/* INI BAGIAN LIHAT STRUK */}
                <div style={{ marginTop: "18px" }}>
                  <Link
                    href={`/konfirmasi?order=${encodeURIComponent(order.orderNumber)}`}
                    className="riwayat-button"
                  >
                    Lihat Detail Pesanan
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* INI BAGIAN KEMBALI KE BERANDA */}
        <Link href="/" className="riwayat-back">
          ← Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
