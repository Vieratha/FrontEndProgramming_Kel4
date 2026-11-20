"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Menu } from "../lib/menuStorage";

type CartItem = Menu & {
  quantity: number;
};

type MenuWithFavorite = Menu & {
  favoriteCount: number;
  isFavorited: boolean;
};

type MenuSectionProps = {
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  onCartCountChange: (count: number) => void;
};

export default function MenuSection({
  isCartOpen,
  setIsCartOpen,
  onCartCountChange,
}: MenuSectionProps) {
  // DATA MENU
  const [menus, setMenus] = useState<MenuWithFavorite[]>([]);
  const [menusLoaded, setMenusLoaded] = useState(false);
  const [menuError, setMenuError] = useState("");

  // SEARCH DAN FILTER
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // FAVORIT
  const [favoriteBusyIds, setFavoriteBusyIds] = useState<number[]>([]);

  // KERANJANG
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  // FEEDBACK SETELAH MENAMBAHKAN MENU
  const [cartFeedback, setCartFeedback] = useState<{
    name: string;
  } | null>(null);

  // MENGAMBIL MENU DAN KERANJANG
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const response = await fetch("/api/menus");

        if (!response.ok) {
          throw new Error("Gagal mengambil data menu.");
        }

        const data: MenuWithFavorite[] = await response.json();

        if (cancelled) return;

        // Simpan menu dari database
        setMenus(data);
        setMenuError("");

        // Baca keranjang setelah menu berhasil dimuat
        const savedCart = localStorage.getItem("soto-betawi-cart");
        const parsedCart: unknown = savedCart ? JSON.parse(savedCart) : [];

        let updatedCart: CartItem[] = [];

        if (Array.isArray(parsedCart)) {
          updatedCart = parsedCart.flatMap((item: CartItem) => {
            const currentMenu = data.find((menu) => menu.id === item.id);

            const quantity = Number(item.quantity);

            // Abaikan menu yang sudah dihapus atau habis
            if (
              !currentMenu ||
              currentMenu.status === "Habis" ||
              !Number.isInteger(quantity) ||
              quantity <= 0
            ) {
              return [];
            }

            return [
              {
                ...currentMenu,
                quantity,
              },
            ];
          });
        }

        if (cancelled) return;

        setCart(updatedCart);

        localStorage.setItem("soto-betawi-cart", JSON.stringify(updatedCart));
      } catch (error) {
        console.error("Gagal memuat data:", error);

        if (!cancelled) {
          setMenuError(
            "Menu belum dapat dimuat. Silakan coba muat ulang halaman.",
          );
        }
      } finally {
        if (!cancelled) {
          setMenusLoaded(true);
          setCartLoaded(true);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // MENYIMPAN KERANJANG
  useEffect(() => {
    if (!cartLoaded) return;

    try {
      localStorage.setItem("soto-betawi-cart", JSON.stringify(cart));
    } catch (error) {
      console.error("Gagal menyimpan keranjang:", error);
    }
  }, [cart, cartLoaded]);

  // MENGHILANGKAN NOTIFIKASI KERANJANG
  useEffect(() => {
    if (!cartFeedback) return;

    const timeout = window.setTimeout(() => {
      setCartFeedback(null);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [cartFeedback]);

  // MEMPERBARUI JUMLAH FAVORIT SECARA BERKALA
  useEffect(() => {
    const refreshMenus = async () => {
      try {
        const response = await fetch("/api/menus", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data: MenuWithFavorite[] = await response.json();
        setMenus(data);
      } catch (error) {
        console.error("Gagal memperbarui jumlah favorit:", error);
      }
    };

    // MENUTUP DRAWER DENGAN TOMBOL ESCAPE
useEffect(() => {
  if (!isCartOpen) return;

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsCartOpen(false);
    }
  };

  document.body.style.overflow = "hidden";
  window.addEventListener("keydown", handleEscape);

  return () => {
    document.body.style.overflow = "";
    window.removeEventListener("keydown", handleEscape);
  };
}, [isCartOpen, setIsCartOpen]);

    const interval = window.setInterval(refreshMenus, 10000);

    return () => window.clearInterval(interval);
  }, []);

  // TAMBAH MENU KE KERANJANG
  const addToCart = (menu: Menu) => {
    if (menu.status === "Habis") return;

    setCart((previous) => {
      const existing = previous.find((item) => item.id === menu.id);

      if (existing) {
        return previous.map((item) =>
          item.id === menu.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...previous,
        {
          ...menu,
          quantity: 1,
        },
      ];
    });

    setCartFeedback({
      name: menu.name,
    });
  };

  // INI BAGIAN MENGUBAH STATUS FAVORIT
  const toggleFavorite = async (menu: MenuWithFavorite) => {
    if (favoriteBusyIds.includes(menu.id)) return;

    setFavoriteBusyIds((previous) => [...previous, menu.id]);

    try {
      const response = await fetch("/api/favorites", {
        method: menu.isFavorited ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuId: menu.id,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah favorit.");
      }

      setMenus((previous) =>
        previous.map((item) =>
          item.id === menu.id
            ? {
                ...item,
                favoriteCount: data.favoriteCount,
                isFavorited: data.isFavorited,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Gagal mengubah favorit:", error);
      window.alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengubah favorit.",
      );
    } finally {
      setFavoriteBusyIds((previous) => previous.filter((id) => id !== menu.id));
    }
  };

  // TAMBAH JUMLAH
  const increaseQuantity = (id: number) => {
    const currentMenu = menus.find((menu) => menu.id === id);

    if (!currentMenu || currentMenu.status === "Habis") {
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  };

  // KURANGI JUMLAH
  const decreaseQuantity = (id: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  // HAPUS MENU DARI KERANJANG
  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // TOTAL ITEM KERANJANG
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  // KIRIM JUMLAH ITEM KE HOMECLIENT
  useEffect(() => {
    onCartCountChange(totalItems);
  }, [totalItems, onCartCountChange]);

  // TOTAL HARGA
  const totalHarga = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  // FORMAT RUPIAH
  const formatRupiah = (harga: number) => {
    return `Rp ${harga.toLocaleString("id-ID")}`;
  };

  // FILTER MENU
  const menuFiltered = menus.filter((menu) => {
    const cocokNama = menu.name
      .toLowerCase()
      .includes(search.toLowerCase().trim());

    const cocokKategori =
      filter === "all" || menu.category.toLowerCase() === filter;

    return cocokNama && cocokKategori;
  });

  return (
    <section className="menu-section" id="menu">
      <div className="container">
        {/* SEARCH DAN FILTER */}
        <div className="menu-controls">
          <input
            type="text"
            id="menuSearch"
            placeholder="Cari menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="menu-filter">
            {[
              { label: "Semua", value: "all" },
              { label: "Makanan", value: "makanan" },
              { label: "Minuman", value: "minuman" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                className={
                  filter === item.value ? "filter-btn active" : "filter-btn"
                }
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* JUDUL MENU */}
        <div className="section-heading centered">
          <p className="pill-label">MENU PILIHAN</p>
          <h2>Menu Andalan Kami</h2>
          <p>
            Rasakan kelezatan legendaris dari menu terbaik buatan koki ahli
            kami.
          </p>
        </div>

        {/* DAFTAR MENU CUSTOMER */}
        <div className="menu-grid" id="customerMenuGrid">
          {!menusLoaded ? (
            <p>Memuat menu...</p>
          ) : menuError ? (
            <p role="alert">{menuError}</p>
          ) : (
            menuFiltered.map((menu) => (
              <article
                className="menu-card"
                key={menu.id}
                data-category={menu.category.toLowerCase()}
              >
                <div className="menu-photo">
                  <img src={menu.image} alt={menu.name} />
                </div>

                <div className="menu-body">
                  <h3>{menu.name}</h3>

                  {menu.status === "Habis" && (
                    <p
                      style={{
                        color: "red",
                        fontWeight: "bold",
                      }}
                    >
                      Stok habis
                    </p>
                  )}

                  <p>{menu.description}</p>

                  <div className="menu-bottom">
                    <strong>{formatRupiah(menu.price)}</strong>

                    {/* FAVORIT */}
                    <button
                      type="button"
                      className={`favorite-btn ${
                        menu.isFavorited ? "active" : ""
                      }`}
                      aria-label={
                        menu.isFavorited
                          ? `Hapus ${menu.name} dari favorit`
                          : `Tambahkan ${menu.name} ke favorit`
                      }
                      aria-pressed={menu.isFavorited}
                      onClick={() => void toggleFavorite(menu)}
                      disabled={favoriteBusyIds.includes(menu.id)}
                    >
                      <svg
                        className="favorite-icon"
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill={menu.isFavorited ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                      </svg>

                      <span className="favorite-count">
                        {menu.favoriteCount}
                      </span>
                    </button>

                    {/* TAMBAH KE KERANJANG */}
                    <button
                      type="button"
                      className="circle-btn add-to-cart"
                      aria-label={`Tambah ${menu.name} ke keranjang`}
                      onClick={() => addToCart(menu)}
                      disabled={menu.status === "Habis"}
                    >
                      {menu.status === "Habis" ? (
                        <span aria-hidden="true">×</span>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          width="21"
                          height="21"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          aria-hidden="true"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* MENU TIDAK DITEMUKAN */}
        {menusLoaded && !menuError && menuFiltered.length === 0 && (
          <p
            style={{
              textAlign: "center",
              padding: "30px",
            }}
          >
            Menu tidak ditemukan.
          </p>
        )}

        
{/* NOTIFIKASI KERANJANG */}
{cartFeedback && (
  <div className="cart-toast" role="status" aria-live="polite">
    <span className="cart-toast-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="19" height="19" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        strokeLinejoin="round">
        <path d="m5 12 4 4L19 6" />
      </svg>
    </span>

    <span>
      <strong>Berhasil ditambahkan</strong>
      <small>{cartFeedback.name} masuk ke keranjang.</small>
    </span>
  </div>
)}

{/* TOMBOL LIHAT KERANJANG */}
<button
  type="button"
  className="btn btn-primary cart-page-button"
  onClick={() => setIsCartOpen(true)}
>
  Lihat Keranjang ({totalItems})
</button>

{/* DRAWER KERANJANG */}
{isCartOpen && (
  <div className="cart-overlay">
    <button
      type="button"
      className="cart-backdrop"
      onClick={() => setIsCartOpen(false)}
      aria-label="Tutup keranjang"
    />

    <aside
      className="cart-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      {/* HEADER */}
      <div className="cart-drawer-header">
        <div>
          <p className="cart-drawer-eyebrow">PESANAN ANDA</p>
          <h2 id="cart-drawer-title">Keranjang Belanja</h2>
          <p>{totalItems} item dalam keranjang</p>
        </div>

        <button
          type="button"
          className="cart-drawer-close"
          onClick={() => setIsCartOpen(false)}
          aria-label="Tutup keranjang"
        >
          <svg viewBox="0 0 24 24" width="21" height="21"
            fill="none" stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round">
            <path d="m18 6-12 12M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ISI KERANJANG */}
      <div className="cart-drawer-content">
        {!cartLoaded ? (
          <p className="cart-empty">Memuat keranjang...</p>
        ) : cart.length === 0 ? (
          <div className="cart-empty">
            <svg viewBox="0 0 24 24" width="45" height="45"
              fill="none" stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 8H6" />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            <strong>Keranjang masih kosong</strong>
            <p>Silakan pilih menu yang ingin Anda pesan.</p>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
            >
              Kembali memilih menu
            </button>
          </div>
        ) : (
          <div className="cart-item-list">
            {cart.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>{formatRupiah(item.price)} / item</p>
                  <strong>
                    {formatRupiah(item.price * item.quantity)}
                  </strong>
                </div>

                <div className="cart-item-actions">
                  <div className="cart-quantity">
                    <button
                      type="button"
                      onClick={() => decreaseQuantity(item.id)}
                      aria-label={`Kurangi ${item.name}`}
                    >
                      −
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      onClick={() => increaseQuantity(item.id)}
                      aria-label={`Tambah ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER TOTAL DAN CHECKOUT */}
      {cart.length > 0 && (
        <div className="cart-drawer-footer">
          <div className="cart-total-row">
            <span>Total item</span>
            <strong>{totalItems} item</strong>
          </div>

          <div className="cart-total-row cart-grand-total">
            <span>Total harga</span>
            <strong>{formatRupiah(totalHarga)}</strong>
          </div>

          <Link
            href="/checkout"
            className="cart-checkout-button"
          >
            Lanjut ke Checkout
            <svg viewBox="0 0 24 24" width="19" height="19"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>

          <p className="cart-footer-note">
            Periksa kembali pesanan sebelum melanjutkan.
          </p>
        </div>
      )}
    </aside>
  </div>
)}
    </section>
  );
}
