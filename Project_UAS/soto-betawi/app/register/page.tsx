
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = (e: FormEvent<HTMLFormElement>) => {
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

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setSuccess(
      "Form berhasil divalidasi! Akun belum dibuat."
    );
  };

  return (
    <main className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <h1>Buat Akun Baru</h1>
          <p>
            Daftar sebagai customer Soto Betawi Jakarta
            dan nikmati kemudahan pemesanan.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleRegister}
          noValidate
        >
          {/* NAMA */}
          <div className="form-group">
            <label htmlFor="name">Nama Lengkap</label>
            <input
              type="text"
              id="name"
              placeholder="Masukkan nama lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* EMAIL */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Buat password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* KONFIRMASI PASSWORD */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Konfirmasi Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Ulangi password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              required
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

          {/* TOMBOL REGISTER */}
          <button
            type="submit"
            className="btn btn-primary"
          >
            Daftar
          </button>
        </form>

        <p className="auth-footer">
          Sudah punya akun?{" "}
          <Link href="/login">Masuk Sekarang</Link>
        </p>

        <Link href="/" className="back-home">
          ← Kembali ke Beranda
        </Link>

      </div>
    </main>
  );
}
