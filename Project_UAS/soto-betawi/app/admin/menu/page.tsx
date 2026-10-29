
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { getMenus, saveMenus, type Menu } from "../../lib/menuStorage";

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

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // MEMBACA DATA MENU
  useEffect(() => {
    setMenus(getMenus());
    setLoading(false);
  }, []);

  // MENUTUP SCROLL HALAMAN SAAT MODAL TERBUKA
  useEffect(() => {
    if (!isModalOpen) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isModalOpen]);

  // PENCARIAN DAN FILTER KATEGORI
  const filteredMenus = menus.filter((menu) => {
    const matchSearch = menu.name
      .toLowerCase()
      .includes(search.toLowerCase().trim());

    const matchCategory =
      filterCategory === "Semua" ||
      menu.category === filterCategory;

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
    setIsModalOpen(false);
    setEditingId(null);
    setModalError("");
  };

  // MEMPERBARUI INPUT FORM
  const updateForm = <K extends keyof MenuForm>(
    field: K,
    value: MenuForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // UPLOAD GAMBAR DARI KOMPUTER
  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setModalError("Pilih file gambar yang valid.");
      return;
    }

    // Batasi ukuran supaya localStorage tidak cepat penuh
    if (file.size > 700 * 1024) {
      setModalError(
        "Ukuran gambar maksimal 700 KB. Kompres gambar terlebih dahulu."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateForm("image", reader.result);
        setModalError("");
      }
    };

    reader.onerror = () => {
      setModalError("Gagal membaca file gambar.");
    };

    reader.readAsDataURL(file);
  };

  // SIMPAN MENU BARU ATAU PERUBAHAN
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError("");

    const name = form.name.trim();
    const description = form.description.trim();
    const price = Number(form.price);

    if (!name || !description) {
      setModalError("Nama dan deskripsi menu wajib diisi.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setModalError("Harga harus lebih dari Rp0.");
      return;
    }

    if (!form.image) {
      setModalError("Silakan pilih gambar menu.");
      return;
    }

    let updatedMenus: Menu[];

    if (editingId !== null) {
      updatedMenus = menus.map((menu) =>
        menu.id === editingId
          ? {
              ...menu,
              name,
              description,
              price,
              category: form.category,
              status: form.status,
              image: form.image,
            }
          : menu
      );
    } else {
      const newMenu: Menu = {
        id: Date.now(),
        name,
        description,
        price,
        category: form.category,
        status: form.status,
        image: form.image,
      };

      updatedMenus = [...menus, newMenu];
    }

    const saved = saveMenus(updatedMenus);

    if (!saved) {
      setModalError(
        "Gagal menyimpan menu. Penyimpanan browser mungkin penuh."
      );
      return;
    }

    setMenus(updatedMenus);
    setMessage(
      editingId !== null
        ? "Menu berhasil diperbarui."
        : "Menu baru berhasil ditambahkan."
    );
    setError("");
    closeModal();
  };

  // HAPUS MENU
  const handleDelete = (menu: Menu) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus menu "${menu.name}"?`
    );

    if (!confirmed) return;

    const updatedMenus = menus.filter(
      (item) => item.id !== menu.id
    );

    if (!saveMenus(updatedMenus)) {
      setError("Gagal menghapus menu.");
      setMessage("");
      return;
    }

    setMenus(updatedMenus);
    setMessage(`Menu "${menu.name}" berhasil dihapus.`);
    setError("");
  };

  return (
    <main className="am-page">
      {/* HEADER */}
      <header className="am-header">
        <div>
          <p className="am-breadcrumb">Menu</p>
          <h1>Kelola Menu</h1>
        </div>

        <button
          type="button"
          className="am-primary-btn"
          onClick={openAddModal}
        >
          + Tambah Menu
        </button>
      </header>

      {/* NOTIFIKASI */}
      {message && (
        <div className="am-alert am-alert-success">
          {message}
        </div>
      )}

      {error && (
        <div className="am-alert am-alert-error">
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
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Cari menu"
          />

          <select
            value={filterCategory}
            onChange={(event) =>
              setFilterCategory(event.target.value)
            }
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
                    <td className="am-menu-name">
                      {menu.name}
                    </td>

                    <td>{menu.category}</td>

                    <td>
                      {formatRupiah(menu.price)}
                    </td>

                    <td>
                      <span
                        className={
                          (menu.status ?? "Tersedia") ===
                          "Tersedia"
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

      {/* MODAL TAMBAH / EDIT MENU */}
      {isModalOpen && (
        <div
          className="am-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
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
                  {editingId !== null
                    ? "Edit Menu"
                    : "Tambah Menu"}
                </h2>
                <p>Masukkan informasi menu</p>
              </div>

              <button
                type="button"
                className="am-close-btn"
                onClick={closeModal}
                aria-label="Tutup popup"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="am-modal-form"
            >
              <div className="am-field">
                <label htmlFor="am-name">
                  Nama Menu
                </label>
                <input
                  id="am-name"
                  type="text"
                  placeholder="Contoh: Soto Betawi Spesial"
                  value={form.name}
                  onChange={(event) =>
                    updateForm("name", event.target.value)
                  }
                  required
                />
              </div>

              <div className="am-field">
                <label htmlFor="am-category">
                  Kategori
                </label>
                <select
                  id="am-category"
                  value={form.category}
                  onChange={(event) =>
                    updateForm(
                      "category",
                      event.target.value as Category
                    )
                  }
                >
                  <option value="Makanan">Makanan</option>
                  <option value="Minuman">Minuman</option>
                </select>
              </div>

              <div className="am-field">
                <label htmlFor="am-price">
                  Harga
                </label>
                <input
                  id="am-price"
                  type="number"
                  min="1"
                  placeholder="48000"
                  value={form.price}
                  onChange={(event) =>
                    updateForm("price", event.target.value)
                  }
                  required
                />
              </div>

              <div className="am-field">
                <label htmlFor="am-status">
                  Status
                </label>
                <select
                  id="am-status"
                  value={form.status}
                  onChange={(event) =>
                    updateForm(
                      "status",
                      event.target.value as MenuStatus
                    )
                  }
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="Habis">Habis</option>
                </select>
              </div>

              <div className="am-field">
                <label htmlFor="am-image">
                  Gambar Menu
                </label>
                <input
                  ref={fileInputRef}
                  id="am-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />

                {form.image && (
                  <div className="am-image-preview">
                    <img
                      src={form.image}
                      alt="Preview gambar menu"
                    />
                  </div>
                )}

                <p className="am-field-hint">
                  Pilih gambar dari komputer (maksimal 700 KB).
                  Saat mengedit, gambar lama tetap digunakan
                  jika tidak memilih gambar baru.
                </p>
              </div>

              <div className="am-field">
                <label htmlFor="am-description">
                  Deskripsi
                </label>
                <textarea
                  id="am-description"
                  rows={4}
                  placeholder="Deskripsi menu..."
                  value={form.description}
                  onChange={(event) =>
                    updateForm(
                      "description",
                      event.target.value
                    )
                  }
                  required
                />
              </div>

              {modalError && (
                <p className="am-modal-error">
                  {modalError}
                </p>
              )}

              <div className="am-modal-footer">
                <button
                  type="button"
                  className="am-cancel-btn"
                  onClick={closeModal}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="am-primary-btn"
                >
                  {editingId !== null
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
