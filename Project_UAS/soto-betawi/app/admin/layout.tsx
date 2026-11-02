import AdminNavigation from "@/app/components/AdminNavigation";
import type { ReactNode } from "react";
import { requireAdmin } from "@/app/lib/auth";
import LogoutButton from "@/app/components/LogoutButton";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await requireAdmin();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <h2>Soto Betawi</h2>
          <p>Admin Panel</p>
        </div>

        <AdminNavigation />

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
