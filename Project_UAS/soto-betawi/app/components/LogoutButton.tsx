"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout gagal.");
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
      alert("Gagal logout. Silakan coba kembali.");
    }
  };

  return (
    <button
      type="button"
      className="admin-logout"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "Keluar..." : "Logout"}
    </button>
  );
}
