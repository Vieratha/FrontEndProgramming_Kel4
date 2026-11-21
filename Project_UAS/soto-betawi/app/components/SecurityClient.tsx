"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import PasswordField from "./PasswordField";

type SecurityUser = {
  name: string;
};

export default function SecurityClient({ user }: { user: SecurityUser }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // PROSES GANTI PASSWORD
  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Masukkan password saat ini.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("Password baru terlalu panjang.");
      return;
    }

    setLoading(true);

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

      setSuccess(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengganti password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="security-page">
      <div className="security-container">
        {/* NAVIGASI KEMBALI */}
        <Link href="/akun" className="security-back-link">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Kembali ke Akun Saya
        </Link>

        {/* HEADER */}
        <header className="security-heading">
          <span className="security-heading-icon">
            <svg
              viewBox="0 0 24 24"
              width="29"
              height="29"
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

          <div>
            <p>KEAMANAN AKUN</p>
            <h1>Ganti Password</h1>
            <span>Perbarui password untuk menjaga keamanan akun Anda.</span>
          </div>
        </header>

        {/* INFORMASI AKUN */}
        <section className="security-account-info">
          <div className="security-account-avatar">
            {user.name.trim().charAt(0).toUpperCase() || "U"}
          </div>

          <div>
            <strong>{user.name}</strong>
            <span>Akun Customer</span>
          </div>
        </section>

        {/* FORM PASSWORD */}
        <section className="security-card">
          <div className="security-card-heading">
            <h2>Perbarui Password</h2>
            <p>Masukkan password saat ini, kemudian tentukan password baru.</p>
          </div>

          <form className="security-form" onSubmit={handlePasswordChange}>
            <PasswordField
              id="security-current-password"
              label="Password Saat Ini"
              placeholder="Masukkan password saat ini"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />

            <div className="security-form-divider" />

            <PasswordField
              id="security-new-password"
              label="Password Baru"
              placeholder="Minimal 8 karakter"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />

            <PasswordField
              id="security-confirm-password"
              label="Konfirmasi Password Baru"
              placeholder="Masukkan kembali password baru"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />

            <div className="security-password-note">
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
                <circle cx="12" cy="12" r="9" />
                <path d="M12 11v5M12 8h.01" />
              </svg>

              <span>
                Gunakan minimal 8 karakter. Sebaiknya kombinasikan huruf besar,
                huruf kecil, angka, dan simbol.
              </span>
            </div>

            {error && (
              <p className="account-alert error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="account-alert success" role="status">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="security-submit"
              disabled={loading}
            >
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
