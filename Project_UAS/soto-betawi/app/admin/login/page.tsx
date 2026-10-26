"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/storage";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Kredensial ini hanya untuk demonstrasi praktikum, bukan autentikasi produksi.
    if (username === "admin123" && password === "admin123") {
      window.localStorage.setItem(STORAGE_KEYS.adminLogin, "true");
      router.push("/admin");
    } else {
      setMessage("Username atau password salah.");
    }
  }

  return (
    <main className="sb-auth-page">
      <section className="sb-auth-card">
        <Link href="/" className="sb-brand sb-auth-brand"><span className="sb-brand-mark" aria-hidden="true">♨</span><span><span className="sb-brand-main">SOTO BETAWI</span><span className="sb-brand-accent">ADMIN PANEL</span></span></Link>
        <p className="sb-pill-label">AREA ADMINISTRATOR</p>
        <h1>Login Admin</h1>
        <p className="sb-auth-intro">Masuk untuk melihat pesanan dan mengelola menu.</p>
        <form onSubmit={handleSubmit} className="sb-auth-form">
          <label className="sb-cart-field"><span>Username</span><input className="form-control" required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username admin" /></label>
          <label className="sb-cart-field"><span>Password</span><input className="form-control" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password admin" /></label>
          {message && <p className="sb-form-error" role="alert">{message}</p>}
          <button type="submit" className="btn sb-btn-primary w-100">Login</button>
        </form>
        <p className="sb-demo-note">Akun demo: <code>admin123</code> / <code>admin123</code></p>
        <Link href="/" className="sb-back-web">← Kembali ke website</Link>
      </section>
    </main>
  );
}
