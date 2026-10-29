
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getMenus,
  type Menu,
} from "../lib/menuStorage";

type CartItem = Menu & {
  quantity: number;
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
  // DATA MENU DARI ADMIN
  const [menus, setMenus] = useState<Menu[]>([]);

  // SEARCH DAN FILTER
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // FAVORIT
  const [favorites, setFavorites] = useState<number[]>([]);

  // KERANJANG
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [menusLoaded, setMenusLoaded] = useState(false);

  // MENGAMBIL DATA MENU DARI LOCAL STORAGE
  useEffect(() => {
    const updateMenus = () => {
      setMenus(getMenus());
      setMenusLoaded(true);
    };

    updateMenus();

    // Update ketika admin mengubah menu
    window.addEventListener("menu-updated", updateMenus);

    // Update jika perubahan terjadi di tab lain
    window.addEventListener("storage", updateMenus);

    return () => {
      window.removeEventListener(
        "menu-updated",
        updateMenus
      );

      window.removeEventListener(
        "storage",
        updateMenus
      );
    };
  }, []);

  // MEMBACA KERANJANG DARI LOCAL STORAGE
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(
        "soto-betawi-cart"
      );

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

  
// MENYESUAIKAN KERANJANG DENGAN MENU TERBARU
useEffect(() => {
  if (!cartLoaded || !menusLoaded) return;

  setCart((prevCart) => {
    const updatedCart = prevCart.flatMap((item) => {
      const currentMenu = menus.find(
        (menu) => menu.id === item.id
      );

      // Menu yang dihapus admin tidak lagi tersedia
      if (!currentMenu) {
        return [];
      }

      return [{
        ...currentMenu,
        quantity: item.quantity,
      }];
    });

    // Hindari pembaruan state jika tidak ada perubahan
    if (JSON.stringify(prevCart) === JSON.stringify(updatedCart)) {
      return prevCart;
    }

    return updatedCart;
  });
}, [menus, cartLoaded, menusLoaded]);


  
// MENYIMPAN KERANJANG SETELAH MENU SIAP
useEffect(() => {
  if (!cartLoaded || !menusLoaded) return;

  try {
    localStorage.setItem(
      "soto-betawi-cart",
      JSON.stringify(cart)
    );
  } catch (error) {
    console.error(
      "Gagal menyimpan keranjang:",
      error
    );
  }
}, [cart, cartLoaded, menusLoaded]);


  // FAVORIT
  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  // TAMBAH MENU KE KERANJANG
  const addToCart = (menu: Menu) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === menu.id
      );

      if (existing) {
        return prev.map((item) =>
          item.id === menu.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...menu,
          quantity: 1,
        },
      ];
    });
  };

  // TAMBAH JUMLAH
  const increaseQuantity = (id: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
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
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // HAPUS MENU DARI KERANJANG
  const removeFromCart = (id: number) => {
    setCart((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  // TOTAL ITEM KERANJANG
  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // MENGIRIM JUMLAH ITEM KE HOMECLIENT
  useEffect(() => {
    onCartCountChange(totalItems);
  }, [totalItems, onCartCountChange]);

  // TOTAL HARGA
  const totalHarga = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  // FORMAT RUPIAH
  const formatRupiah = (harga: number) => {
    return `Rp ${harga.toLocaleString("id-ID")}`;
  };

  // FILTER MENU DARI DATA ADMIN
  const menuFiltered = menus.filter((menu) => {
    const cocokNama = menu.name
      .toLowerCase()
      .includes(search.toLowerCase().trim());

    const cocokKategori =
      filter === "all" ||
      menu.category.toLowerCase() === filter;

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
                  filter === item.value
                    ? "filter-btn active"
                    : "filter-btn"
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
            Rasakan kelezatan legendaris dari menu terbaik
            buatan koki ahli kami.
          </p>
        </div>

        {/* DAFTAR MENU CUSTOMER */}
        <div
          className="menu-grid"
          id="customerMenuGrid"
        >
          {menuFiltered.map((menu) => (
            <article
              className="menu-card"
              key={menu.id}
              data-category={menu.category.toLowerCase()}
            >
              <div className="menu-photo">
                <img
                  src={menu.image}
                  alt={menu.name}
                />
              </div>

              <div className="menu-body">
                <h3>{menu.name}</h3>
                <p>{menu.description}</p>

                <div className="menu-bottom">
                  <strong>
                    {formatRupiah(menu.price)}
                  </strong>

                  {/* FAVORIT */}
                  <button
                    type="button"
                    className="favorite-btn"
                    aria-label={`Favorit ${menu.name}`}
                    aria-pressed={favorites.includes(menu.id)}
                    onClick={() =>
                      toggleFavorite(menu.id)
                    }
                  >
                    <span className="favorite-icon">
                      {favorites.includes(menu.id)
                        ? "♥"
                        : "♡"}
                    </span>

                    <span className="favorite-count">
                      {favorites.includes(menu.id)
                        ? 1
                        : 0}
                    </span>
                  </button>

                  {/* TAMBAH KE KERANJANG */}
                  <button
                    type="button"
                    className="circle-btn add-to-cart"
                    aria-label={`Tambah ${menu.name} ke keranjang`}
                    onClick={() => addToCart(menu)}
                  >
                    +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* MENU TIDAK DITEMUKAN */}
        {menuFiltered.length === 0 && (
          <p
            style={{
              textAlign: "center",
              padding: "30px",
            }}
          >
            Menu tidak ditemukan.
          </p>
        )}

        {/* TOMBOL LIHAT KERANJANG */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCartOpen(true)}
          style={{ marginTop: "25px" }}
        >
          🛒 Lihat Keranjang ({totalItems})
        </button>

        {/* PANEL KERANJANG */}
        {isCartOpen && (
          <div
            id="keranjang"
            className="cart-summary"
            style={{
              marginTop: "30px",
              padding: "24px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              backgroundColor: "#fff",
            }}
          >
            {/* TUTUP KERANJANG */}
            <button
              type="button"
              className="cart-close"
              onClick={() =>
                setIsCartOpen(false)
              }
              aria-label="Tutup keranjang"
            >
              ✕
            </button>

            <h3>🛒 Keranjang Belanja</h3>

            {cart.length === 0 ? (
              <p style={{ marginTop: "20px" }}>
                Keranjang masih kosong.
              </p>
            ) : (
              <>
                {/* DAFTAR ITEM KERANJANG */}
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                      padding: "15px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <div>
                      <h4>{item.name}</h4>
                      <p>
                        {formatRupiah(item.price)}
                      </p>
                    </div>

                    {/* KONTROL JUMLAH */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          decreaseQuantity(item.id)
                        }
                        aria-label={`Kurangi ${item.name}`}
                      >
                        −
                      </button>

                      <strong>
                        {item.quantity}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          increaseQuantity(item.id)
                        }
                        aria-label={`Tambah ${item.name}`}
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.id)
                        }
                        aria-label={`Hapus ${item.name}`}
                        style={{ color: "red" }}
                      >
                        Hapus
                      </button>
                    </div>

                    <strong>
                      {formatRupiah(
                        item.price * item.quantity
                      )}
                    </strong>
                  </div>
                ))}

                {/* TOTAL PESANAN */}
                <div style={{ marginTop: "20px" }}>
                  <p>
                    Total Item: {totalItems}
                  </p>

                  <h3>
                    Total Harga:{" "}
                    {formatRupiah(totalHarga)}
                  </h3>
                </div>

                {/* LANJUT KE CHECKOUT */}
                <Link
                  href="/checkout"
                  className="btn btn-primary"
                  style={{
                    display: "inline-block",
                    marginTop: "20px",
                    textDecoration: "none",
                  }}
                >
                  Lanjut ke Checkout
                </Link>
              </>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
