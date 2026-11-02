"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: "Makanan" | "Minuman";
  image: string;
  quantity: number;
};

export default function CheckoutPage() {
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [pembayaran, setPembayaran] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // MEMBACA KERANJANG DARI BROWSER
  useEffect(() => {
    const readCart = () => {
      try {
        const savedCart = localStorage.getItem("soto-betawi-cart");

        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);

          if (Array.isArray(parsedCart)) {
            setCart(parsedCart);
          }
        }
      } catch (err) {
        console.error("Gagal membaca keranjang:", err);
        setError("Gagal membaca keranjang belanja.");
      } finally {
        setCartLoaded(true);
      }
    };

    readCart();
  }, []);

  // TOTAL SEMENTARA UNTUK TAMPILAN
  // Harga final tetap dihitung ulang oleh server.
  const totalHarga = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  // PROSES CHECKOUT KE DATABASE
  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (submitting) return;

    if (!cartLoaded || cart.length === 0) {
      setError("Keranjang masih kosong. Silakan pilih menu terlebih dahulu.");
      return;
    }

    if (nama.trim().length < 3) {
      setError("Nama lengkap minimal 3 karakter.");
      return;
    }

    const nomorTelepon = telepon.replace(/[\s-]/g, "");

    if (!/^08[0-9]{8,11}$/.test(nomorTelepon)) {
      setError("Nomor telepon harus diawali 08 dan berisi 10–13 digit.");
      return;
    }

    if (alamat.trim().length < 10) {
      setError("Alamat pengiriman minimal 10 karakter.");
      return;
    }

    if (!["COD", "Transfer Bank", "E-Wallet"].includes(pembayaran)) {
      setError("Silakan pilih metode pembayaran yang valid.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: nama.trim(),
          phone: nomorTelepon,
          address: alamat.trim(),
          paymentMethod: pembayaran,
          items: cart.map((item) => ({
            menuId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Pesanan gagal diproses.");
      }

      if (!result.order?.orderNumber) {
        throw new Error("Nomor pesanan tidak ditemukan dari server.");
      }

      localStorage.removeItem("soto-betawi-cart");

      router.push(
        `/konfirmasi?order=${encodeURIComponent(result.order.orderNumber)}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat membuat pesanan.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <h1>Checkout Pesanan</h1>
          <p>
            Lengkapi informasi pemesanan untuk melanjutkan pembelian makanan.
          </p>
        </div>

        <div className="checkout-content">
          {/* FORM CUSTOMER */}
          <section className="checkout-form-card">
            <h2>Informasi Pemesan</h2>

            <form onSubmit={handleCheckout}>
              <div className="checkout-form-group">
                <label htmlFor="nama">Nama Lengkap</label>
                <input
                  id="nama"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={nama}
                  onChange={(event) => setNama(event.target.value)}
                  required
                />
              </div>

              <div className="checkout-form-group">
                <label htmlFor="telepon">Nomor Telepon</label>
                <input
                  id="telepon"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={telepon}
                  onChange={(event) => setTelepon(event.target.value)}
                  required
                />
              </div>

              <div className="checkout-form-group">
                <label htmlFor="alamat">Alamat Pengiriman</label>
                <textarea
                  id="alamat"
                  rows={4}
                  placeholder="Masukkan alamat lengkap"
                  value={alamat}
                  onChange={(event) => setAlamat(event.target.value)}
                  required
                />
              </div>

              <div className="checkout-form-group">
                <label htmlFor="pembayaran">Metode Pembayaran</label>

                <select
                  id="pembayaran"
                  value={pembayaran}
                  onChange={(event) => setPembayaran(event.target.value)}
                  required
                >
                  <option value="">Pilih Metode Pembayaran</option>
                  <option value="COD">Bayar di Tempat (COD)</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="E-Wallet">E-Wallet</option>
                </select>
              </div>

              {error && (
                <p className="checkout-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="checkout-button"
                disabled={submitting || !cartLoaded || cart.length === 0}
              >
                {submitting ? "Memproses Pesanan..." : "Buat Pesanan"}
              </button>
            </form>
          </section>

          {/* RINGKASAN PESANAN */}
          <section className="checkout-summary">
            <h2>Ringkasan Pesanan</h2>

            {!cartLoaded ? (
              <p>Memuat keranjang...</p>
            ) : cart.length === 0 ? (
              <div className="checkout-empty">
                <p>Keranjang belanja masih kosong.</p>
                <Link href="/">Pilih Menu Sekarang</Link>
              </div>
            ) : (
              <div className="checkout-items">
                {cart.map((item) => (
                  <div className="checkout-item" key={item.id}>
                    <div>
                      <h3>{item.name}</h3>
                      <p>Jumlah: {item.quantity}</p>
                      <p>{formatRupiah(item.price)} / item</p>
                    </div>

                    <strong>{formatRupiah(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="checkout-total">
              <span>Estimasi Pembayaran</span>
              <strong>{formatRupiah(totalHarga)}</strong>
            </div>

            <p style={{ fontSize: "12px", color: "#8d837a" }}>
              Harga akhir akan diverifikasi kembali oleh server.
            </p>
          </section>
        </div>

        <Link href="/" className="checkout-back">
          ← Kembali ke Menu
        </Link>
      </div>
    </main>
  );
}
