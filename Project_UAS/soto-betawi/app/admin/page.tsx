"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Category = "Makanan" | "Minuman";
type MenuStatus = "Tersedia" | "Habis";

type Menu = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  status: MenuStatus;
};

type MenuForm = {
  name: string;
  category: Category;
  price: string;
  status: MenuStatus;
  image: string;
  description: string;
};

const emptyForm: MenuForm = {
  name: "",
  category: "Makanan",
  price: "",
  status: "Tersedia",
  image: "/images/menu-soto.jpeg",
  description: "",
};

// Gambar yang tersedia di folder public/images
const availableImages = [
  {
    label: "Soto Betawi",
    value: "/images/menu-soto.jpeg",
  },
  {
    label: "Kerak Telor",
    value: "/images/menu-kerak-telor.jpeg",
  },
  {
    label: "Nasi Uduk",
    value: "/images/menu-nasi-uduk.jpeg",
  },
  {
    label: "Bir Pletok",
    value: "/images/menu-bir-pletok.jpeg",
  },
];

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function AdminMenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  // MEMBACA MENU DARI POSTGRESQL
  useEffect(() => {
    let cancelled = false;

    const fetchMenus = async () => {
      try {
        const response = await fetch("/api/menus", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil data menu.");
        }

        if (!cancelled) {
          setMenus(result as Menu[]);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Gagal mengambil data menu.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchMenus();

    return () => {
      cancelled = true;
    };
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

  // PENCARIAN DAN FILTER KATEGORI
  const filteredMenus = menus.filter((menu) => {
    const matchSearch = menu.name
      .toLowerCase()
      .includes(search.toLowerCase().trim());

    const matchCategory =
      filterCategory === "Semua" || menu.category === filterCategory;

    return matchSearch && matchCategory;
  });

  // MEMBUKA MODAL TAMBAH
  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalError("");
    setIsModalOpen(true);
  };

  // MEMBUKA MODAL EDIT
  const openEditModal = (menu: Menu) => {
    setEditingId(menu.id);

    setForm({
      name: menu.name,
      category: menu.category,
      price: String(menu.price),
      status: menu.status ?? "Tersedia",
      image: menu.image,
      description: menu.description,
    });

    setModalError("");
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
  const updateForm = <K extends keyof MenuForm>(
    field: K,
    value: MenuForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // MENYIMPAN MENU KE DATABASE
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setModalError("");

    const name = form.name.trim();
    const description = form.description.trim();
    const price = Number(form.price);

    if (!name || !description) {
      setModalError("Nama dan deskripsi menu wajib diisi.");
      return;
    }

    if (!Number.isSafeInteger(price) || price <= 0) {
      setModalError("Harga harus berupa bilangan bulat lebih dari Rp0.");
      return;
    }

    if (!form.image.startsWith("/images/")) {
      setModalError("Silakan pilih gambar menu yang tersedia.");
      return;
    }

    const menuData = {
      name,
      description,
      price,
      category: form.category,
      status: form.status,
      image: form.image,
    };

    setSaving(true);

    try {
      const isEditing = editingId !== null;

      const response = await fetch("/api/menus", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isEditing ? { id: editingId, ...menuData } : menuData,
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan menu.");
      }

      const savedMenu = result.menu as Menu;

      if (isEditing) {
        setMenus((previous) =>
          previous.map((menu) => (menu.id === savedMenu.id ? savedMenu : menu)),
        );

        setMessage("Menu berhasil diperbarui.");
      } else {
        setMenus((previous) =>
          [...previous, savedMenu].sort((a, b) => a.id - b.id),
        );

        setMessage("Menu baru berhasil ditambahkan.");
      }

      setError("");
      setIsModalOpen(false);
      setEditingId(null);
      setForm({ ...emptyForm });
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Gagal menyimpan menu.",
      );
    } finally {
      setSaving(false);
    }
  };

  // MENGHAPUS MENU DARI DATABASE
  const handleDelete = async (menu: Menu) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus menu "${menu.name}"?`,
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/menus", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: menu.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus menu.");
      }

      setMenus((previous) => previous.filter((item) => item.id !== menu.id));

      setMessage(`Menu "${menu.name}" berhasil dihapus.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus menu.");
    }
  };

  return (
    <main className="am-page">
      {/* HEADER */}
      <header className="am-header">
        <div>
          <p className="am-breadcrumb">Menu</p>
          <h1>Kelola Menu</h1>
        </div>

        <button type="button" className="am-primary-btn" onClick={openAddModal}>
          + Tambah Menu
        </button>
      </header>

      {/* NOTIFIKASI */}
      {message && (
        <div className="am-alert am-alert-success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="am-alert am-alert-error" role="alert">
          {error}
        </div>
      )}

      {/* TABEL MENU */}
      <section className="am-table-card">
        <div className="am-toolbar">
          <input
            type="search"
            placeholder="Cari menu..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Cari menu"
          />

          <select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
            aria-label="Filter kategori"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Makanan">Makanan</option>
            <option value="Minuman">Minuman</option>
          </select>
        </div>

        <div className="am-table-scroll">
          <table className="am-table">
            <thead>
              <tr>
                <th>Menu</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="am-empty">
                    Memuat menu dari database...
                  </td>
                </tr>
              ) : filteredMenus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="am-empty">
                    Tidak ada menu yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredMenus.map((menu) => (
                  <tr key={menu.id}>
                    <td className="am-menu-name">{menu.name}</td>

                    <td>{menu.category}</td>

                    <td>{formatRupiah(menu.price)}</td>

                    <td>
                      <span
                        className={
                          menu.status === "Tersedia"
                            ? "am-status available"
                            : "am-status unavailable"
                        }
                      >
                        {menu.status}
                      </span>
                    </td>

                    <td>
                      <div className="am-actions">
                        <button
                          type="button"
                          className="am-edit-btn"
                          onClick={() => openEditModal(menu)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="am-delete-btn"
                          onClick={() => handleDelete(menu)}
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
      </section>

      {/* MODAL TAMBAH / EDIT MENU */}
      {isModalOpen && (
        <div
          className="am-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeModal();
            }
          }}
        >
          <section
            className="am-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="am-modal-title"
          >
            <div className="am-modal-header">
              <div>
                <h2 id="am-modal-title">
                  {editingId !== null ? "Edit Menu" : "Tambah Menu"}
                </h2>
                <p>Masukkan informasi menu</p>
              </div>

              <button
                type="button"
                className="am-close-btn"
                onClick={closeModal}
                aria-label="Tutup popup"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="am-modal-form">
              {/* NAMA */}
              <div className="am-field">
                <label htmlFor="am-name">Nama Menu</label>

                <input
                  id="am-name"
                  type="text"
                  placeholder="Contoh: Soto Betawi Spesial"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  maxLength={100}
                  required
                />
              </div>

              {/* KATEGORI */}
              <div className="am-field">
                <label htmlFor="am-category">Kategori</label>

                <select
                  id="am-category"
                  value={form.category}
                  onChange={(event) =>
                    updateForm("category", event.target.value as Category)
                  }
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                </select>
              </div>

              {/* HARGA */}
              <div className="am-field">
                <label htmlFor="am-price">Harga</label>

                <input
                  id="am-price"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="35000"
                  value={form.price}
                  onChange={(event) => updateForm("price", event.target.value)}
                  required
                />
              </div>

              {/* STATUS */}
              <div className="am-field">
                <label htmlFor="am-status">Status</label>

                <select
                  id="am-status"
                  value={form.status}
                  onChange={(event) =>
                    updateForm("status", event.target.value as MenuStatus)
                  }
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="Habis">Habis</option>
                </select>
              </div>

              {/* GAMBAR */}
              <div className="am-field">
                <label htmlFor="am-image">Gambar Menu</label>

                <select
                  id="am-image"
                  value={form.image}
                  onChange={(event) => updateForm("image", event.target.value)}
                >
                  {availableImages.map((image) => (
                    <option key={image.value} value={image.value}>
                      {image.label}
                    </option>
                  ))}
                </select>

                <div className="am-image-preview">
                  {/* Preview memakai URL gambar lokal */}
                  <img src={form.image} alt="Preview gambar menu" />
                </div>

                <p className="am-field-hint">
                  Pilih salah satu gambar yang tersedia di folder public/images.
                  Upload gambar baru akan ditambahkan setelah layanan
                  penyimpanan gambar disiapkan.
                </p>
              </div>

              {/* DESKRIPSI */}
              <div className="am-field">
                <label htmlFor="am-description">Deskripsi</label>

                <textarea
                  id="am-description"
                  rows={4}
                  placeholder="Deskripsi menu..."
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  maxLength={1000}
                  required
                />
              </div>

              {/* ERROR MODAL */}
              {modalError && (
                <p className="am-modal-error" role="alert">
                  {modalError}
                </p>
              )}

              {/* TOMBOL MODAL */}
              <div className="am-modal-footer">
                <button
                  type="button"
                  className="am-cancel-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="am-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Menyimpan..."
                    : editingId !== null
                      ? "Simpan Perubahan"
                      : "Simpan Menu"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
