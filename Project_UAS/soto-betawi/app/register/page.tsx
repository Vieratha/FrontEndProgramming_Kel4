"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordField from "../components/PasswordField";

export default function RegisterPage() {
  const router = useRouter();

  // Data formulir pendaftaran.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Validasi dan proses pendaftaran.
  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    const passwordBytes = new TextEncoder().encode(password).length;

    if (passwordBytes > 72) {
      setError("Password maksimal 72 byte (UTF-8).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setLoading(true);

    try {
      // Kirim data pendaftaran ke API.
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Registrasi gagal.");
      }

      setSuccess("Registrasi berhasil! Mengalihkan...");

      // Arahkan user ke beranda setelah registrasi berhasil.
      router.replace("/");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat registrasi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Buat Akun Baru</h1>

          <p>
            Daftar sebagai customer Soto Betawi Jakarta dan nikmati kemudahan
            pemesanan.
          </p>
        </div>

        {/* Form pendaftaran */}
        <form className="auth-form" onSubmit={handleRegister} noValidate>
          <div className="form-group">
            <label htmlFor="name">Nama Lengkap</label>

            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Masukkan nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <PasswordField
            id="password"
            label="Password"
            placeholder="Buat password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />

          <small>
            Password minimal 8 karakter dan maksimal 72 byte (UTF-8).
          </small>

          <PasswordField
            id="confirmPassword"
            label="Konfirmasi Password"
            placeholder="Ulangi password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          {/* Pesan hasil pendaftaran */}
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
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        {/* Navigasi akun */}
        <p className="auth-footer">
          Sudah punya akun? <Link href="/login">Masuk Sekarang</Link>
        </p>

        <Link href="/" className="back-home">
          ← Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
