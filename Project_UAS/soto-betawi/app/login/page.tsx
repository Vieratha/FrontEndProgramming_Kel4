"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordField from "../components/PasswordField";

export default function LoginPage() {
  const router = useRouter();

  // Data formulir login.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Validasi dan proses login.
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    // Periksa format email sebelum mengirim permintaan.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);

    try {
      // Kirim data login ke API.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login gagal.");
      }

      setSuccess("Login berhasil!");

      // Arahkan user sesuai role akun.
      const destination = result.user.role === "ADMIN" ? "/admin" : "/";

      router.replace(destination);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat login.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        \
        <div className="auth-header">
          <h1>Masuk ke Akun</h1>

          <p>
            Masuk ke akun Soto Betawi Jakarta untuk melanjutkan pemesanan atau
            mengelola restoran.
          </p>
        </div>
        {/* Form login */}
        <form className="auth-form" onSubmit={handleLogin} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              type="email"
              id="email"
              name="email"
              autoComplete="username"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <PasswordField
            id="password"
            label="Password"
            placeholder="Masukkan password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          {/* Pesan hasil login */}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="auth-success" role="status">
              {success}
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
        {/* Navigasi akun */}
        <p className="auth-footer">
          Belum punya akun? <Link href="/register">Daftar Sekarang</Link>
        </p>
        <Link href="/" className="back-home">
          ← Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
