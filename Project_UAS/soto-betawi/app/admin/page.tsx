"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { formatRupiah, type MenuItem } from "@/data/menus";
import { defaultMenus } from "@/data/menus";
import { readStorage, STORAGE_KEYS } from "@/lib/storage";

type Order = { no: string; day: string; time: string; name: string; status: string; total: number; items: { name: string; qty: number }[] };

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>(defaultMenus);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEYS.adminLogin) !== "true") {
      router.replace("/admin/login");
      return;
    }
    setOrders(readStorage<Order[]>(STORAGE_KEYS.orders, []));
    setMenus(readStorage<MenuItem[]>(STORAGE_KEYS.menus, defaultMenus));
    setLoading(false);
  }, [router]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayOrders = orders.filter((order) => order.day === todayKey).length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const totalItems = orders.reduce((sum, order) => sum + (order.items || []).reduce((subtotal, item) => subtotal + Number(item.qty || 0), 0), 0);
  const bestMenus = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((order) => (order.items || []).forEach((item) => { counts[item.name] = (counts[item.name] || 0) + Number(item.qty || 0); }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders]);

  if (loading) return <main className="sb-admin-loading">Memuat dashboard admin…</main>;

  return (
    <div className="sb-admin-layout">
      <AdminSidebar />
      <main className="sb-admin-main">
        <header className="sb-admin-header"><div><p className="sb-admin-greeting">DASHBOARD</p><h1>Selamat Datang, Admin!</h1><p>Ringkasan aktivitas pesanan Soto Betawi Jakarta.</p></div><Link href="/" className="btn sb-btn-primary">Lihat Website ↗</Link></header>
        <section className="row g-3 sb-admin-stats">
          <div className="col-12 col-sm-6 col-xl-3"><article className="sb-admin-stat"><span className="sb-admin-stat-icon">🛒</span><p>Total Pesanan</p><strong>{orders.length}</strong></article></div>
          <div className="col-12 col-sm-6 col-xl-3"><article className="sb-admin-stat"><span className="sb-admin-stat-icon">📋</span><p>Pesanan Hari Ini</p><strong>{todayOrders}</strong></article></div>
          <div className="col-12 col-sm-6 col-xl-3"><article className="sb-admin-stat"><span className="sb-admin-stat-icon">💰</span><p>Total Nilai Pesanan</p><strong>{formatRupiah(totalRevenue)}</strong></article></div>
          <div className="col-12 col-sm-6 col-xl-3"><article className="sb-admin-stat"><span className="sb-admin-stat-icon">🍲</span><p>Menu Terjual</p><strong>{totalItems}</strong></article></div>
        </section>
        <section className="row g-4 sb-admin-content">
          <div className="col-12 col-xl-8"><article className="sb-admin-panel"><div className="sb-admin-panel-head"><div><h2>Pesanan Terbaru</h2><p>Pesanan yang tercatat dari formulir pemesanan website.</p></div></div><div className="table-responsive"><table className="table align-middle sb-admin-table"><thead><tr><th>No. Pesanan</th><th>Pelanggan</th><th>Total</th><th>Waktu</th><th>Status</th></tr></thead><tbody>{orders.length === 0 ? <tr><td colSpan={5} className="text-center py-4">Belum ada pesanan.</td></tr> : [...orders].reverse().slice(0, 8).map((order) => <tr key={order.no}><td><strong>{order.no}</strong></td><td>{order.name}</td><td>{formatRupiah(order.total)}</td><td>{new Date(order.time).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</td><td><span className={`sb-status ${order.status.toLowerCase()}`}>{order.status}</span></td></tr>)}</tbody></table></div><p className="sb-admin-footnote">Data pesanan tersimpan di localStorage browser ini.</p></article></div>
          <div className="col-12 col-xl-4"><article className="sb-admin-panel"><div className="sb-admin-panel-head"><div><h2>Menu Terlaris</h2><p>Diurutkan berdasarkan jumlah item terjual.</p></div></div>{bestMenus.length === 0 ? <p className="sb-admin-empty">Belum ada data penjualan.</p> : bestMenus.map(([name, qty]) => <div className="sb-best-menu" key={name}><div><strong>{name}</strong><span>{qty} item</span></div><div className="sb-best-bar"><span style={{ width: `${Math.max(8, (qty / bestMenus[0][1]) * 100)}%` }} /></div></div>)}<Link href="/admin/menu" className="btn sb-btn-outline w-100 mt-3">Kelola Menu</Link></article><article className="sb-admin-panel sb-admin-menu-shortcut"><h2>Menu Saat Ini</h2><p>{menus.filter((menu) => menu.status === "Tersedia").length} menu tersedia untuk pelanggan.</p><Link href="/admin/menu">Buka pengelolaan menu →</Link></article></div>
        </section>
      </main>
    </div>
  );
}
