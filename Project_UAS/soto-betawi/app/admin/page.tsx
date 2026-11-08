"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Statistics = {
  totalPesanan: number;
  pesananHariIni: number;
  totalPendapatan: number;
  totalMenu: number;
  menuTersedia: number;
  totalMenuTerjual: number;
};

type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
};

type BestSellingMenu = {
  name: string;
  quantity: number;
};

type DashboardData = {
  statistics: Statistics;
  pesananTerbaru: RecentOrder[];
  menuTerlaris: BestSellingMenu[];
};

const emptyDashboard: DashboardData = {
  statistics: {
    totalPesanan: 0,
    pesananHariIni: 0,
    totalPendapatan: 0,
    totalMenu: 0,
    menuTersedia: 0,
    totalMenuTerjual: 0,
  },
  pesananTerbaru: [],
  menuTerlaris: [],
};

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData>(emptyDashboard);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // MEMUAT DATA DASHBOARD DARI DATABASE
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

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

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

  const penjualanTertinggi =
    dashboard.menuTerlaris.length > 0 ? dashboard.menuTerlaris[0].quantity : 0;

  return (
    <main className="admin-dashboard">
      {/* HEADER DASHBOARD */}
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

      {/* PESAN ERROR */}
      {error && (
        <div
          className="am-alert am-alert-error"
          role="alert"
          style={{ marginBottom: "20px" }}
        >
          {error}
        </div>
      )}

      {/* KARTU STATISTIK */}
      <section className="admin-dashboard-stats">
        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Total Pesanan</p>
            <h2>{loading ? "..." : dashboard.statistics.totalPesanan}</h2>
          </div>
          <span className="admin-stat-icon">🛒</span>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Pesanan Hari Ini</p>
            <h2>{loading ? "..." : dashboard.statistics.pesananHariIni}</h2>
          </div>
          <span className="admin-stat-icon">📋</span>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Pendapatan Selesai</p>
            <h2>
              {loading
                ? "..."
                : formatRupiah(dashboard.statistics.totalPendapatan)}
            </h2>
          </div>
          <span className="admin-stat-icon">💰</span>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Menu Terjual</p>
            <h2>{loading ? "..." : dashboard.statistics.totalMenuTerjual}</h2>
          </div>

          <span className="admin-stat-icon">🍲</span>
        </div>
      </section>

      {/* RINGKASAN MENU */}
      <section
        className="admin-dashboard-stats"
        style={{ marginBottom: "25px" }}
      >
        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Total Menu Terdaftar</p>
            <h2>{loading ? "..." : dashboard.statistics.totalMenu}</h2>
          </div>
          <span className="admin-stat-icon">🍽️</span>
        </div>

        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Menu Tersedia</p>
            <h2>{loading ? "..." : dashboard.statistics.menuTersedia}</h2>
          </div>
          <span className="admin-stat-icon">✅</span>
        </div>
      </section>

      {/* PESANAN TERBARU */}
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
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    Memuat data...
                  </td>
                </tr>
              ) : dashboard.pesananTerbaru.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MENU TERLARIS */}
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
