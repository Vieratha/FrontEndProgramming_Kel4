
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
  pembayaran: string;
  items: OrderItem[];
  total: number;
  status: string;
  tanggal: string;
};

export default function RiwayatPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedOrders = localStorage.getItem(
        "soto-betawi-orders"
      );

      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);

        if (Array.isArray(parsedOrders)) {
          setOrders(parsedOrders);
        }
      }
    } catch (error) {
      console.error("Gagal membaca riwayat:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <main className="riwayat-page">
      <div className="riwayat-container">
        <div className="riwayat-header">
          <h1>Riwayat Pesanan</h1>
          <p>
            Lihat kembali daftar pesanan Soto Betawi Jakarta.
          </p>
        </div>

        {loading ? (
          <p>Memuat riwayat pesanan...</p>
        ) : orders.length === 0 ? (
          <div className="riwayat-empty">
            <h2>Belum Ada Pesanan</h2>
            <p>
              Kamu belum memiliki riwayat pesanan.
              Yuk pilih makanan favoritmu!
            </p>

            <Link href="/" className="riwayat-button">
              Lihat Menu
            </Link>
          </div>
        ) : (
          <div className="riwayat-list">
            {orders.map((order) => (
              <article className="riwayat-card" key={order.id}>
                <div className="riwayat-card-header">
                  <div>
                    <h2>{order.id}</h2>
                    <p>{formatTanggal(order.tanggal)}</p>
                  </div>

                  <span className="riwayat-status">
                    {order.status}
                  </span>
                </div>

                <div className="riwayat-detail">
                  <p>
                    <strong>Nama Pemesan:</strong> {order.nama}
                  </p>
                  <p>
                    <strong>Pembayaran:</strong> {order.pembayaran}
                  </p>
                </div>

                <div className="riwayat-items">
                  <h3>Daftar Menu</h3>

                  {order.items.map((item) => (
                    <div
                      className="riwayat-item"
                      key={item.id}
                    >
                      <span>
                        {item.name} × {item.quantity}
                      </span>

                      <strong>
                        {formatRupiah(
                          item.price * item.quantity
                        )}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="riwayat-total">
                  <span>Total Pembayaran</span>
                  <strong>{formatRupiah(order.total)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}

        <Link href="/" className="riwayat-back">
          ← Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
