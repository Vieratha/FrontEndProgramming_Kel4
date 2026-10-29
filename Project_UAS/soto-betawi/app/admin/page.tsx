
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// TIPE DATA ITEM PESANAN
type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

// TIPE DATA PESANAN
type Order = {
  id: string;
  nama: string;
  tanggal: string;
  total: number;
  status: string;
  items: OrderItem[];
};

export default function AdminDashboard() {
  // STATE DATA PESANAN
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // MEMBACA PESANAN CUSTOMER
  useEffect(() => {
    const loadOrders = () => {
      try {
        const savedOrders = localStorage.getItem(
          "soto-betawi-orders"
        );

        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);

          if (Array.isArray(parsedOrders)) {
            setOrders(parsedOrders);
          } else {
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error(
          "Gagal membaca data pesanan:",
          error
        );
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();

    window.addEventListener("storage", loadOrders);

    return () => {
      window.removeEventListener(
        "storage",
        loadOrders
      );
    };
  }, []);

  // TOTAL PESANAN
  const totalPesanan = orders.length;

  // PESANAN HARI INI
  const hariIni = new Date().toLocaleDateString("en-CA");

  const pesananHariIni = orders.filter((order) => {
    if (!order.tanggal) return false;

    const tanggalPesanan = new Date(order.tanggal);

    if (Number.isNaN(tanggalPesanan.getTime())) {
      return false;
    }

    const tanggalLokal =
      tanggalPesanan.toLocaleDateString("en-CA");

    return tanggalLokal === hariIni;
  }).length;

  // TOTAL NILAI PESANAN
  const totalPendapatan = orders.reduce(
    (total, order) =>
      total + (Number(order.total) || 0),
    0
  );

  // JUMLAH MENU TERJUAL
  const menuTerjual = orders.reduce(
    (total, order) => {
      const jumlahItem = Array.isArray(order.items)
        ? order.items.reduce(
            (jumlah, item) =>
              jumlah + (Number(item.quantity) || 0),
            0
          )
        : 0;

      return total + jumlahItem;
    },
    0
  );

  // FORMAT RUPIAH
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  
  // FORMAT TANGGAL DAN WAKTU PESANAN
  const formatTanggal = (tanggal: string) => {
    if (!tanggal) return "-";

    const date = new Date(tanggal);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // MENGAMBIL 5 PESANAN TERBARU
  const pesananTerbaru = [...orders]
    .sort((a, b) => {
      const waktuA = new Date(a.tanggal).getTime() || 0;
      const waktuB = new Date(b.tanggal).getTime() || 0;

      return waktuB - waktuA;
    })
    .slice(0, 5);

    
  // LANGKAH 17.4 - MENGHITUNG MENU TERLARIS

  const jumlahPenjualan: Record<string, number> = {};

  orders.forEach((order) => {
    if (!Array.isArray(order.items)) return;

    order.items.forEach((item) => {
      const namaMenu = item.name;
      const jumlah = Number(item.quantity) || 0;

      if (!namaMenu) return;

      jumlahPenjualan[namaMenu] =
        (jumlahPenjualan[namaMenu] || 0) + jumlah;
    });
  });

  // URUTKAN DARI YANG PALING BANYAK TERJUAL
  const menuTerlaris = Object.entries(jumlahPenjualan)
    .map(([name, quantity]) => ({
      name,
      quantity,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // PENJUALAN TERTINGGI UNTUK PANJANG GRAFIK
  const penjualanTertinggi =
    menuTerlaris.length > 0
      ? menuTerlaris[0].quantity
      : 0;


  return (
    <main className="admin-dashboard">

      {/* HEADER DASHBOARD */}
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-breadcrumb">
            Dashboard
          </p>

          <h1>Selamat Datang, Admin!</h1>
        </div>

        <Link
          href="/"
          className="admin-view-website"
        >
          Lihat Website
        </Link>
      </header>

      {/* EMPAT KARTU STATISTIK */}
      <section className="admin-dashboard-stats">

        {/* TOTAL PESANAN */}
        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Total Pesanan</p>
            <h2>
              {loading ? "..." : totalPesanan}
            </h2>
          </div>

          <span className="admin-stat-icon">
            🛒
          </span>
        </div>

        {/* PESANAN HARI INI */}
        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Pesanan Hari Ini</p>
            <h2>
              {loading ? "..." : pesananHariIni}
            </h2>
          </div>

          <span className="admin-stat-icon">
            📋
          </span>
        </div>

        {/* TOTAL NILAI PESANAN */}
        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Nilai Pesanan</p>
            <h2>
              {loading
                ? "..."
                : formatRupiah(totalPendapatan)}
            </h2>
          </div>

          <span className="admin-stat-icon">
            💰
          </span>
        </div>

        {/* MENU TERJUAL */}
        <div className="admin-dashboard-stat-card">
          <div className="admin-stat-info">
            <p>Menu Terjual</p>
            <h2>
              {loading ? "..." : menuTerjual}
            </h2>
          </div>

          <span className="admin-stat-icon">
            🍲
          </span>
        </div>

      </section>

      {/* AREA UNTUK LANGKAH 17.3 DAN 17.4 */}
      <section className="admin-dashboard-next">
        <div className="admin-dashboard-placeholder">
          
        
        {/* TABEL PESANAN TERBARU */}
        <div className="admin-recent-orders">

          <div className="admin-card-header">
            <div>
              <h2>Pesanan Terbaru</h2>
              <p>Daftar pesanan yang masuk</p>
            </div>

            <Link
              href="/admin/pesanan"
              className="admin-card-link"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>No.</th>
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
                      Memuat data pesanan...
                    </td>
                  </tr>
                ) : pesananTerbaru.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-table-empty">
                      Belum ada pesanan customer.
                    </td>
                  </tr>
                ) : (
                  pesananTerbaru.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="admin-order-id">
                          {order.id}
                        </span>
                      </td>

                      <td>
                        {order.nama || "Pelanggan"}
                      </td>

                      <td>
                        {formatRupiah(
                          Number(order.total) || 0
                        )}
                      </td>

                      <td>
                        {formatTanggal(order.tanggal)}
                      </td>

                      <td>
                        <span
                          className={
                            order.status === "Menunggu Konfirmasi"
                              ? "admin-order-status pending"
                              : "admin-order-status"
                          }
                        >
                          {order.status || "Tidak diketahui"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
        </div>

        
        {/* LANGKAH 17.4 - MENU TERLARIS */}
        <div className="admin-best-selling">

          <div className="admin-card-header">
            <div>
              <h2>Menu Terlaris</h2>
              <p>Menu yang paling banyak dipesan</p>
            </div>

            <Link
              href="/admin/menu"
              className="admin-card-link"
            >
              Kelola Menu
            </Link>
          </div>

          <div className="admin-best-selling-list">

            {loading ? (
              <p className="admin-best-selling-empty">
                Memuat data menu...
              </p>
            ) : menuTerlaris.length === 0 ? (
              <p className="admin-best-selling-empty">
                Belum ada data penjualan menu.
              </p>
            ) : (
              menuTerlaris.map((menu) => {
                const persentase =
                  penjualanTertinggi > 0
                    ? (menu.quantity /
                        penjualanTertinggi) *
                      100
                    : 0;

                return (
                  <div
                    key={menu.name}
                    className="admin-best-selling-item"
                  >
                    <div className="admin-best-selling-info">
                      <strong>{menu.name}</strong>

                      <span>
                        {menu.quantity} terjual
                      </span>
                    </div>

                    <div className="admin-best-selling-track">
                      <div
                        className="admin-best-selling-progress"
                        style={{
                          width: `${persentase}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}

          </div>

        </div>

      </section>

    </main>
  );
}
