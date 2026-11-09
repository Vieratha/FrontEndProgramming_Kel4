"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PAYMENT_AVAILABILITY, PAYMENT_INFO } from "@/app/lib/payment-info";

// INI BAGIAN TIPE DATA KERANJANG
type CartItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: "Makanan" | "Minuman";
  image: string;
  quantity: number;
};

// INI BAGIAN TIPE DATA JENIS PESANAN
type OrderType = "Makan di Tempat" | "Bawa Pulang";

export default function CheckoutPage() {
  const router = useRouter();

  // INI BAGIAN DATA CUSTOMER
  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");

  // INI BAGIAN JENIS PESANAN
  const [orderType, setOrderType] = useState<OrderType>("Makan di Tempat");

  const [nomorMeja, setNomorMeja] = useState("");
  const [catatan, setCatatan] = useState("");

  // INI BAGIAN METODE PEMBAYARAN
  const [paymentMethod, setPaymentMethod] = useState("Bayar di Kasir");

  // INI BAGIAN KERANJANG
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  // INI BAGIAN STATUS CHECKOUT
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // INI BAGIAN MEMBACA KERANJANG DARI BROWSER
  useEffect(() => {
    // Membaca localStorage setelah komponen selesai dipasang.
    const timer = window.setTimeout(() => {
      try {
        const savedCart = localStorage.getItem("soto-betawi-cart");

        if (savedCart) {
          const parsedCart: unknown = JSON.parse(savedCart);

          if (Array.isArray(parsedCart)) {
            setCart(parsedCart as CartItem[]);
          }
        }
      } catch (err) {
        console.error("Gagal membaca keranjang:", err);
        setError("Gagal membaca keranjang belanja.");
      } finally {
        setCartLoaded(true);
      }
    }, 0);

    // Membersihkan timer ketika halaman ditinggalkan.
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  // INI BAGIAN MENGHITUNG TOTAL SEMENTARA
  // Harga final tetap akan dihitung ulang oleh server.
  const totalHarga = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  // INI BAGIAN FORMAT RUPIAH
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  // INI BAGIAN MENYIMPAN NOMOR PESANAN DI BROWSER
  // Browser hanya menyimpan referensi, bukan rincian pesanan.
  const saveOrderReference = (orderNumber: string) => {
    try {
      const savedNumbers = localStorage.getItem("soto-betawi-order-numbers");

      const parsedNumbers: unknown = savedNumbers
        ? JSON.parse(savedNumbers)
        : [];

      const orderNumbers: string[] = Array.isArray(parsedNumbers)
        ? parsedNumbers.filter(
            (item): item is string => typeof item === "string",
          )
        : [];

      const updatedNumbers = [
        ...orderNumbers.filter((item) => item !== orderNumber),
        orderNumber,
      ].slice(-100);

      localStorage.setItem(
        "soto-betawi-order-numbers",
        JSON.stringify(updatedNumbers),
      );
    } catch (err) {
      console.error("Gagal menyimpan referensi pesanan:", err);
    }
  };

  // INI BAGIAN PROSES CHECKOUT
  const handleCheckout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (submitting) return;

    // INI BAGIAN VALIDASI KERANJANG
    if (!cartLoaded || cart.length === 0) {
      setError("Keranjang masih kosong. Silakan pilih menu terlebih dahulu.");
      return;
    }

    // INI BAGIAN VALIDASI NAMA
    if (nama.trim().length < 3) {
      setError("Nama pemesan minimal 3 karakter.");
      return;
    }

    // INI BAGIAN VALIDASI NOMOR MEJA
    if (
      orderType === "Makan di Tempat" &&
      !/^[0-9]{1,4}$/.test(nomorMeja.trim())
    ) {
      setError("Nomor meja wajib diisi dengan 1 sampai 4 digit.");
      return;
    }

    // INI BAGIAN VALIDASI NOMOR TELEPON OPSIONAL
    const nomorTelepon = telepon.replace(/[\s-]/g, "");

    if (nomorTelepon && !/^08[0-9]{8,11}$/.test(nomorTelepon)) {
      setError("Nomor telepon harus diawali 08 dan berisi 10–13 digit.");
      return;
    }

    // INI BAGIAN VALIDASI ALAMAT OPSIONAL
    if (alamat.trim() && alamat.trim().length < 10) {
      setError("Alamat harus berisi minimal 10 karakter.");
      return;
    }

    if (catatan.trim().length > 500) {
      setError("Catatan maksimal 500 karakter.");
      return;
    }

    setSubmitting(true);

    try {
      // INI BAGIAN MENGIRIM DATA CHECKOUT KE API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: nama.trim(),
          phone: nomorTelepon,
          address: alamat.trim(),
          paymentMethod,

          orderType,
          tableNumber: orderType === "Makan di Tempat" ? nomorMeja.trim() : "",

          note: catatan.trim(),

          // Kirim ID dan jumlah saja.
          // Harga final akan diambil dari database oleh API.
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

      const orderNumber = result.order?.orderNumber;

      if (typeof orderNumber !== "string" || !orderNumber) {
        throw new Error("Nomor pesanan tidak ditemukan dari server.");
      }

      // INI BAGIAN MENYIMPAN REFERENSI NOMOR PESANAN
      saveOrderReference(orderNumber);

      // INI BAGIAN MENGOSONGKAN KERANJANG
      localStorage.removeItem("soto-betawi-cart");

      // INI BAGIAN MENGARAHKAN CUSTOMER KE KONFIRMASI
      router.push(`/konfirmasi?order=${encodeURIComponent(orderNumber)}`);
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
        {/* INI BAGIAN HEADER CHECKOUT */}
        <div className="checkout-header">
          <h1>Checkout Pesanan</h1>
          <p>
            Lengkapi informasi pemesanan untuk melanjutkan pesanan Soto Betawi
            Jakarta.
          </p>
        </div>

        <div className="checkout-content">
          {/* INI BAGIAN FORM CUSTOMER */}
          <section className="checkout-form-card">
            <h2>Informasi Pemesan</h2>

            <form onSubmit={handleCheckout}>
              {/* INI BAGIAN NAMA PEMESAN */}
              <div className="checkout-form-group">
                <label htmlFor="nama">Nama Pemesan</label>
                <input
                  id="nama"
                  type="text"
                  placeholder="Masukkan nama Anda"
                  value={nama}
                  onChange={(event) => setNama(event.target.value)}
                  minLength={3}
                  maxLength={100}
                  required
                />
              </div>

              {/* INI BAGIAN JENIS PESANAN */}
              <div className="checkout-form-group">
                <label>Jenis Pesanan</label>

                <div className="checkout-order-types">
                  <label className="checkout-order-option">
                    <input
                      type="radio"
                      name="orderType"
                      value="Makan di Tempat"
                      checked={orderType === "Makan di Tempat"}
                      onChange={() => {
                        setOrderType("Makan di Tempat");
                      }}
                    />

                    <span>Makan di Tempat</span>
                  </label>

                  <label className="checkout-order-option">
                    <input
                      type="radio"
                      name="orderType"
                      value="Bawa Pulang"
                      checked={orderType === "Bawa Pulang"}
                      onChange={() => {
                        setOrderType("Bawa Pulang");
                        setNomorMeja("");
                      }}
                    />

                    <span>Bawa Pulang</span>
                  </label>
                </div>
              </div>

              {/* INI BAGIAN NOMOR MEJA */}
              {orderType === "Makan di Tempat" && (
                <div className="checkout-form-group">
                  <label htmlFor="nomorMeja">Nomor Meja</label>

                  <input
                    id="nomorMeja"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Contoh: 12"
                    value={nomorMeja}
                    onChange={(event) =>
                      setNomorMeja(
                        event.target.value.replace(/\D/g, "").slice(0, 4),
                      )
                    }
                    required
                  />
                </div>
              )}

              {/* INI BAGIAN NOMOR TELEPON */}
              <div className="checkout-form-group">
                <label htmlFor="telepon">
                  Nomor Telepon
                  <span> (Opsional)</span>
                </label>

                <input
                  id="telepon"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={telepon}
                  onChange={(event) => setTelepon(event.target.value)}
                />
              </div>

              {/* INI BAGIAN ALAMAT */}
              <div className="checkout-form-group">
                <label htmlFor="alamat">
                  Alamat
                  <span> (Opsional)</span>
                </label>

                <textarea
                  id="alamat"
                  rows={3}
                  placeholder="Masukkan alamat jika diperlukan"
                  value={alamat}
                  onChange={(event) => setAlamat(event.target.value)}
                />
              </div>

              {/* INI BAGIAN METODE PEMBAYARAN */}
              <div className="checkout-form-group">
                <label htmlFor="paymentMethod">Metode Pembayaran</label>

                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  required
                >
                  <option value="Bayar di Kasir">Bayar di Kasir</option>

                  <option value="QRIS" disabled={!PAYMENT_AVAILABILITY.qris}>
                    QRIS
                    {!PAYMENT_AVAILABILITY.qris ? " (Belum tersedia)" : ""}
                  </option>

                  <option
                    value="Transfer Bank"
                    disabled={!PAYMENT_AVAILABILITY.bankTransfer}
                  >
                    Transfer Bank
                    {!PAYMENT_AVAILABILITY.bankTransfer
                      ? " (Belum tersedia)"
                      : ""}
                  </option>
                </select>

                {/* INI BAGIAN INFORMASI PEMBAYARAN */}
                <div className="checkout-payment-info">
                  {paymentMethod === "Bayar di Kasir" && (
                    <>
                      <strong>Bayar di Kasir</strong>
                      <p>
                        Pembayaran dilakukan langsung kepada kasir restoran.
                      </p>
                    </>
                  )}

                  {paymentMethod === "QRIS" && (
                    <>
                      <strong>Pembayaran QRIS</strong>
                      <p>
                        Setelah pesanan dibuat, kamu dapat memindai QRIS resmi
                        restoran dan mengunggah bukti pembayaran.
                      </p>
                    </>
                  )}

                  {paymentMethod === "Transfer Bank" && (
                    <>
                      <strong>Transfer Bank</strong>
                      <p>
                        Setelah pesanan dibuat, informasi rekening tujuan dan
                        formulir bukti transfer akan ditampilkan.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* INI BAGIAN CATATAN PESANAN */}
              <div className="checkout-form-group">
                <label htmlFor="catatan">
                  Catatan
                  <span> (Opsional)</span>
                </label>

                <textarea
                  id="catatan"
                  rows={3}
                  maxLength={500}
                  placeholder="Contoh: tidak pakai jeroan, sambal dipisah"
                  value={catatan}
                  onChange={(event) => setCatatan(event.target.value)}
                />
              </div>

              {/* INI BAGIAN PESAN ERROR */}
              {error && (
                <p className="checkout-error" role="alert">
                  {error}
                </p>
              )}

              {/* INI TOMBOL BUAT PESANAN */}
              <button
                type="submit"
                className="checkout-button"
                disabled={submitting || !cartLoaded || cart.length === 0}
              >
                {submitting ? "Memproses Pesanan..." : "Buat Pesanan"}
              </button>
            </form>
          </section>

          {/* INI BAGIAN RINGKASAN PESANAN */}
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

            {/* INI BAGIAN TOTAL PEMBAYARAN */}
            <div className="checkout-total">
              <span>Estimasi Pembayaran</span>
              <strong>{formatRupiah(totalHarga)}</strong>
            </div>

            <p className="checkout-price-hint">
              Harga akhir akan diverifikasi kembali oleh server.
            </p>
          </section>
        </div>

        {/* INI BAGIAN KEMBALI KE MENU */}
        <Link href="/" className="checkout-back">
          ← Kembali ke Menu
        </Link>
      </div>
    </main>
  );
}
