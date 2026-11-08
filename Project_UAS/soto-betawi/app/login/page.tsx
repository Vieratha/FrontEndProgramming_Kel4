"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordField from "../components/PasswordField";

export default function LoginPage() {
  const router = useRouter();

  // INI BAGIAN DATA LOGIN
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // INI BAGIAN STATUS FORM
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // INI BAGIAN PROSES LOGIN
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    // INI BAGIAN VALIDASI EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    // INI BAGIAN VALIDASI PASSWORD
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);

    try {
      // INI BAGIAN MENGIRIM DATA LOGIN KE API
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

      // INI BAGIAN MENGARAHKAN USER BERDASARKAN ROLE
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
        {/* INI BAGIAN HEADER LOGIN */}
        <div className="auth-header">
          <h1>Masuk ke Akun</h1>

          <p>
            Masuk ke akun Soto Betawi Jakarta untuk melanjutkan pemesanan atau
            mengelola restoran.
          </p>
        </div>

        {/* INI BAGIAN FORM LOGIN */}
        <form className="auth-form" onSubmit={handleLogin} noValidate>
          {/* INI BAGIAN INPUT EMAIL */}
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

          {/* INI BAGIAN INPUT PASSWORD */}
          <PasswordField
            id="password"
            label="Password"
            placeholder="Masukkan password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
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

          {/* INI BAGIAN TOMBOL LOGIN */}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        {/* INI BAGIAN LINK REGISTER */}
        <p className="auth-footer">
          Belum punya akun? <Link href="/register">Daftar Sekarang</Link>
        </p>

        {/* INI BAGIAN KEMBALI KE BERANDA */}
        <Link href="/" className="back-home">
          ← Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
