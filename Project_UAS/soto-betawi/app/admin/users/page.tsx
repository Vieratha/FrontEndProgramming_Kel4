"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type UserRole = "ADMIN" | "CUSTOMER";

type UserItem = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  _count?: {
    orders: number;
  };
};

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "CUSTOMER",
};

function formatTanggal(tanggal: string) {
  return new Date(tanggal).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("Semua");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  // MEMBACA DATA USER DARI DATABASE
  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data pengguna.");
      }

      const userList = Array.isArray(data)
        ? data
        : Array.isArray(data.users)
          ? data.users
          : null;

      if (!userList) {
        throw new Error("Format data pengguna dari server tidak valid.");
      }

      setUsers(userList);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil data pengguna.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // MENUTUP SCROLL HALAMAN SAAT MODAL TERBUKA
  useEffect(() => {
    if (!isModalOpen) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isModalOpen, saving]);

  // PENCARIAN DAN FILTER ROLE
  const filteredUsers = users.filter((user) => {
    const keyword = search.toLowerCase().trim();
    const matchSearch =
      user.name.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword);

    const matchRole = filterRole === "Semua" || user.role === filterRole;

    return matchSearch && matchRole;
  });

  // RINGKASAN STATISTIK PENGGUNA
  const totalUsers = users.length;
  const totalAdmins = users.filter((user) => user.role === "ADMIN").length;
  const totalCustomers = users.filter(
    (user) => user.role === "CUSTOMER",
  ).length;

  // REFRESH DATA
  const handleRefresh = () => {
    setError("");
    setSuccess("");
    void fetchUsers();
  };

  // MEMBUKA MODAL TAMBAH
  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalError("");
    setSuccess("");
    setError("");
    setIsModalOpen(true);
  };

  // MEMBUKA MODAL EDIT
  const openEditModal = (user: UserItem) => {
    setEditingId(user.id);

    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });

    setModalError("");
    setSuccess("");
    setError("");
    setIsModalOpen(true);
  };

  // MENUTUP MODAL
  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingId(null);
    setModalError("");
  };

  // MEMPERBARUI INPUT FORM
  const updateForm = <K extends keyof UserForm>(
    field: K,
    value: UserForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // SIMPAN USER BARU ATAU PERUBAHAN KE DATABASE
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError("");

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;
    const isEditing = editingId !== null;

    if (!name || !email) {
      setModalError("Nama dan email wajib diisi.");
      return;
    }

    if (!isEditing && password.length < 8) {
      setModalError("Password minimal 8 karakter.");
      return;
    }

    if (isEditing && password && password.length < 8) {
      setModalError("Password baru minimal 8 karakter.");
      return;
    }

    const payload = {
      name,
      email,
      role: form.role,
      ...(password ? { password } : {}),
    };

    try {
      setSaving(true);

      const response = await fetch("/api/admin/users", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing ? { id: editingId, ...payload } : payload,
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan data pengguna.");
      }

      await fetchUsers();

      setSuccess(
        isEditing
          ? "Data pengguna berhasil diperbarui."
          : "Pengguna baru berhasil ditambahkan.",
      );

      setError("");
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan data pengguna.",
      );
    } finally {
      setSaving(false);
    }
  };

  // HAPUS USER DARI DATABASE
  const handleDelete = async (user: UserItem) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus pengguna "${user.name}" (${user.email})?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus pengguna.");
      }

      await fetchUsers();

      setSuccess(`Pengguna "${user.name}" berhasil dihapus.`);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus pengguna.",
      );
      setSuccess("");
    }
  };

  return (
    <main className="ao-page">
      {/* HEADER HALAMAN */}
      <header className="ao-header">
        <div>
          <p className="ao-breadcrumb">Users</p>
          <h1>Kelola Users</h1>

          <p className="ao-description">
            Pantau daftar pengguna, kelola hak akses, dan peran akun.
          </p>
        </div>

        <div className="ao-actions">
          <button
            type="button"
            className="ao-refresh-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            ↻ {loading ? "Memuat..." : "Refresh"}
          </button>

          <button
            type="button"
            className="ao-process-button"
            onClick={openAddModal}
          >
            + Tambah User
          </button>
        </div>
      </header>

      {/* NOTIFIKASI */}
      {success && (
        <div className="ao-alert ao-alert-success" role="status">
          {success}
        </div>
      )}

      {error && (
        <div className="ao-alert ao-alert-error" role="alert">
          {error}
        </div>
      )}

      {/* RINGKASAN STATISTIK USER */}
      <section className="ao-summary">
        <div className="ao-summary-card">
          <span>Total Users</span>
          <strong>{loading ? "..." : totalUsers}</strong>
        </div>

        <div className="ao-summary-card">
          <span>Total Admin</span>
          <strong>{loading ? "..." : totalAdmins}</strong>
        </div>

        <div className="ao-summary-card">
          <span>Total Customer</span>
          <strong>{loading ? "..." : totalCustomers}</strong>
        </div>
      </section>

      {/* PENCARIAN, FILTER & TABEL USER */}
      <section className="ao-table-card">
        <div className="ao-toolbar">
          <input
            type="search"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Cari pengguna"
          />

          <select
            value={filterRole}
            onChange={(event) => setFilterRole(event.target.value)}
            aria-label="Filter role"
          >
            <option value="Semua">Semua Role</option>
            <option value="ADMIN">ADMIN</option>
            <option value="CUSTOMER">CUSTOMER</option>
          </select>
        </div>

        <div className="ao-table-scroll">
          <table className="ao-table">
            <thead>
              <tr>
                <th>Nama Pelanggan</th>
                <th>Email</th>
                <th>Role</th>
                <th>Total Pesanan</th>
                <th>Bergabung Pada</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="ao-empty">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ao-empty">
                    Tidak ada pengguna yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong className="ao-order-number">{user.name}</strong>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <span
                        className={`ao-status ${
                          user.role === "ADMIN" ? "completed" : "confirmed"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td>{user._count?.orders ?? 0} pesanan</td>

                    <td className="ao-date">{formatTanggal(user.createdAt)}</td>

                    <td>
                      <div className="ao-actions">
                        <button
                          type="button"
                          className="ao-detail-button"
                          onClick={() => openEditModal(user)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="ao-cancel-button"
                          onClick={() => handleDelete(user)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <p className="ao-result-count">
            Menampilkan {filteredUsers.length} dari {users.length} pengguna.
          </p>
        )}
      </section>

      {/* MODAL TAMBAH / EDIT USER */}
      {isModalOpen && (
        <div
          className="ao-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeModal();
            }
          }}
        >
          <section
            className="ao-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ao-user-modal-title"
          >
            <div className="ao-modal-header">
              <div>
                <p>Manajemen Akun</p>
                <h2 id="ao-user-modal-title">
                  {editingId !== null ? "Edit Pengguna" : "Tambah Pengguna"}
                </h2>
              </div>

              <button
                type="button"
                className="ao-close-button"
                onClick={closeModal}
                aria-label="Tutup popup"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="ao-detail-section">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  <span>Nama Lengkap</span>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    required
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #d8cfc4",
                      fontSize: "0.95rem",
                    }}
                  />
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  <span>Email</span>
                  <input
                    type="email"
                    placeholder="budi@example.com"
                    value={form.email}
                    onChange={(event) =>
                      updateForm("email", event.target.value)
                    }
                    required
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #d8cfc4",
                      fontSize: "0.95rem",
                    }}
                  />
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  <span>Role</span>
                  <select
                    value={form.role}
                    onChange={(event) =>
                      updateForm("role", event.target.value as UserRole)
                    }
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #d8cfc4",
                      fontSize: "0.95rem",
                      backgroundColor: "#fff",
                    }}
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>

                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  <span>
                    {editingId !== null
                      ? "Password Baru (Kosongkan jika tidak diubah)"
                      : "Password"}
                  </span>
                  <input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={form.password}
                    onChange={(event) =>
                      updateForm("password", event.target.value)
                    }
                    required={editingId === null}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #d8cfc4",
                      fontSize: "0.95rem",
                    }}
                  />
                </label>
              </div>

              {modalError && (
                <div
                  className="ao-alert ao-alert-error"
                  style={{ marginTop: "12px", marginBottom: 0 }}
                >
                  {modalError}
                </div>
              )}

              <div className="ao-modal-actions">
                <button
                  type="button"
                  className="ao-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="ao-process-button"
                  disabled={saving}
                >
                  {saving
                    ? "Menyimpan..."
                    : editingId !== null
                      ? "Simpan Perubahan"
                      : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
