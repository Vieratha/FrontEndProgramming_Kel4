"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MenuCard from "@/components/MenuCard";
import SiteFooter from "@/components/SiteFooter";
import SiteNavbar from "@/components/SiteNavbar";
import { defaultMenus, formatRupiah, type MenuItem } from "@/data/menus";
import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";

type Customer = { id: number; name: string; email: string };
type CartItem = MenuItem & { qty: number };
type Order = {
  no: string;
  day: string;
  time: string;
  type: string;
  table: string;
  name: string;
  note: string;
  items: CartItem[];
  total: number;
  status: string;
};

const faqs = [
  { question: "Apa saja menu yang tersedia?", answer: "Kami menyediakan Soto Betawi Spesial, Nasi Uduk, Kerak Telor, dan Bir Pletok Rempah." },
  { question: "Apakah Soto Betawi bisa dibawa pulang?", answer: "Ya. Semua menu dapat dipesan untuk dibawa pulang melalui fitur pemesanan online di website." },
  { question: "Di mana lokasi restoran?", answer: "Saat ini Soto Betawi Jakarta memiliki cabang di Menteng, Jakarta Pusat dan Kemang, Jakarta Selatan." },
  { question: "Jam berapa restoran buka?", answer: "Restoran buka setiap hari mulai pukul 10:00 hingga 22:00." },
];

export default function HomePageClient() {
  const [menus, setMenus] = useState<MenuItem[]>(defaultMenus);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderType, setOrderType] = useState("Makan di tempat");
  const [tableNumber, setTableNumber] = useState("");
  const [orderName, setOrderName] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [orderError, setOrderError] = useState("");
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [toast, setToast] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Mengambil data dari localStorage setelah komponen berjalan di browser.
  useEffect(() => {
    const savedMenus = readStorage<MenuItem[]>(STORAGE_KEYS.menus, []);
    const savedCart = readStorage<Record<string, CartItem>>(STORAGE_KEYS.cart, {});
    const savedCustomer = readStorage<Customer | null>(STORAGE_KEYS.userLogin, null);
    if (savedMenus.length > 0) setMenus(savedMenus);
    else writeStorage(STORAGE_KEYS.menus, defaultMenus);
    setCart(savedCart);
    setCustomer(savedCustomer);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeStorage(STORAGE_KEYS.menus, menus);
  }, [menus, ready]);

  useEffect(() => {
    if (!ready) return;
    writeStorage(STORAGE_KEYS.cart, cart);
  }, [cart, ready]);

  // Sinkronisasi jika menu atau akun berubah dari tab browser lain.
  useEffect(() => {
    const syncStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.menus) setMenus(readStorage(STORAGE_KEYS.menus, defaultMenus));
      if (event.key === STORAGE_KEYS.userLogin) setCustomer(readStorage<Customer | null>(STORAGE_KEYS.userLogin, null));
      if (event.key === STORAGE_KEYS.cart) setCart(readStorage(STORAGE_KEYS.cart, {} as Record<string, CartItem>));
    };
    window.addEventListener("storage", syncStorage);
    return () => window.removeEventListener("storage", syncStorage);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.body.classList.toggle("sb-drawer-open", drawerOpen);
    return () => document.body.classList.remove("sb-drawer-open");
  }, [drawerOpen]);

  const visibleMenus = useMemo(() => menus.filter((menu) => {
    const matchesName = menu.name.toLowerCase().includes(search.toLowerCase().trim());
    const matchesCategory = category === "Semua" || menu.category === category;
    return menu.status === "Tersedia" && matchesName && matchesCategory;
  }), [menus, search, category]);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.qty * item.price, 0);

  function notify(message: string) {
    setToast(message);
  }

  function addToCart(menu: MenuItem) {
    setCart((current) => ({
      ...current,
      [menu.id]: current[menu.id]
        ? { ...current[menu.id], qty: current[menu.id].qty + 1 }
        : { ...menu, qty: 1 },
    }));
    setReceipt(null);
    notify(`${menu.name} ditambahkan ke keranjang.`);
  }

  function changeQuantity(id: string, delta: number) {
    setCart((current) => {
      const item = current[id];
      if (!item) return current;
      const nextQty = item.qty + delta;
      if (nextQty <= 0) {
        const updated = { ...current };
        delete updated[id];
        return updated;
      }
      return { ...current, [id]: { ...item, qty: nextQty } };
    });
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function clearCart() {
    setCart({});
    setReceipt(null);
    setOrderError("");
  }

  function checkout() {
    if (cartItems.length === 0) {
      setOrderError("Keranjang masih kosong. Silakan pilih menu terlebih dahulu.");
      return;
    }
    if (orderType === "Makan di tempat" && !tableNumber.trim()) {
      setOrderError("Mohon isi nomor meja Anda.");
      return;
    }
    if (!orderName.trim()) {
      setOrderError("Mohon isi nama pemesan.");
      return;
    }

    const oldOrders = readStorage<Order[]>(STORAGE_KEYS.orders, []);
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const order: Order = {
      no: `SB-${datePart}-${String(oldOrders.length + 1).padStart(3, "0")}`,
      day: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
      time: now.toISOString(),
      type: orderType,
      table: orderType === "Makan di tempat" ? tableNumber.trim() : "",
      name: orderName.trim(),
      note: orderNote.trim(),
      items: cartItems,
      total: cartTotal,
      status: "Baru",
    };
    writeStorage(STORAGE_KEYS.orders, [...oldOrders, order]);
    setReceipt(order);
    setCart({});
    setTableNumber("");
    setOrderName("");
    setOrderNote("");
    setOrderError("");
  }

  function logoutCustomer() {
    window.localStorage.removeItem(STORAGE_KEYS.userLogin);
    setCustomer(null);
    notify("Anda sudah logout.");
  }

  return (
    <>
      <SiteNavbar cartCount={cartCount} onCartClick={() => { setDrawerOpen(true); setReceipt(null); }} user={customer} onLogout={logoutCustomer} />
      <main>
        <section className="sb-hero" id="home">
          <div className="container sb-hero-grid">
            <div className="sb-hero-copy">
              <p className="sb-eyebrow">WARISAN KULINER</p>
              <h1>Rasa Asli Betawi,<br /><span>Hangat</span> di Setiap<br />Suapan</h1>
              <p className="sb-hero-description">Nikmati Soto Betawi dengan cita rasa khas Jakarta, dibuat dari bahan pilihan dan resep yang diwariskan dari generasi ke generasi.</p>
              <div className="sb-hero-actions">
                <a className="btn sb-btn-primary" href="#menu">Lihat Menu <span aria-hidden="true">›</span></a>
                <a className="btn sb-btn-outline" href="#lokasi">Temukan Lokasi</a>
              </div>
              <div className="sb-hero-note"><span>✦</span> Resep autentik sejak 1980</div>
            </div>
            <div className="sb-hero-image-wrap">
              <Image className="sb-hero-image" src="/images/hero-soto.jpeg" alt="Semangkuk Soto Betawi" fill priority sizes="(max-width: 820px) 100vw, 50vw" />
              <div className="sb-hero-badge"><strong>46+</strong><span>Tahun menjaga<br />warisan rasa</span></div>
            </div>
          </div>
        </section>

        <section className="sb-about sb-section-cream" id="tentang">
          <div className="container sb-about-grid">
            <div className="sb-about-image-wrap"><Image src="/images/tentang-betawi.jpeg" alt="Tradisi kuliner Betawi" fill sizes="(max-width: 820px) 100vw, 50vw" /></div>
            <div className="sb-about-copy">
              <p className="sb-eyebrow">WARISAN KULINER BETAWI</p>
              <h2>Cita Rasa Otentik Sejak 1980</h2>
              <p>Berawal dari kedai sederhana di pinggiran Jakarta, kami mendedikasikan diri untuk melestarikan keaslian cita rasa masakan Betawi. Resep kaldu gurih berpadu rempah-rempah alami terus kami jaga demi memanjakan lidah para penikmat kuliner sejati.</p>
              <p>Kami percaya bahwa makanan yang lezat lahir dari kesabaran dan kecintaan. Setiap potongan daging sapi pilihan dimasak perlahan hingga empuk sempurna, disajikan hangat dengan kuah santan dan susu yang kaya rasa.</p>
              <div className="sb-about-stats"><div><strong>46+</strong><span>Tahun Warisan Rasa</span></div><div><strong>20+</strong><span>Rempah Pilihan</span></div><blockquote>“Melestarikan Tradisi,<br />Menghidupkan Memori.”</blockquote></div>
            </div>
          </div>
        </section>

        <section className="sb-menu-section" id="menu">
          <div className="container">
            <div className="sb-menu-controls">
              <input className="form-control sb-search-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari menu..." aria-label="Cari menu" />
              <div className="sb-menu-filter" aria-label="Filter kategori menu">
                {["Semua", "Makanan", "Minuman"].map((item) => <button key={item} type="button" className={`sb-filter-btn ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}
              </div>
            </div>
            <div className="sb-section-heading centered">
              <p className="sb-pill-label">MENU PILIHAN</p>
              <h2>Menu Andalan Kami</h2>
              <p>Rasakan kelezatan legendaris dari menu terbaik buatan koki ahli kami yang selalu konsisten menjaga tradisi.</p>
            </div>
            <div className="row g-4 sb-menu-grid">
              {visibleMenus.map((menu) => <div className="col-12 col-md-6 col-lg-4" key={menu.id}><MenuCard menu={menu} favorite={favorites.includes(menu.id)} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} /></div>)}
            </div>
            {visibleMenus.length === 0 && <p className="sb-empty-state">Menu tidak ditemukan. Coba kata kunci atau kategori lain.</p>}
            <p className="sb-menu-note">Harga dapat berubah sewaktu-waktu. Pesanan disimpan pada browser ini sebagai demonstrasi praktikum.</p>
          </div>
        </section>

        <section className="sb-features sb-section-cream">
          <div className="container">
            <div className="sb-section-heading centered compact"><p className="sb-pill-label">KEUNGGULAN</p><h2>Mengapa Harus Kami?</h2><p>Kami menyajikan lebih dari sekadar hidangan. Kami menawarkan kepuasan rasa yang abadi.</p></div>
            <div className="row g-3 sb-feature-grid">
              <div className="col-12 col-sm-6 col-lg-3"><article className="sb-feature-card"><div className="sb-icon-box">▣</div><h3>Resep Turun Temurun</h3><p>Kuah legendaris kami diracik menggunakan rempah pilihan untuk menjaga rasa yang khas.</p></article></div>
              <div className="col-12 col-sm-6 col-lg-3"><article className="sb-feature-card"><div className="sb-icon-box">♨</div><h3>Bahan Segar Pilihan</h3><p>Daging dan sayuran dipilih dengan teliti agar setiap hidangan terasa istimewa.</p></article></div>
              <div className="col-12 col-sm-6 col-lg-3"><article className="sb-feature-card"><div className="sb-icon-box">⌂</div><h3>Suasana Hangat</h3><p>Perpaduan estetika Betawi klasik dan kenyamanan modern untuk berkumpul.</p></article></div>
              <div className="col-12 col-sm-6 col-lg-3"><article className="sb-feature-card"><div className="sb-icon-box">♙</div><h3>Halal Terjamin</h3><p>Memilih bahan dengan cermat dan menjaga proses penyajian secara bertanggung jawab.</p></article></div>
            </div>
          </div>
        </section>

        <section className="sb-restaurant-banner" aria-label="Suasana restoran"><Image src="/images/suasana-restoran.jpeg" alt="Suasana restoran Soto Betawi Jakarta" fill sizes="100vw" /></section>

        <section className="sb-testimonials">
          <div className="container">
            <div className="sb-section-heading centered"><p className="sb-pill-label">CERITA PELANGGAN</p><h2>Apa Kata Mereka</h2><p>Kebahagiaan pengunjung adalah pencapaian terbesar kami. Berikut cerita dari meja makan kami.</p></div>
            <div className="row g-4 sb-testimonial-grid">
              <div className="col-12 col-md-6 col-lg-4"><article className="sb-testimonial-card"><div className="sb-stars" aria-label="5 dari 5 bintang">★★★★★</div><p>“Soto Betawi paling pas yang pernah saya rasakan di Jakarta. Kuahnya kental dan gurih seimbang. Dagingnya melimpah dan sangat lembut!”</p><div className="sb-customer"><Image src="/images/avatar-bambang.jpeg" alt="Bambang Pamungkas" width={54} height={54} /><div><strong>Bambang Pamungkas</strong><span>Kuliner Enthusiast</span></div></div></article></div>
              <div className="col-12 col-md-6 col-lg-4"><article className="sb-testimonial-card"><div className="sb-stars" aria-label="5 dari 5 bintang">★★★★★</div><p>“Kombinasi kuah susu dan santannya juara sekali. Kerak telornya juga dimasak matang merata dengan serundeng wangi.”</p><div className="sb-customer"><Image src="/images/avatar-arini.jpeg" alt="Arini Setya" width={54} height={54} /><div><strong>Arini Setya</strong><span>Keluarga Dine-In</span></div></div></article></div>
              <div className="col-12 col-md-6 col-lg-4"><article className="sb-testimonial-card"><div className="sb-stars" aria-label="5 dari 5 bintang">★★★★★</div><p>“Interiornya memadukan gaya modern dan tradisional, dengan rasa makanan yang kaya bumbu. Tempat yang nyaman untuk makan bersama.”</p><div className="sb-customer"><Image src="/images/avatar-david.jpeg" alt="David Wijaya" width={54} height={54} /><div><strong>David Wijaya</strong><span>Pengunjung</span></div></div></article></div>
            </div>
          </div>
        </section>

        <section className="sb-locations sb-section-cream" id="lokasi">
          <div className="container"><div className="sb-section-heading centered compact"><p className="sb-pill-label">RESTORAN KAMI</p><h2>Temukan Kami</h2><p>Kunjungi cabang terdekat di Jakarta untuk menikmati soto hangat langsung di tempat.</p></div>
            <div className="row g-4 sb-location-grid">
              <div className="col-12 col-lg-6"><article className="sb-location-card"><div className="sb-location-map"><Image src="/images/map-menteng.jpeg" alt="Peta lokasi cabang Menteng" fill sizes="(max-width: 992px) 100vw, 50vw" /></div><div className="sb-location-info"><h3>Menteng, Jakarta Pusat</h3><p>Jl. Teuku Umar No. 12, Menteng, Kota Jakarta Pusat, 10310</p><p className="sb-meta">◷ Buka Setiap Hari: 10:00–22:00</p><p className="sb-meta">☎ +62 21 390-1234</p><a className="sb-text-link" href="https://maps.google.com/?q=Menteng+Jakarta+Pusat" target="_blank" rel="noreferrer">Lihat di Peta ↗</a></div></article></div>
              <div className="col-12 col-lg-6"><article className="sb-location-card"><div className="sb-location-map"><Image src="/images/map-kemang.jpeg" alt="Peta lokasi cabang Kemang" fill sizes="(max-width: 992px) 100vw, 50vw" /></div><div className="sb-location-info"><h3>Kemang, Jakarta Selatan</h3><p>Jl. Kemang Raya No. 45B, Bangka, Mampang Prapatan, Jakarta Selatan, 12730</p><p className="sb-meta">◷ Buka Setiap Hari: 10:00–22:00</p><p className="sb-meta">☎ +62 21 719-5678</p><a className="sb-text-link" href="https://maps.google.com/?q=Kemang+Jakarta+Selatan" target="_blank" rel="noreferrer">Lihat di Peta ↗</a></div></article></div>
            </div>
          </div>
        </section>

        <section className="sb-faq-section">
          <div className="container"><div className="sb-section-heading centered"><p className="sb-pill-label">PERTANYAAN UMUM</p><h2>Pertanyaan yang Sering Ditanyakan</h2><p>Temukan jawaban atas pertanyaan umum seputar menu, lokasi, dan layanan Soto Betawi Jakarta.</p></div>
            <div className="sb-faq-list">{faqs.map((faq, index) => <article className={`sb-faq-item ${openFaq === index ? "is-open" : ""}`} key={faq.question}><button type="button" className="sb-faq-question" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{faq.question}</span><span className="sb-faq-icon">{openFaq === index ? "−" : "+"}</span></button>{openFaq === index && <div className="sb-faq-answer"><p>{faq.answer}</p></div>}</article>)}</div>
          </div>
        </section>

        <section className="sb-cta" id="pesan"><div className="container sb-cta-content"><p className="sb-pill-label light">RESERVASI &amp; PESANAN</p><h2>Siap Menikmati Soto Betawi Terbaik?</h2><p>Pesan sekarang secara online atau langsung kunjungi restoran kami untuk pengalaman bersantap yang nyaman.</p><div className="sb-cta-actions"><button type="button" className="btn sb-btn-green" onClick={() => { setDrawerOpen(true); setReceipt(null); }}>Pesan Online <span aria-hidden="true">↗</span></button><a href="tel:+62811999787" className="btn sb-btn-outline-light">Hubungi Kami</a></div></div></section>
      </main>
      <SiteFooter />

      {drawerOpen && <div className="sb-cart-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDrawerOpen(false); }}>
        <aside className="sb-cart-drawer" role="dialog" aria-modal="true" aria-labelledby="sb-cart-title">
          <div className="sb-cart-head"><h2 id="sb-cart-title">{receipt ? "Pesanan Diterima" : "Keranjang Anda"}</h2><button type="button" className="sb-cart-close" onClick={() => setDrawerOpen(false)} aria-label="Tutup keranjang">×</button></div>
          {receipt ? <div className="sb-receipt"><div className="sb-receipt-icon">✓</div><p className="sb-receipt-sub">Nomor pesanan Anda</p><h3>{receipt.no}</h3><p>Terima kasih, {receipt.name}. Pesanan kamu sudah tercatat pada browser ini.</p><div className="sb-receipt-lines">{receipt.items.map((item) => <div key={item.id}><span>{item.name} × {item.qty}</span><strong>{formatRupiah(item.price * item.qty)}</strong></div>)}</div><div className="sb-receipt-total"><span>Total</span><strong>{formatRupiah(receipt.total)}</strong></div><p className="sb-cart-hint">Pembayaran dilakukan di kasir. Ini merupakan simulasi pemesanan tanpa pembayaran daring.</p><button type="button" className="btn sb-btn-primary w-100" onClick={() => window.print()}>Cetak Struk</button><button type="button" className="btn sb-btn-outline w-100 mt-2" onClick={() => { setReceipt(null); setDrawerOpen(false); }}>Selesai</button></div> : <>
            <div className="sb-cart-body">{cartItems.length === 0 ? <div className="sb-cart-empty"><span>🛒</span><strong>Keranjang masih kosong</strong><p>Pilih menu favoritmu untuk memulai pesanan.</p><button type="button" className="btn sb-btn-primary" onClick={() => { setDrawerOpen(false); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }}>Lihat Menu</button></div> : cartItems.map((item) => <div className="sb-cart-item" key={item.id}><div className="sb-cart-item-info"><strong>{item.name}</strong><span>{formatRupiah(item.price)} / item</span><b>{formatRupiah(item.price * item.qty)}</b></div><div className="sb-qty-control"><button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label={`Kurangi ${item.name}`}>−</button><span>{item.qty}</span><button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label={`Tambah ${item.name}`}>+</button></div></div>)}</div>
            <div className="sb-cart-foot"><div className="sb-cart-total"><span>Total</span><strong>{formatRupiah(cartTotal)}</strong></div><div className="sb-cart-field"><span>Jenis Pesanan</span><div className="sb-order-type"><label className={orderType === "Makan di tempat" ? "selected" : ""}><input type="radio" name="orderType" checked={orderType === "Makan di tempat"} onChange={() => setOrderType("Makan di tempat")} /> Makan di tempat</label><label className={orderType === "Bawa pulang" ? "selected" : ""}><input type="radio" name="orderType" checked={orderType === "Bawa pulang"} onChange={() => setOrderType("Bawa pulang")} /> Bawa pulang</label></div></div>
              {orderType === "Makan di tempat" && <label className="sb-cart-field"><span>Nomor Meja</span><input className="form-control" value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} maxLength={4} inputMode="numeric" placeholder="Contoh: 12" /></label>}
              <label className="sb-cart-field"><span>Nama Pemesan</span><input className="form-control" value={orderName} onChange={(event) => setOrderName(event.target.value)} placeholder="Nama Anda" autoComplete="name" /></label>
              <label className="sb-cart-field"><span>Catatan (opsional)</span><textarea className="form-control" value={orderNote} onChange={(event) => setOrderNote(event.target.value)} rows={2} placeholder="Contoh: sambal dipisah" /></label>
              {orderError && <p className="sb-form-error" role="alert">{orderError}</p>}
              <button type="button" className="btn sb-btn-green w-100" onClick={checkout}>Kirim Pesanan</button><p className="sb-cart-hint">Pembayaran dilakukan di kasir. Tidak ada transaksi pembayaran daring.</p>{cartItems.length > 0 && <button type="button" className="sb-cart-clear" onClick={clearCart}>Kosongkan keranjang</button>}
            </div>
          </>}
        </aside>
      </div>}
      {toast && <div className="sb-toast" role="status" aria-live="polite">{toast}</div>}
    </>
  );
}
