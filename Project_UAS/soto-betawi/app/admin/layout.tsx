import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/app/lib/auth";
import LogoutButton from "@/app/components/LogoutButton";

type AdminLayoutProps = {
  children: ReactNode;
};

const navigation = [
  { name: "Dashboard", href: "/admin" },
  { name: "Menu", href: "/admin/menu" },
  { name: "Pesanan", href: "/admin/pesanan" },
  { name: "Users", href: "/admin/users" },
  { name: "FAQ", href: "/admin/faq" },
  { name: "Lokasi", href: "/admin/lokasi" },
];

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await requireAdmin();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h2>Soto Betawi</h2>
          <p>Admin Panel</p>
        </div>

        <nav className="admin-sidebar-nav">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="admin-sidebar-link"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-profile">
          <strong>{user.name}</strong>
          <span>Administrator</span>
          <LogoutButton />
        </div>
      </aside>

      <div className="admin-main-area">{children}</div>
    </div>
  );
}
