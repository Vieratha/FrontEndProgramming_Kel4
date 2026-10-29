
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      setError("Masukkan alamat email yang valid.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setSuccess(
      "Form login berhasil divalidasi! Autentikasi akun belum tersedia."
    );
  };

  return (
    <main className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <h1>Login Customer</h1>
          <p>
            Masuk ke akun Soto Betawi Jakarta
            untuk melanjutkan pemesanan.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleLogin}
          noValidate
        >
          {/* INPUT EMAIL */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* INPUT PASSWORD */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* PESAN ERROR */}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {/* PESAN BERHASIL */}
          {success && (
            <p className="auth-success" role="status">
              {success}
            </p>
          )}

          {/* TOMBOL LOGIN */}
          <button
            type="submit"
            className="btn btn-primary"
          >
            Masuk
          </button>
        </form>

        <p className="auth-footer">
          Belum punya akun?{" "}
          <Link href="/register">
            Daftar Sekarang
          </Link>
        </p>

        <Link href="/" className="back-home">
          ← Kembali ke Beranda
        </Link>

      </div>
    </main>
  );
}
