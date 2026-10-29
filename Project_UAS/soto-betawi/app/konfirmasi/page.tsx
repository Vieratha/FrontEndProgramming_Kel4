
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: string;
  nama: string;
  telepon: string;
  alamat: string;
  pembayaran: string;
  items: OrderItem[];
  total: number;
  status: string;
  tanggal: string;
};

export default function KonfirmasiPage() {
  const [pesanan, setPesanan] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Mengambil pesanan terbaru dari localStorage
  useEffect(() => {
    try {
      const savedOrder = localStorage.getItem(
        "soto-betawi-last-order"
      );

      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        setPesanan(parsedOrder);
      }
    } catch (error) {
      console.error("Gagal membaca pesanan:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Format harga Rupiah
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  // Format tanggal pesanan
  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Tampilan ketika data sedang dimuat
  if (loading) {
    return (
      <main className="konfirmasi-page">
        <p>Memuat data pesanan...</p>
      </main>
    );
  }

  // Tampilan jika belum ada pesanan
  if (!pesanan) {
    return (
      <main className="konfirmasi-page">
        <section className="konfirmasi-card">
          <h1>Pesanan Tidak Ditemukan</h1>

          <p className="konfirmasi-description">
            Belum ada pesanan yang bisa ditampilkan.
            Silakan pilih makanan terlebih dahulu.
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

        {/* ICON BERHASIL */}
        <div className="konfirmasi-icon">
          ✓
        </div>

        <h1>Pesanan Berhasil Dicatat!</h1>

        <p className="konfirmasi-description">
          Terima kasih, {pesanan.nama}!
          Pesanan simulasi kamu berhasil disimpan
          di browser.
        </p>

        {/* INFORMASI PESANAN */}
        <div className="konfirmasi-info">
          <h2>Detail Pesanan</h2>

          <div className="konfirmasi-row">
            <span>Nomor Pesanan</span>
            <strong>{pesanan.id}</strong>
          </div>

          <div className="konfirmasi-row">
            <span>Tanggal Pesanan</span>
            <strong>
              {formatTanggal(pesanan.tanggal)}
            </strong>
          </div>

          <div className="konfirmasi-row">
            <span>Nama Pemesan</span>
            <strong>{pesanan.nama}</strong>
          </div>

          <div className="konfirmasi-row">
            <span>Status Pesanan</span>
            <strong>{pesanan.status}</strong>
          </div>

          <div className="konfirmasi-row">
            <span>Metode Pembayaran</span>
            <strong>{pesanan.pembayaran}</strong>
          </div>

          {/* DAFTAR MAKANAN */}
          <h2 className="konfirmasi-menu-title">
            Menu yang Dipesan
          </h2>

          <div className="konfirmasi-items">
            {pesanan.items.map((item) => (
              <div
                className="konfirmasi-item"
                key={item.id}
              >
                <div>
                  <h3>{item.name}</h3>
                  <p>Jumlah: {item.quantity}</p>
                </div>

                <strong>
                  {formatRupiah(
                    item.price * item.quantity
                  )}
                </strong>
              </div>
            ))}
          </div>

          {/* TOTAL PEMBAYARAN */}
          <div className="konfirmasi-total">
            <span>Total Pembayaran</span>
            <strong>
              {formatRupiah(pesanan.total)}
            </strong>
          </div>
        </div>

        {/* TOMBOL NAVIGASI */}
        <div className="konfirmasi-actions">
          <Link
            href="/"
            className="konfirmasi-button"
          >
            Kembali ke Beranda
          </Link>

          <Link
            href="/riwayat"
            className="konfirmasi-secondary"
          >
            Lihat Riwayat Pesanan
          </Link>
        </div>

      </section>
    </main>
  );
}
