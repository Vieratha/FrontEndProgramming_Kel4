"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Menu } from "../../lib/menuStorage";

type Category = "Makanan" | "Minuman";
type MenuStatus = "Tersedia" | "Habis";

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
  image: "",
  description: "",
};

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
  const [uploadingImage, setUploadingImage] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  // Mengambil data menu dari database.
  const fetchMenus = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/menus");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengambil data menu.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Format data menu dari server tidak valid.");
      }

      setMenus(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil menu.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchMenus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Mengunci scroll halaman saat modal terbuka.
  useEffect(() => {
    if (!isModalOpen) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving && !uploadingImage) {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isModalOpen, saving, uploadingImage]);

  // Pencarian dan filter kategori menu.
  const filteredMenus = menus.filter((menu) => {
    const matchSearch = menu.name
      .toLowerCase()
      .includes(search.toLowerCase().trim());

    const matchCategory =
      filterCategory === "Semua" || menu.category === filterCategory;

    return matchSearch && matchCategory;
  });

  // Membuka modal untuk menambah menu.
  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalError("");
    setMessage("");
    setError("");
    setIsModalOpen(true);
  };

  // Membuka modal untuk mengedit menu.
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
    setMessage("");
    setError("");
    setIsModalOpen(true);
  };

  // Menutup modal.
  const closeModal = () => {
    if (saving || uploadingImage) return;

    setIsModalOpen(false);
    setEditingId(null);
    setModalError("");
  };

  // Memperbarui data pada form.
  const updateForm = <K extends keyof MenuForm>(
    field: K,
    value: MenuForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Upload gambar menu dan validasi file.
  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setModalError("Format gambar harus JPG, PNG, atau WEBP.");
      input.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setModalError("Ukuran gambar maksimal 2 MB.");
      input.value = "";
      return;
    }

    try {
      setUploadingImage(true);
      setModalError("");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || typeof data.imageUrl !== "string") {
        throw new Error(data.message || "Gagal mengunggah gambar menu.");
      }

      updateForm("image", data.imageUrl);
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengunggah gambar.",
      );
    } finally {
      setUploadingImage(false);
      input.value = "";
    }
  };

  // Menyimpan menu baru atau perubahan.
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

    if (!form.image) {
      setModalError("Silakan pilih gambar menu.");
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

    try {
      setSaving(true);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal menyimpan menu.");
      }

      await fetchMenus();

      setMessage(
        isEditing
          ? "Menu berhasil diperbarui."
          : "Menu baru berhasil ditambahkan.",
      );

      setError("");
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan menu.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Menghapus menu dari database.
  const handleDelete = async (menu: Menu) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus menu "${menu.name}"?`,
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/menus", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: menu.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal menghapus menu.");
      }

      await fetchMenus();

      setMessage(`Menu "${menu.name}" berhasil dihapus.`);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus menu.",
      );
      setMessage("");
    }
  };

  return (
    <main className="am-page">
      {/* Header */}
      <header className="am-header">
        <div>
          <p className="am-breadcrumb">Menu</p>
          <h1>Kelola Menu</h1>
        </div>

        <button type="button" className="am-primary-btn" onClick={openAddModal}>
          + Tambah Menu
        </button>
      </header>

      {/* Notifikasi */}
      {message && <div className="am-alert am-alert-success">{message}</div>}

      {error && <div className="am-alert am-alert-error">{error}</div>}

      {/* Tabel menu */}
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
                    Memuat menu...
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
                          (menu.status ?? "Tersedia") === "Tersedia"
                            ? "am-status available"
                            : "am-status unavailable"
                        }
                      >
                        {menu.status ?? "Tersedia"}
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

      {/* Modal tambah dan edit menu */}
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
              <div className="am-field">
                <label htmlFor="am-name">Nama Menu</label>
                <input
                  id="am-name"
                  type="text"
                  placeholder="Contoh: Soto Betawi Spesial"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  required
                />
              </div>

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

              <div className="am-field">
                <label htmlFor="am-price">Harga</label>
                <input
                  id="am-price"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="48000"
                  value={form.price}
                  onChange={(event) => updateForm("price", event.target.value)}
                  required
                />
              </div>

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

              <div className="am-field">
                <label htmlFor="am-image-upload">Unggah Gambar Menu</label>

                <input
                  id="am-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={saving || uploadingImage}
                />

                <p className="am-field-hint">
                  Pilih gambar dari perangkat Anda. Format JPG, PNG, atau WEBP.
                  Ukuran maksimal 2 MB.
                </p>

                {uploadingImage && (
                  <p className="am-field-hint">Sedang mengunggah gambar...</p>
                )}

                {form.image && (
                  <div className="am-image-preview">
                    <Image
                      src={form.image}
                      alt="Preview gambar menu"
                      width={500}
                      height={300}
                      unoptimized
                    />
                  </div>
                )}
              </div>

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
                  required
                />
              </div>

              {modalError && <p className="am-modal-error">{modalError}</p>}

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
                  disabled={saving || uploadingImage}
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
