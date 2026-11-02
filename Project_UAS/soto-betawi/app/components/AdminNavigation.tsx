"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/admin" },
  { name: "Menu", href: "/admin/menu" },
  { name: "Pesanan", href: "/admin/pesanan" },
  { name: "Users", href: "/admin/users" },
  { name: "FAQ", href: "/admin/faq" },
  { name: "Lokasi", href: "/admin/lokasi" },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="admin-sidebar-nav">
      {navigation.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active ? "admin-sidebar-link active" : "admin-sidebar-link"
            }
            aria-current={active ? "page" : undefined}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
