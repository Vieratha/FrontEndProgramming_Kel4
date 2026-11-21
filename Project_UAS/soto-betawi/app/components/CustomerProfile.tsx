"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// INI BAGIAN TIPE DATA USER
type ProfileUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

// INI BAGIAN PROPS CUSTOMER PROFILE
type CustomerProfileProps = {
  user: ProfileUser | null;
};

export default function CustomerProfile({ user }: CustomerProfileProps) {
  const router = useRouter();

  const profileRef = useRef<HTMLDivElement>(null);

  // INI BAGIAN STATUS DROPDOWN PROFILE
  const [isOpen, setIsOpen] = useState(false);

  // INI BAGIAN STATUS LOGOUT
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // INI BAGIAN MEMBUAT INISIAL NAMA USER
  const initials =
    user?.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "U";

  // INI BAGIAN MEMERIKSA ROLE USER
  const isAdmin = user?.role === "ADMIN";

  // INI BAGIAN MENUTUP DROPDOWN KETIKA KLIK DI LUAR
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // INI BAGIAN PROSES LOGOUT
  const handleLogout = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Logout gagal.");
      }

      setIsOpen(false);

      // Arahkan kembali ke beranda setelah session dihapus.
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat logout.",
      );

      setLoading(false);
    }
  };

  // INI BAGIAN TAMPILAN GUEST
  if (!user) {
    return (
      <div className="customer-profile">
        <div className="customer-auth-actions">
          <Link href="/login" className="customer-login-link">
            Masuk
          </Link>

          <Link href="/register" className="customer-register-link">
            Daftar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-profile" ref={profileRef}>
      {/* INI BAGIAN TOMBOL PROFILE */}
      <button
        type="button"
        className="customer-profile-trigger"
        onClick={() => {
          setIsOpen((previous) => !previous);
          setError("");
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Buka menu profil"
      >
        <span className="customer-profile-avatar">{initials}</span>

        <span className="customer-profile-summary">
          <strong>{user.name}</strong>
          <small>{isAdmin ? "Administrator" : "Customer"}</small>
        </span>

        <span className={`customer-profile-chevron ${isOpen ? "opened" : ""}`}>
          ▾
        </span>
      </button>

      {/* INI BAGIAN DROPDOWN PROFILE */}
      {isOpen && (
        <div className="customer-profile-dropdown">
          <div className="customer-profile-info">
            <strong>{user.name}</strong>
            <span>{user.email}</span>

            <small>{isAdmin ? "Administrator" : "Customer"}</small>
          </div>

          {/* NAVIGASI BERDASARKAN ROLE */}
          {isAdmin ? (
            <Link
              href="/admin"
              className="customer-profile-menu"
              onClick={() => setIsOpen(false)}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="8" height="8" rx="1" />
                <rect x="13" y="3" width="8" height="8" rx="1" />
                <rect x="3" y="13" width="8" height="8" rx="1" />
                <rect x="13" y="13" width="8" height="8" rx="1" />
              </svg>
              Dashboard Admin
            </Link>
          ) : (
            <>
              <Link
                href="/akun"
                className="customer-profile-menu"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
                Akun Saya
              </Link>

              <Link
                href="/riwayat"
                className="customer-profile-menu"
                onClick={() => setIsOpen(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
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
                Riwayat Pesanan
              </Link>
            </>
          )}

          {/* INI BAGIAN TOMBOL LOGOUT */}
          <button
            type="button"
            className="customer-profile-logout"
            onClick={handleLogout}
            disabled={loading}
          >
            <span>↪</span>
            {loading ? "Keluar..." : "Logout"}
          </button>

          {/* INI BAGIAN PESAN ERROR LOGOUT */}
          {error && (
            <p className="customer-profile-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
