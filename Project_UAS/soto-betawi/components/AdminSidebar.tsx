"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { STORAGE_KEYS } from "@/lib/storage";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const links = [{ href: "/admin", label: "Dashboard" }, { href: "/admin/menu", label: "Kelola Menu" }];
  return (
    <aside className="sb-admin-sidebar">
      <Link href="/admin" className="sb-admin-brand"><span className="sb-brand-mark" aria-hidden="true">♨</span><span><strong>Soto Betawi</strong><small>Admin Panel</small></span></Link>
      <nav className="sb-admin-nav" aria-label="Navigasi admin">{links.map((link) => <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""}>{link.label}</Link>)}</nav>
      <div className="sb-admin-profile"><strong>Administrator</strong><span>Kelola restoran</span><button type="button" onClick={() => { window.localStorage.removeItem(STORAGE_KEYS.adminLogin); router.push("/admin/login"); }}>Logout</button><Link href="/">Lihat Website ↗</Link></div>
    </aside>
  );
}
