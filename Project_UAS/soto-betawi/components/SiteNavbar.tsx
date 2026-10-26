"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Customer = { id: number; name: string; email: string };
type Props = { cartCount?: number; onCartClick?: () => void; user?: Customer | null; onLogout?: () => void };

export default function SiteNavbar({ cartCount = 0, onCartClick, user = null, onLogout }: Props) {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState("home");
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;
    const sectionIds = ["home", "tentang", "menu", "lokasi"];
    const updateActive = () => {
      let current = "home";
      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= 160) current = id;
      }
      setActiveSection(current);
    };
    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    return () => window.removeEventListener("scroll", updateActive);
  }, [pathname]);

  return (
    <header className="sb-header">
      <div className="container sb-navbar">
        <Link href="/" className="sb-brand" aria-label="Soto Betawi Jakarta">
          <span className="sb-brand-mark" aria-hidden="true">♨</span>
          <span><span className="sb-brand-main">SOTO BETAWI</span><span className="sb-brand-accent">JAKARTA</span></span>
        </Link>
        <nav className="sb-main-nav" aria-label="Navigasi utama">
          <Link className={pathname === "/" && activeSection === "home" ? "active" : ""} href="/#home">Home</Link>
          <Link className={(pathname.startsWith("/menu") || (pathname === "/" && activeSection === "menu")) ? "active" : ""} href="/#menu">Menu</Link>
          <Link className={pathname === "/" && activeSection === "tentang" ? "active" : ""} href="/#tentang">Tentang Kami</Link>
          <Link className={pathname === "/" && activeSection === "lokasi" ? "active" : ""} href="/#lokasi">Lokasi</Link>
        </nav>
        <div className="sb-nav-actions">
          <a href="/#menu" className="btn sb-btn-primary sb-btn-small">Pesan Sekarang</a>
          {onCartClick && <button type="button" className="sb-cart-toggle" onClick={onCartClick} aria-label={`Buka keranjang, ${cartCount} item`}><span aria-hidden="true">🛒</span>{cartCount > 0 && <span className="sb-cart-count">{cartCount}</span>}</button>}
          <div className="sb-profile-wrap">
            <button type="button" className="sb-profile-toggle" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label="Buka menu akun">♙</button>
            {profileOpen && <div className="sb-profile-dropdown">
              {user ? <><strong>{user.name}</strong><span className="sb-profile-email">{user.email}</span><button type="button" className="sb-profile-logout" onClick={() => { setProfileOpen(false); onLogout?.(); }}>Logout</button></> : <><strong>Akun pelanggan</strong><Link href="/login">Login</Link><Link href="/register">Daftar akun</Link></>}
              <Link href="/admin/login" className="sb-admin-shortcut">Login admin</Link>
            </div>}
          </div>
        </div>
      </div>
    </header>
  );
}
