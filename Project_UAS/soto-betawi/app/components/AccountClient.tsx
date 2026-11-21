"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// TIPE DATA USER
type AccountUser = {
  name: string;
  email: string;
};

// TIPE DATA MENU FAVORIT
type FavoriteMenu = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  status: string;
  favoritedAt: string;
};

export default function AccountClient({ user }: { user: AccountUser }) {
  const [favorites, setFavorites] = useState<FavoriteMenu[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  // MEMBUAT INISIAL NAMA
  const initials =
    user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "U";

  // FORMAT RUPIAH
  const formatRupiah = (price: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(price);

  // MENGAMBIL FAVORIT DARI DATABASE
  useEffect(() => {
    const controller = new AbortController();

    const loadFavorites = async () => {
      try {
        const response = await fetch("/api/favorites", {
          cache: "no-store",
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil daftar favorit.");
        }

        if (!controller.signal.aborted) {
          setFavorites(Array.isArray(result.favorites) ? result.favorites : []);
          setFavoritesError("");
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setFavoritesError(
            error instanceof Error
              ? error.message
              : "Gagal mengambil menu favorit.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setFavoritesLoading(false);
        }
      }
    };

    loadFavorites();

    return () => controller.abort();
  }, []);

  // MENGHAPUS MENU DARI FAVORIT
  const removeFavorite = async (menuId: number) => {
    if (removingId !== null) return;

    setRemovingId(menuId);
    setFavoritesError("");

    try {
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ menuId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus menu favorit.");
      }

      setFavorites((previous) => previous.filter((menu) => menu.id !== menuId));
    } catch (error) {
      setFavoritesError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus favorit.",
      );
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <main className="account-page">
      <div className="account-container">
        {/* HEADER HALAMAN */}
        <header className="account-heading">
          <div>
            <p className="account-eyebrow">PUSAT AKUN</p>
            <h1>Akun Saya</h1>
            <p>Kelola akun dan menu pilihan Anda.</p>
          </div>

          <Link href="/" className="account-back-link">
            Kembali ke Beranda
          </Link>
        </header>

        {/* INFORMASI PROFIL */}
        <section className="account-profile-card">
          <div className="account-avatar">{initials}</div>

          <div className="account-profile-info">
            <span>Customer</span>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>
        </section>

        {/* NAVIGASI PENGATURAN AKUN */}
        <section className="account-shortcuts-section">
          <div className="account-section-heading">
            <div>
              <p>PENGELOLAAN AKUN</p>
              <h2>Pengaturan Akun</h2>
            </div>
          </div>

          <div className="account-shortcuts">
            {/* KEAMANAN AKUN */}
            <Link href="/akun/keamanan" className="account-shortcut-card">
              <span className="account-shortcut-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="23"
                  height="23"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  <path d="M12 14v3" />
                </svg>
              </span>

              <span className="account-shortcut-info">
                <strong>Keamanan Akun</strong>
                <small>Ganti password dan jaga keamanan akun.</small>
              </span>

              <svg
                className="account-shortcut-arrow"
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>

            {/* RIWAYAT PESANAN */}
            <Link href="/riwayat" className="account-shortcut-card">
              <span className="account-shortcut-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="23"
                  height="23"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 3h8l4 4v14H4V3h4Z" />
                  <path d="M8 3v5h8V3M8 13h8M8 17h8" />
                </svg>
              </span>

              <span className="account-shortcut-info">
                <strong>Riwayat Pesanan</strong>
                <small>Lihat pesanan dan status transaksi Anda.</small>
              </span>

              <svg
                className="account-shortcut-arrow"
                viewBox="0 0 24 24"
                width="19"
                height="19"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </section>

        {/* MENU FAVORIT */}
        <section className="account-card account-favorites-card">
          <div className="account-card-header">
            <div>
              <p>DAFTAR PILIHAN</p>
              <h2>Menu Favorit</h2>
              <span className="account-favorite-subtitle">
                Menu yang Anda simpan untuk dipesan kembali.
              </span>
            </div>

            <span className="account-favorite-total">
              {favorites.length} menu
            </span>
          </div>

          {favoritesLoading ? (
            <p className="account-message">Memuat menu favorit...</p>
          ) : favoritesError ? (
            <p className="account-alert error" role="alert">
              {favoritesError}
            </p>
          ) : favorites.length === 0 ? (
            <div className="account-empty">
              <svg
                viewBox="0 0 24 24"
                width="44"
                height="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
              </svg>

              <strong>Belum ada menu favorit</strong>

              <p>
                Tandai menu yang Anda sukai agar lebih mudah ditemukan kembali.
              </p>

              <Link href="/#menu">Jelajahi Menu</Link>
            </div>
          ) : (
            <div className="account-favorite-list">
              {favorites.map((menu) => (
                <article className="account-favorite-item" key={menu.id}>
                  <Image
                    src={menu.image}
                    alt={menu.name}
                    width={120}
                    height={105}
                    unoptimized
                    className="account-favorite-image"
                  />

                  <div className="account-favorite-info">
                    <span>{menu.category}</span>
                    <h3>{menu.name}</h3>
                    <p>{menu.description}</p>
                    <strong>{formatRupiah(menu.price)}</strong>

                    {menu.status === "Habis" && (
                      <small className="account-menu-unavailable">
                        Saat ini tidak tersedia
                      </small>
                    )}
                  </div>

                  <button
                    type="button"
                    className="account-remove-favorite"
                    onClick={() => removeFavorite(menu.id)}
                    disabled={removingId !== null}
                  >
                    {removingId === menu.id ? "Menghapus..." : "Hapus"}
                  </button>
                </article>
              ))}
            </div>
          )}

          {!favoritesLoading && !favoritesError && favorites.length > 0 && (
            <Link href="/#menu" className="account-browse-link">
              Lihat semua menu
            </Link>
          )}
        </section>
      </div>
    </main>
  );
}
