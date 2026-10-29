
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AdminLayoutProps = {
  children: ReactNode;
};

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
  },
  {
    name: "Menu",
    href: "/admin/menu",
  },
  {
    name: "Pesanan",
    href: "/admin/pesanan",
  },
  {
    name: "Users",
    href: "/admin/users",
  },
  {
    name: "FAQ",
    href: "/admin/faq",
  },
  {
    name: "Lokasi",
    href: "/admin/lokasi",
  },
];

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="admin-layout">

      {/* SIDEBAR KIRI */}
      <aside className="admin-sidebar">

        {/* LOGO ADMIN */}
        <div className="admin-sidebar-brand">
          <h2>Soto Betawi</h2>
          <p>Admin Panel</p>
        </div>

        {/* NAVIGASI ADMIN */}
        <nav className="admin-sidebar-nav">
          {navigation.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href ||
                  pathname.startsWith(
                    item.href + "/"
                  );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "admin-sidebar-link active"
                    : "admin-sidebar-link"
                }
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* PROFIL ADMIN */}
        <div className="admin-sidebar-profile">
          <strong>Admin</strong>
          <span>Administrator</span>

          <Link
            href="/login"
            className="admin-logout"
          >
            Logout
          </Link>
        </div>

      </aside>

      {/* KONTEN HALAMAN ADMIN */}
      <div className="admin-main-area">
        {children}
      </div>

    </div>
  );
}
