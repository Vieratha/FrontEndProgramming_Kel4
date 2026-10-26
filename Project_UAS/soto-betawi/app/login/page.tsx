"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";

type StoredUser = { id: number; name: string; email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const users = readStorage<StoredUser[]>(STORAGE_KEYS.users, []);
    const user = users.find((item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password);
    if (!user) {
      setMessage("Email atau password salah. Silakan periksa kembali data akun.");
      return;
    }
    writeStorage(STORAGE_KEYS.userLogin, { id: user.id, name: user.name, email: user.email });
    router.push("/");
    router.refresh();
  }

  return (
    <main className="sb-auth-page">
      <section className="sb-auth-card">
        <Link href="/" className="sb-brand sb-auth-brand"><span className="sb-brand-mark" aria-hidden="true">♨</span><span><span className="sb-brand-main">SOTO BETAWI</span><span className="sb-brand-accent">JAKARTA</span></span></Link>
        <p className="sb-pill-label">SELAMAT DATANG KEMBALI</p>
        <h1>Login Pelanggan</h1>
        <p className="sb-auth-intro">Masuk untuk melanjutkan pengalaman kuliner Betawi kamu.</p>
        <form onSubmit={handleSubmit} className="sb-auth-form">
          <label className="sb-cart-field"><span>Email</span><input className="form-control" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" /></label>
          <label className="sb-cart-field"><span>Password</span><input className="form-control" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" /></label>
          {message && <p className="sb-form-error" role="alert">{message}</p>}
          <button type="submit" className="btn sb-btn-primary w-100">Login</button>
        </form>
        <p className="sb-auth-switch">Belum punya akun? <Link href="/register">Daftar sekarang</Link></p>
        <Link href="/" className="sb-back-web">← Kembali ke website</Link>
        <p className="sb-demo-note">Akun pada versi praktikum disimpan secara lokal di browser, bukan di server.</p>
      </section>
    </main>
  );
}
