"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordField from "../components/PasswordField";

export default function RegisterPage() {
  const router = useRouter();

  // INI BAGIAN DATA REGISTER
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // INI BAGIAN STATUS FORM
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // INI BAGIAN PROSES REGISTER
  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // INI BAGIAN VALIDASI NAMA
    if (!name.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    // INI BAGIAN VALIDASI EMAIL
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    // INI BAGIAN VALIDASI PASSWORD
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    // INI BAGIAN VALIDASI KONFIRMASI PASSWORD
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setLoading(true);

    try {
      // INI BAGIAN MENGIRIM DATA REGISTER KE API
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

      // INI BAGIAN MENGARAHKAN USER KE BERANDA
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
        {/* INI BAGIAN HEADER REGISTER */}
        <div className="auth-header">
          <h1>Buat Akun Baru</h1>

          <p>
            Daftar sebagai customer Soto Betawi Jakarta dan nikmati kemudahan
            pemesanan.
          </p>
        </div>

        {/* INI BAGIAN FORM REGISTER */}
        <form className="auth-form" onSubmit={handleRegister} noValidate>
          {/* INI BAGIAN INPUT NAMA */}
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

          {/* INI BAGIAN INPUT EMAIL */}
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

          {/* INI BAGIAN INPUT PASSWORD */}
          <PasswordField
            id="password"
            label="Password"
            placeholder="Buat password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />

          {/* INI BAGIAN KONFIRMASI PASSWORD */}
          <PasswordField
            id="confirmPassword"
            label="Konfirmasi Password"
            placeholder="Ulangi password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          {/* INI BAGIAN PESAN ERROR */}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {/* INI BAGIAN PESAN BERHASIL */}
          {success && (
            <p className="auth-success" role="status">
              {success}
            </p>
          )}

          {/* INI BAGIAN TOMBOL REGISTER */}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        {/* INI BAGIAN LINK LOGIN */}
        <p className="auth-footer">
          Sudah punya akun? <Link href="/login">Masuk Sekarang</Link>
        </p>

        {/* INI BAGIAN KEMBALI KE BERANDA */}
        <Link href="/" className="back-home">
          ← Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
