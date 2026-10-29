
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
const [cartLoaded, setCartLoaded] = useState(false);

useEffect(() => {
  try {
    const savedCart = localStorage.getItem("soto-betawi-cart");

    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);

      if (Array.isArray(parsedCart)) {
        setCart(parsedCart);
      }
    }
  } catch (error) {
    console.error("Gagal membaca keranjang:", error);
  } finally {
    setCartLoaded(true);
  }
}, []);

const totalHarga = cart.reduce(
  (total, item) => total + item.price * item.quantity,
  0
);

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);
};

  

const handleCheckout = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  setError("");
  setSuccess("");

  // Validasi keranjang
  if (!cartLoaded || cart.length === 0) {
    setError("Keranjang masih kosong. Silakan pilih menu terlebih dahulu.");
    return;
  }

  // Validasi nama
  if (nama.trim().length < 3) {
    setError("Nama lengkap minimal 3 karakter.");
    return;
  }

  // Validasi nomor telepon
  const nomorTelepon = telepon.replace(/[\s-]/g, "");

  if (!/^08[0-9]{8,11}$/.test(nomorTelepon)) {
    setError("Nomor telepon harus diawali 08 dan berisi 10–13 digit.");
    return;
  }

  // Validasi alamat
  if (alamat.trim().length < 10) {
    setError("Alamat pengiriman minimal 10 karakter.");
    return;
  }

  // Validasi pembayaran
  if (!pembayaran) {
    setError("Silakan pilih metode pembayaran.");
    return;
  }

  // Jika semua data valid, pindah ke halaman konfirmasi
  
const pesananBaru = {
  id: `SB-${Date.now()}`,
  nama: nama.trim(),
  telepon: nomorTelepon,
  alamat: alamat.trim(),
  pembayaran,
  items: cart,
  total: totalHarga,
  status: "Menunggu Konfirmasi",
  tanggal: new Date().toISOString(),
};

try {
  // Simpan pesanan terbaru
  localStorage.setItem(
    "soto-betawi-last-order",
    JSON.stringify(pesananBaru)
  );

  // Simpan untuk riwayat pesanan
  const savedHistory = localStorage.getItem(
    "soto-betawi-orders"
  );

  const parsedHistory = savedHistory
    ? JSON.parse(savedHistory)
    : [];

  const history = Array.isArray(parsedHistory)
    ? parsedHistory
    : [];

  localStorage.setItem(
    "soto-betawi-orders",
    JSON.stringify([pesananBaru, ...history])
  );

  // Kosongkan keranjang setelah pesanan tersimpan
  localStorage.removeItem("soto-betawi-cart");

  // Arahkan ke halaman konfirmasi
  router.push("/konfirmasi");
} catch (error) {
  console.error("Gagal menyimpan pesanan:", error);
  setError(
    "Pesanan gagal disimpan. Silakan coba lagi."
  );
}

};



  return (
    <main className="checkout-page">
      <div className="checkout-container">

        <div className="checkout-header">
          <h1>Checkout Pesanan</h1>
          <p>
            Lengkapi informasi pemesanan untuk
            melanjutkan pembelian makanan.
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
                  onChange={(e) => setNama(e.target.value)}
                />
              </div>

              <div className="checkout-form-group">
                <label htmlFor="telepon">Nomor Telepon</label>
                <input
                  id="telepon"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                />
              </div>

              <div className="checkout-form-group">
                <label htmlFor="alamat">Alamat Pengiriman</label>
                <textarea
                  id="alamat"
                  rows={4}
                  placeholder="Masukkan alamat lengkap"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                />
              </div>

              <div className="checkout-form-group">
                <label htmlFor="pembayaran">
                  Metode Pembayaran
                </label>

                <select
                  id="pembayaran"
                  value={pembayaran}
                  onChange={(e) =>
                    setPembayaran(e.target.value)
                  }
                >
                  <option value="">
                    Pilih Metode Pembayaran
                  </option>
                  <option value="COD">
                    Bayar di Tempat (COD)
                  </option>
                  <option value="Transfer Bank">
                    Transfer Bank
                  </option>
                  <option value="E-Wallet">
                    E-Wallet
                  </option>
                </select>
              </div>

              <button
                type="submit"
                className="checkout-button"
              >
                Buat Pesanan
              </button>

              
              {error && (
                <p className="checkout-error" role="alert">
                  {error}
                </p>
              )}

              {success && (
                <p className="checkout-success" role="status">
                  {success}
                </p>
              )}


            </form>
          </section>

          {/* RINGKASAN PESANAN */}
          
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
            <p>
              {formatRupiah(item.price)} / item
            </p>
          </div>

          <strong>
            {formatRupiah(item.price * item.quantity)}
          </strong>
        </div>
      ))}
    </div>
  )}

  <div className="checkout-total">
    <span>Total Pembayaran</span>
    <strong>{formatRupiah(totalHarga)}</strong>
  </div>
</section>




        </div>

        <Link href="/" className="checkout-back">
          ← Kembali ke Menu
        </Link>

      </div>
    </main>
  );
}
