"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import PasswordField from "./PasswordField";

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
  // DATA FAVORIT
  const [favorites, setFavorites] = useState<FavoriteMenu[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);

  // DATA PASSWORD
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // STATUS FORM PASSWORD
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

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
        error instanceof Error ? error.message : "Terjadi kesalahan.",
      );
    } finally {
      setRemovingId(null);
    }
  };

  // PROSES GANTI PASSWORD
  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok.");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengganti password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordSuccess(result.message);
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengganti password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <main className="account-page">
      <div className="account-container">
        {/* HEADER HALAMAN */}
        <div className="account-heading">
          <div>
            <p className="account-eyebrow">PUSAT AKUN</p>
            <h1>Akun Saya</h1>
            <p>Kelola informasi akun dan menu favorit Anda.</p>
          </div>

          <Link href="/" className="account-back-link">
            Kembali ke Beranda
          </Link>
        </div>

        {/* INFORMASI PROFIL */}
        <section className="account-profile-card">
          <div className="account-avatar">{initials}</div>

          <div className="account-profile-info">
            <span>Customer</span>
            <h2>{user.name}</h2>
            <p>{user.email}</p>
          </div>

          <div className="account-profile-actions">
            <Link href="/riwayat">Riwayat Pesanan</Link>
          </div>
        </section>

        <div className="account-layout">
          {/* BAGIAN MENU FAVORIT */}
          <section className="account-card">
            <div className="account-card-header">
              <div>
                <p>DAFTAR PILIHAN</p>
                <h2>Menu Favorit</h2>
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
                  width="42"
                  height="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                </svg>

                <strong>Belum ada menu favorit</strong>
                <p>
                  Menu yang Anda tandai sebagai favorit akan muncul di sini.
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
                      width={112}
                      height={100}
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

            {!favoritesLoading && favorites.length > 0 && (
              <Link href="/#menu" className="account-browse-link">
                Lihat semua menu
              </Link>
            )}
          </section>

          {/* BAGIAN KEAMANAN AKUN */}
          <section className="account-card">
            <div className="account-card-header">
              <div>
                <p>KEAMANAN</p>
                <h2>Ganti Password</h2>
              </div>

              <svg
                viewBox="0 0 24 24"
                width="25"
                height="25"
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
            </div>

            <p className="account-password-description">
              Gunakan password yang kuat dan jangan membagikannya kepada orang
              lain.
            </p>

            <form
              className="account-password-form"
              onSubmit={handlePasswordChange}
            >
              <PasswordField
                id="account-current-password"
                label="Password Saat Ini"
                placeholder="Masukkan password saat ini"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
              />

              <PasswordField
                id="account-new-password"
                label="Password Baru"
                placeholder="Minimal 8 karakter"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />

              <PasswordField
                id="account-confirm-password"
                label="Konfirmasi Password Baru"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />

              {passwordError && (
                <p className="account-alert error" role="alert">
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p className="account-alert success" role="status">
                  {passwordSuccess}
                </p>
              )}

              <button
                type="submit"
                className="account-password-submit"
                disabled={passwordLoading}
              >
                {passwordLoading ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          </section>
        </div>

        <div className="account-bottom-links">
          <Link href="/riwayat">Lihat Riwayat Pesanan</Link>
          <Link href="/">Kembali ke Beranda</Link>
        </div>
      </div>
    </main>
  );
}
