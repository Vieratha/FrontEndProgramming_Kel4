"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Data statistik dashboard.
type Statistics = {
  totalPesanan: number;
  pesananHariIni: number;
  totalPendapatan: number;
  totalMenu: number;
  menuTersedia: number;
  totalMenuTerjual: number;
  pembayaranBelumLunas: number;
  pesananMenungguKonfirmasi: number;
  pembayaranMenungguVerifikasi: number;
  totalCustomer: number;
};

// Data pesanan terbaru.
type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

// Data menu terlaris.
type BestSellingMenu = {
  name: string;
  quantity: number;
};

// Data utama dashboard.
type DashboardData = {
  statistics: Statistics;
  pesananTerbaru: RecentOrder[];
  menuTerlaris: BestSellingMenu[];
};

// Nilai awal dashboard.
const emptyDashboard: DashboardData = {
  statistics: {
    totalPesanan: 0,
    pesananHariIni: 0,
    totalPendapatan: 0,
    totalMenu: 0,
    menuTersedia: 0,
    totalMenuTerjual: 0,
    pembayaranBelumLunas: 0,
    pesananMenungguKonfirmasi: 0,
    pembayaranMenungguVerifikasi: 0,
    totalCustomer: 0,
  },
  pesananTerbaru: [],
  menuTerlaris: [],
};

// Tipe ikon statistik.
type AdminStatIconName =
  | "orders"
  | "calendar"
  | "revenue"
  | "pending"
  | "food"
  | "available"
  | "customers";

// Komponen ikon untuk statistik dashboard.
function AdminStatIcon({ name }: { name: AdminStatIconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "orders" && (
        <>
          <path d="M5 4h14l1 17H4L5 4Z" />
          <path d="M9 4V2h6v2M8 9h8M8 13h8M8 17h5" />
        </>
      )}

      {name === "calendar" && (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 10h18M8 14h3" />
        </>
      )}

      {name === "revenue" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 8.5c-.6-.7-1.6-1-3-1-1.5 0-2.5.8-2.5 2s1 1.8 2.5 2.2 2.5 1 2.5 2.2-1 2.1-2.8 2.1c-1.3 0-2.3-.4-3.1-1.2M12 5.5v13" />
        </>
      )}

      {name === "pending" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )}

      {name === "food" && (
        <>
          <path d="M4 11h16a8 8 0 0 1-16 0Z" />
          <path d="M7 7c0-1 1-1.5 1-2.5M12 7c0-1 1-1.5 1-2.5M17 7c0-1 1-1.5 1-2.5" />
          <path d="M3 20h18" />
        </>
      )}

      {name === "available" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16.5 9" />
        </>
      )}

      {name === "customers" && (
        <>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5a3.5 3.5 0 0 1 0 7M17 14a5 5 0 0 1 4.5 6" />
        </>
      )}
    </svg>
  );
}

// Mengubah kode status pembayaran menjadi label.
function formatPaymentStatus(status: string) {
  const labels: Record<string, string> = {
    LUNAS: "Lunas",
    BELUM_DIBAYAR: "Belum Dibayar",
    MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
    MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
    GAGAL: "Perlu Pembayaran Ulang",
    DIBATALKAN: "Dibatalkan",
  };

  return labels[status] || status;
}

// Menentukan class berdasarkan status pembayaran.
function getPaymentStatusClass(status: string) {
  switch (status) {
    case "LUNAS":
      return "lunas";

    case "MENUNGGU_VERIFIKASI":
      return "menunggu-verifikasi";

    case "MENUNGGU_PEMBAYARAN":
    case "BELUM_DIBAYAR":
      return "menunggu-pembayaran";

    case "GAGAL":
      return "gagal";

    case "DIBATALKAN":
      return "dibatalkan";

    default:
      return "";
  }
}

// Halaman dashboard admin.
export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Mengambil data dashboard dari API.
  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/admin/dashboard", {
          cache: "no-store",
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal memuat dashboard.");
        }

        if (!controller.signal.aborted) {
          setDashboard(result as DashboardData);
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
              : "Terjadi kesalahan saat memuat dashboard.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      controller.abort();
    };
  }, []);

  // Format harga dalam rupiah.
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  // Format tanggal berdasarkan waktu Jakarta.
  const formatTanggal = (tanggal: string) => {
    const date = new Date(tanggal);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Menentukan nilai tertinggi untuk progress bar.
  const penjualanTertinggi =
    dashboard.menuTerlaris.length > 0 ? dashboard.menuTerlaris[0].quantity : 0;

  return (
    <main className="admin-dashboard">
      {/* Header dashboard */}
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-breadcrumb">Dashboard</p>

          <h1>Selamat Datang, Admin!</h1>

          <p style={{ color: "#8d837a", marginTop: "8px" }}>
            Ringkasan aktivitas Soto Betawi Jakarta
          </p>
        </div>

        <Link href="/" className="admin-view-website">
          Lihat Website
        </Link>
      </header>

      {/* Pesan error */}
      {error && (
        <div
          className="am-alert am-alert-error"
          role="alert"
          style={{ marginBottom: "20px" }}
        >
          {error}
        </div>
      )}

      {/* Ringkasan dashboard */}
      <div className="admin-dashboard-section-heading">
        <div>
          <p>OVERVIEW</p>
          <h2>Ringkasan Aktivitas</h2>
        </div>
      </div>

      {/* Statistik utama */}
      <section className="admin-dashboard-stats">
        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Total Pesanan</p>
            <h2>{loading ? "..." : dashboard.statistics.totalPesanan}</h2>
            <small>Seluruh pesanan tercatat</small>
          </div>

          <span className="admin-stat-icon">
            <AdminStatIcon name="orders" />
          </span>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Pesanan Hari Ini</p>
            <h2>{loading ? "..." : dashboard.statistics.pesananHariIni}</h2>
            <small>Pesanan masuk hari ini</small>
          </div>

          <span className="admin-stat-icon">
            <AdminStatIcon name="calendar" />
          </span>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Total Pendapatan Diterima</p>
            <h2>
              {loading
                ? "..."
                : formatRupiah(dashboard.statistics.totalPendapatan)}
            </h2>
            <small>Akumulasi pembayaran lunas</small>
          </div>

          <span className="admin-stat-icon">
            <AdminStatIcon name="revenue" />
          </span>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Menunggu Konfirmasi</p>
            <h2>
              {loading ? "..." : dashboard.statistics.pesananMenungguKonfirmasi}
            </h2>
            <small>Pesanan perlu ditinjau</small>
          </div>

          <span className="admin-stat-icon">
            <AdminStatIcon name="pending" />
          </span>
        </div>
      </section>

      {/* Bagian yang perlu diperhatikan */}
      <section className="admin-dashboard-attention">
        <div className="admin-attention-heading">
          <div>
            <p>MEMERLUKAN TINDAKAN</p>
            <h2>Perlu Perhatian</h2>
            <span>Ringkasan pembayaran yang perlu ditindaklanjuti.</span>
          </div>

          <Link href="/admin/pesanan" className="admin-card-link">
            Kelola Pesanan
          </Link>
        </div>

        <div className="admin-attention-grid">
          <Link href="/admin/pesanan" className="admin-attention-item">
            <span className="admin-attention-icon warning">
              <AdminStatIcon name="pending" />
            </span>

            <span className="admin-attention-info">
              <small>Menunggu Verifikasi</small>
              <strong>
                {loading
                  ? "..."
                  : dashboard.statistics.pembayaranMenungguVerifikasi}
              </strong>
              <span>Pembayaran online yang perlu diperiksa.</span>
            </span>

            <span className="admin-attention-arrow">→</span>
          </Link>

          <Link href="/admin/pesanan" className="admin-attention-item">
            <span className="admin-attention-icon neutral">
              <AdminStatIcon name="revenue" />
            </span>

            <span className="admin-attention-info">
              <small>Belum Lunas</small>
              <strong>
                {loading ? "..." : dashboard.statistics.pembayaranBelumLunas}
              </strong>
              <span>Pesanan yang pembayarannya belum lunas.</span>
            </span>

            <span className="admin-attention-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* Ringkasan menu dan pelanggan */}
      <div className="admin-dashboard-section-heading">
        <div>
          <p>KINERJA</p>
          <h2>Ringkasan Menu dan Pelanggan</h2>
        </div>
      </div>

      <section className="admin-dashboard-secondary-stats">
        <div className="admin-secondary-stat-card">
          <span className="admin-secondary-stat-icon">
            <AdminStatIcon name="food" />
          </span>

          <div>
            <p>Total Item Terjual</p>
            <h3>{loading ? "..." : dashboard.statistics.totalMenuTerjual}</h3>
            <small>Pesanan selesai dan lunas</small>
          </div>
        </div>

        <div className="admin-secondary-stat-card">
          <span className="admin-secondary-stat-icon">
            <AdminStatIcon name="available" />
          </span>

          <div>
            <p>Menu Tersedia</p>
            <h3>{loading ? "..." : dashboard.statistics.menuTersedia}</h3>
            <small>
              Dari {loading ? "..." : dashboard.statistics.totalMenu} menu
              terdaftar
            </small>
          </div>
        </div>

        <div className="admin-secondary-stat-card">
          <span className="admin-secondary-stat-icon">
            <AdminStatIcon name="customers" />
          </span>

          <div>
            <p>Total Customer</p>
            <h3>{loading ? "..." : dashboard.statistics.totalCustomer}</h3>
            <small>Akun customer terdaftar</small>
          </div>
        </div>
      </section>

      {/* Pesanan terbaru */}
      <section className="admin-recent-orders">
        <div className="admin-card-header">
          <div>
            <h2>Pesanan Terbaru</h2>
            <p>Daftar lima pesanan terakhir</p>
          </div>

          <Link href="/admin/pesanan" className="admin-card-link">
            Lihat Semua
          </Link>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Nomor Pesanan</th>
                <th>Pelanggan</th>
                <th>Total</th>
                <th>Waktu</th>
                <th>Status Pesanan</th>
                <th>Status Pembayaran</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty">
                    Memuat data...
                  </td>
                </tr>
              ) : dashboard.pesananTerbaru.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty">
                    Belum ada pesanan masuk.
                  </td>
                </tr>
              ) : (
                dashboard.pesananTerbaru.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="admin-order-id">
                        {order.orderNumber}
                      </span>
                    </td>

                    <td>{order.customerName}</td>

                    <td>{formatRupiah(order.total)}</td>

                    <td>{formatTanggal(order.createdAt)}</td>

                    <td>
                      <span
                        className={
                          order.status === "Menunggu Konfirmasi"
                            ? "admin-order-status pending"
                            : "admin-order-status"
                        }
                      >
                        {order.status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`admin-payment-status ${getPaymentStatusClass(
                          order.paymentStatus,
                        )}`}
                      >
                        {formatPaymentStatus(order.paymentStatus)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Menu terlaris */}
      <section className="admin-best-selling">
        <div className="admin-card-header">
          <div>
            <h2>Menu Terlaris</h2>
            <p>Menu berdasarkan jumlah item terjual</p>
          </div>

          <Link href="/admin/menu" className="admin-card-link">
            Kelola Menu
          </Link>
        </div>

        <div className="admin-best-selling-list">
          {loading ? (
            <p className="admin-best-selling-empty">Memuat data menu...</p>
          ) : dashboard.menuTerlaris.length === 0 ? (
            <p className="admin-best-selling-empty">
              Belum ada data penjualan menu.
            </p>
          ) : (
            dashboard.menuTerlaris.map((menu) => {
              const percentage =
                penjualanTertinggi > 0
                  ? (menu.quantity / penjualanTertinggi) * 100
                  : 0;

              return (
                <div key={menu.name} className="admin-best-selling-item">
                  <div className="admin-best-selling-info">
                    <strong>{menu.name}</strong>
                    <span>{menu.quantity} terjual</span>
                  </div>

                  <div className="admin-best-selling-track">
                    <div
                      className="admin-best-selling-progress"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
