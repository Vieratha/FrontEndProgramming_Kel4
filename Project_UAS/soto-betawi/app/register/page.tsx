"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";

type StoredUser = { id: number; name: string; email: string; password: string };

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Konfirmasi password tidak sesuai.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password minimal terdiri dari 6 karakter.");
      return;
    }
    const users = readStorage<StoredUser[]>(STORAGE_KEYS.users, []);
    if (users.some((user) => user.email.toLowerCase() === email.trim().toLowerCase())) {
      setMessage("Email sudah terdaftar. Silakan login.");
      return;
    }
    const newUser: StoredUser = { id: Date.now(), name: name.trim(), email: email.trim(), password };
    writeStorage(STORAGE_KEYS.users, [...users, newUser]);
    router.push("/login");
  }

  return (
    <main className="sb-auth-page">
      <section className="sb-auth-card">
        <Link href="/" className="sb-brand sb-auth-brand"><span className="sb-brand-mark" aria-hidden="true">♨</span><span><span className="sb-brand-main">SOTO BETAWI</span><span className="sb-brand-accent">JAKARTA</span></span></Link>
        <p className="sb-pill-label">BERGABUNG DENGAN KAMI</p>
        <h1>Buat Akun</h1>
        <p className="sb-auth-intro">Isi informasi di bawah untuk membuat akun pelanggan.</p>
        <form onSubmit={handleSubmit} className="sb-auth-form">
          <label className="sb-cart-field"><span>Nama Lengkap</span><input className="form-control" required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Nama Anda" /></label>
          <label className="sb-cart-field"><span>Email</span><input className="form-control" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="nama@email.com" /></label>
          <label className="sb-cart-field"><span>Password</span><input className="form-control" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="Minimal 6 karakter" /></label>
          <label className="sb-cart-field"><span>Konfirmasi Password</span><input className="form-control" type="password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Ulangi password" /></label>
          {message && <p className="sb-form-error" role="alert">{message}</p>}
          <button type="submit" className="btn sb-btn-primary w-100">Daftar</button>
        </form>
        <p className="sb-auth-switch">Sudah punya akun? <Link href="/login">Login</Link></p>
        <Link href="/" className="sb-back-web">← Kembali ke website</Link>
        <p className="sb-demo-note">Demo akademik: akun disimpan di localStorage. Jangan gunakan password asli.</p>
      </section>
    </main>
  );
}
