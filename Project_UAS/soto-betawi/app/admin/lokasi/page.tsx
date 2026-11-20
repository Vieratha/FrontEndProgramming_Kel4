"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Image from "next/image";

// INI BAGIAN TIPE DATA LOKASI
type LocationItem = {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  openingHours: string;
  imagePath: string;
  mapUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

// INI BAGIAN TIPE DATA FORM LOKASI
type LocationForm = {
  name: string;
  address: string;
  city: string;
  phone: string;
  openingHours: string;
  imagePath: string;
  mapUrl: string;
  isActive: boolean;
  sortOrder: string;
};

// INI BAGIAN FORM LOKASI KOSONG
const emptyForm: LocationForm = {
  name: "",
  address: "",
  city: "",
  phone: "",
  openingHours: "",
  imagePath: "/images/map-menteng.jpeg",
  mapUrl: "",
  isActive: true,
  sortOrder: "1",
};

// INI BAGIAN PILIHAN GAMBAR LOKASI
const imageOptions = [
  {
    path: "/images/map-menteng.jpeg",
    label: "Peta Menteng",
  },
  {
    path: "/images/map-kemang.jpeg",
    label: "Peta Kemang",
  },
];

// INI BAGIAN FORMAT TANGGAL
function formatTanggal(tanggal: string) {
  return new Date(tanggal).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
  });
}

// INI BAGIAN HALAMAN ADMIN LOCATIONS
export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // INI BAGIAN PENCARIAN DAN FILTER LOKASI
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // INI BAGIAN FORM LOKASI
  const [form, setForm] = useState<LocationForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  // INI BAGIAN NOTIFIKASI
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // INI BAGIAN MEMBACA DATA LOKASI DARI DATABASE
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/locations", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data lokasi.");
      }

      setLocations(Array.isArray(data.locations) ? data.locations : []);

      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil lokasi.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // INI BAGIAN MEMUAT DATA LOKASI PERTAMA KALI
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchLocations();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchLocations]);

  // INI BAGIAN MENGHITUNG STATISTIK LOKASI
  const totalLocations = locations.length;

  const activeLocations = locations.filter(
    (location) => location.isActive,
  ).length;

  const inactiveLocations = locations.filter(
    (location) => !location.isActive,
  ).length;

  // INI BAGIAN PENCARIAN DAN FILTER
  const filteredLocations = locations.filter((location) => {
    const keyword = search.toLowerCase().trim();

    const matchSearch =
      location.name.toLowerCase().includes(keyword) ||
      location.address.toLowerCase().includes(keyword) ||
      location.city.toLowerCase().includes(keyword);

    const matchStatus =
      filterStatus === "Semua" ||
      (filterStatus === "Aktif" && location.isActive) ||
      (filterStatus === "Nonaktif" && !location.isActive);

    return matchSearch && matchStatus;
  });

  // INI BAGIAN MENGOSONGKAN FORM
  const resetForm = () => {
    setForm({
      ...emptyForm,
      sortOrder: String(locations.length + 1),
    });

    setEditingId(null);
  };

  // INI BAGIAN MEMPERBARUI INPUT FORM
  const updateForm = <K extends keyof LocationForm>(
    field: K,
    value: LocationForm[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // INI BAGIAN MENGUNGGAH GAMBAR LOKASI BARU
  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    // INI BAGIAN MEMERIKSA FORMAT FILE
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Format gambar harus JPG, PNG, atau WEBP.");
      input.value = "";
      return;
    }

    // INI BAGIAN MEMERIKSA UKURAN FILE
    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 2 MB.");
      input.value = "";
      return;
    }

    try {
      setUploadingImage(true);
      setError("");
      setSuccess("");

      // INI BAGIAN MEMASUKKAN FILE KE FORM DATA
      const formData = new FormData();
      formData.append("file", file);

      // INI BAGIAN MENGIRIM GAMBAR KE API
      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || typeof data.imageUrl !== "string") {
        throw new Error(data.message || "Gagal mengunggah gambar lokasi.");
      }

      // INI BAGIAN MEMASUKKAN URL GAMBAR KE FORM
      updateForm("imagePath", data.imageUrl);

      setSuccess("Gambar lokasi berhasil diunggah.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengunggah gambar.",
      );
    } finally {
      setUploadingImage(false);
      input.value = "";
    }
  };

  // INI BAGIAN MEMBUKA FORM EDIT LOKASI
  const handleEdit = (location: LocationItem) => {
    setEditingId(location.id);

    setForm({
      name: location.name,
      address: location.address,
      city: location.city,
      phone: location.phone ?? "",
      openingHours: location.openingHours,
      imagePath: location.imagePath,
      mapUrl: location.mapUrl ?? "",
      isActive: location.isActive,
      sortOrder: String(location.sortOrder),
    });

    setSuccess("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // INI BAGIAN MENYIMPAN LOKASI BARU ATAU PERUBAHAN LOKASI
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (uploadingImage) {
      setError("Tunggu sampai upload gambar selesai.");
      return;
    }

    setSuccess("");
    setError("");

    const name = form.name.trim();
    const address = form.address.trim();
    const city = form.city.trim();
    const phone = form.phone.trim();
    const openingHours = form.openingHours.trim();
    const mapUrl = form.mapUrl.trim();
    const sortOrder = Number(form.sortOrder);

    // INI BAGIAN VALIDASI NAMA CABANG
    if (!name || name.length > 100) {
      setError("Nama cabang wajib diisi dan maksimal 100 karakter.");
      return;
    }

    // INI BAGIAN VALIDASI ALAMAT
    if (!address || address.length > 500) {
      setError("Alamat wajib diisi dan maksimal 500 karakter.");
      return;
    }

    // INI BAGIAN VALIDASI KOTA
    if (!city || city.length > 100) {
      setError("Kota atau wilayah wajib diisi.");
      return;
    }

    // INI BAGIAN VALIDASI JAM OPERASIONAL
    if (!openingHours || openingHours.length > 200) {
      setError("Jam operasional wajib diisi.");
      return;
    }

    // INI BAGIAN VALIDASI NOMOR TELEPON
    if (phone && (!/^[0-9+().\-\s]+$/.test(phone) || phone.length > 30)) {
      setError("Format nomor telepon tidak valid.");
      return;
    }

    // INI BAGIAN VALIDASI URUTAN
    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
      setError("Urutan lokasi harus berupa angka 0 sampai 9999.");
      return;
    }

    try {
      setSaving(true);

      // INI BAGIAN MENENTUKAN METHOD API
      const method = editingId !== null ? "PATCH" : "POST";

      // INI BAGIAN MENGIRIM DATA LOKASI KE API
      const response = await fetch("/api/admin/locations", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingId !== null ? { id: editingId } : {}),
          name,
          address,
          city,
          phone,
          openingHours,
          imagePath: form.imagePath,
          mapUrl,
          isActive: form.isActive,
          sortOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan data lokasi.");
      }

      // INI BAGIAN MEMUAT ULANG DATA LOKASI
      await fetchLocations();

      setSuccess(
        editingId !== null
          ? "Lokasi berhasil diperbarui."
          : "Lokasi berhasil ditambahkan.",
      );

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan lokasi.",
      );
    } finally {
      setSaving(false);
    }
  };

  // INI BAGIAN MENGAKTIFKAN ATAU MENONAKTIFKAN LOKASI
  const handleToggle = async (location: LocationItem) => {
    setBusyId(location.id);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/admin/locations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: location.id,
          name: location.name,
          address: location.address,
          city: location.city,
          phone: location.phone ?? "",
          openingHours: location.openingHours,
          imagePath: location.imagePath,
          mapUrl: location.mapUrl ?? "",
          isActive: !location.isActive,
          sortOrder: location.sortOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah status lokasi.");
      }

      await fetchLocations();

      setSuccess(
        location.isActive
          ? "Lokasi berhasil dinonaktifkan."
          : "Lokasi berhasil diaktifkan.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengubah status lokasi.",
      );
    } finally {
      setBusyId(null);
    }
  };

  // INI BAGIAN MENGHAPUS LOKASI
  const handleDelete = async (location: LocationItem) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus cabang "${location.name}"?`,
    );

    if (!confirmed) return;

    setBusyId(location.id);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/admin/locations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: location.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus lokasi.");
      }

      await fetchLocations();

      if (editingId === location.id) {
        resetForm();
      }

      setSuccess("Lokasi berhasil dihapus.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus lokasi.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="loc-admin-page">
      {/* INI BAGIAN HEADER HALAMAN */}
      <header className="loc-admin-header">
        <div>
          <p className="loc-admin-breadcrumb">Lokasi</p>

          <h1>Kelola Lokasi</h1>

          <p>
            Kelola cabang restoran yang ditampilkan kepada pengunjung website.
          </p>
        </div>

        <button
          type="button"
          className="loc-admin-refresh"
          onClick={() => {
            setSuccess("");
            setError("");
            void fetchLocations();
          }}
          disabled={loading}
        >
          ↻ {loading ? "Memuat..." : "Refresh"}
        </button>
      </header>

      {/* INI BAGIAN NOTIFIKASI */}
      {success && (
        <div className="loc-admin-alert success" role="status">
          {success}
        </div>
      )}

      {error && (
        <div className="loc-admin-alert error" role="alert">
          {error}
        </div>
      )}

      {/* INI BAGIAN RINGKASAN STATISTIK LOKASI */}
      <section className="loc-admin-summary">
        <div className="loc-admin-summary-card">
          <span>Total Cabang</span>
          <strong>{loading ? "..." : totalLocations}</strong>
        </div>

        <div className="loc-admin-summary-card">
          <span>Cabang Aktif</span>
          <strong>{loading ? "..." : activeLocations}</strong>
        </div>

        <div className="loc-admin-summary-card">
          <span>Cabang Nonaktif</span>
          <strong>{loading ? "..." : inactiveLocations}</strong>
        </div>
      </section>

      {/* INI BAGIAN FORM DAN DAFTAR LOKASI */}
      <div className="loc-admin-layout">
        {/* INI BAGIAN FORM TAMBAH DAN EDIT LOKASI */}
        <section className="loc-admin-form-card">
          <div className="loc-admin-card-header">
            <div>
              <p>Manajemen Cabang</p>
              <h2>{editingId !== null ? "Edit Lokasi" : "Tambah Lokasi"}</h2>
            </div>
          </div>

          <form className="loc-admin-form" onSubmit={handleSubmit}>
            {/* INI BAGIAN NAMA CABANG */}
            <div className="loc-admin-field">
              <label htmlFor="location-name">Nama Cabang</label>

              <input
                id="location-name"
                type="text"
                maxLength={100}
                placeholder="Contoh: Soto Betawi Menteng"
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                required
              />
            </div>

            {/* INI BAGIAN ALAMAT CABANG */}
            <div className="loc-admin-field">
              <label htmlFor="location-address">Alamat Lengkap</label>

              <textarea
                id="location-address"
                rows={3}
                maxLength={500}
                placeholder="Masukkan alamat lengkap cabang..."
                value={form.address}
                onChange={(event) => updateForm("address", event.target.value)}
                required
              />
            </div>

            {/* INI BAGIAN KOTA ATAU WILAYAH */}
            <div className="loc-admin-field">
              <label htmlFor="location-city">Kota / Wilayah</label>

              <input
                id="location-city"
                type="text"
                maxLength={100}
                placeholder="Contoh: Jakarta Pusat"
                value={form.city}
                onChange={(event) => updateForm("city", event.target.value)}
                required
              />
            </div>

            {/* INI BAGIAN NOMOR TELEPON */}
            <div className="loc-admin-field">
              <label htmlFor="location-phone">
                Nomor Telepon <span>(Opsional)</span>
              </label>

              <input
                id="location-phone"
                type="tel"
                maxLength={30}
                placeholder="Contoh: +62 21 12345678"
                value={form.phone}
                onChange={(event) => updateForm("phone", event.target.value)}
              />
            </div>

            {/* INI BAGIAN JAM OPERASIONAL */}
            <div className="loc-admin-field">
              <label htmlFor="location-hours">Jam Operasional</label>

              <input
                id="location-hours"
                type="text"
                maxLength={200}
                placeholder="Contoh: Setiap hari, 10.00–22.00 WIB"
                value={form.openingHours}
                onChange={(event) =>
                  updateForm("openingHours", event.target.value)
                }
                required
              />
            </div>

            {/* INI BAGIAN GAMBAR LOKASI */}
            <div className="loc-admin-field">
              <label htmlFor="location-image">Gambar Peta</label>

              {/* INI BAGIAN MEMILIH GAMBAR LAMA */}
              <select
                id="location-image"
                value={
                  imageOptions.some((image) => image.path === form.imagePath)
                    ? form.imagePath
                    : ""
                }
                onChange={(event) =>
                  updateForm("imagePath", event.target.value)
                }
                disabled={saving || uploadingImage}
              >
                <option value="">Pilih gambar yang tersedia</option>

                {imageOptions.map((image) => (
                  <option key={image.path} value={image.path}>
                    {image.label}
                  </option>
                ))}
              </select>

              {/* INI BAGIAN UPLOAD GAMBAR BARU */}
              <label htmlFor="location-image-upload">
                Atau tambahkan gambar dari komputer
              </label>

              <input
                id="location-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={saving || uploadingImage}
              />

              <small>Format JPG, PNG, atau WEBP. Ukuran maksimal 2 MB.</small>

              {/* INI BAGIAN STATUS UPLOAD */}
              {uploadingImage && <small>Sedang mengunggah gambar...</small>}

              {/* INI BAGIAN PREVIEW GAMBAR */}
              {form.imagePath && (
                <div className="loc-admin-image-preview">
                  <Image
                    src={form.imagePath}
                    alt="Preview gambar peta lokasi"
                    width={800}
                    height={400}
                    unoptimized
                  />
                </div>
              )}
            </div>

            {/* INI BAGIAN LINK GOOGLE MAPS */}
            <div className="loc-admin-field">
              <label htmlFor="location-map-url">
                Link Google Maps <span>(Opsional)</span>
              </label>

              <input
                id="location-map-url"
                type="url"
                placeholder="https://maps.app.goo.gl/..."
                value={form.mapUrl}
                onChange={(event) => updateForm("mapUrl", event.target.value)}
              />

              <small>
                Salin link dari Google Maps → Bagikan. Jika dikosongkan, sistem
                membuat link pencarian berdasarkan alamat.
              </small>
            </div>

            {/* INI BAGIAN URUTAN TAMPIL */}
            <div className="loc-admin-field">
              <label htmlFor="location-order">Urutan Tampil</label>

              <input
                id="location-order"
                type="number"
                min="0"
                max="9999"
                step="1"
                value={form.sortOrder}
                onChange={(event) =>
                  updateForm("sortOrder", event.target.value)
                }
                required
              />

              <small>Angka lebih kecil akan ditampilkan lebih dahulu.</small>
            </div>

            {/* INI BAGIAN STATUS LOKASI */}
            <label className="loc-admin-checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  updateForm("isActive", event.target.checked)
                }
              />

              <span>Tampilkan cabang di halaman Customer</span>
            </label>

            {/* INI BAGIAN TOMBOL FORM */}
            <div className="loc-admin-form-actions">
              <button
                type="submit"
                className="loc-admin-save"
                disabled={saving}
              >
                {saving
                  ? "Menyimpan..."
                  : editingId !== null
                    ? "Simpan Perubahan"
                    : "Tambah Lokasi"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="loc-admin-cancel"
                  onClick={resetForm}
                  disabled={saving || uploadingImage}
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* INI BAGIAN DAFTAR LOKASI */}
        <section className="loc-admin-list-card">
          <div className="loc-admin-card-header">
            <div>
              <p>Data Website</p>
              <h2>Daftar Cabang</h2>
            </div>

            <span className="loc-admin-count">
              {filteredLocations.length} Cabang
            </span>
          </div>

          {/* INI BAGIAN PENCARIAN DAN FILTER */}
          <div className="loc-admin-toolbar">
            <input
              type="search"
              placeholder="Cari nama, alamat, atau kota..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Cari lokasi"
            />

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              aria-label="Filter status lokasi"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          {/* INI BAGIAN TABEL LOKASI */}
          <div className="loc-admin-table-scroll">
            <table className="loc-admin-table">
              <thead>
                <tr>
                  <th>Cabang</th>
                  <th>Urutan</th>
                  <th>Status</th>
                  <th>Diperbarui</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="loc-admin-empty">
                      Memuat data lokasi...
                    </td>
                  </tr>
                ) : filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="loc-admin-empty">
                      Belum ada lokasi yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((location) => (
                    <tr key={location.id}>
                      <td className="loc-admin-location-cell">
                        <strong>{location.name}</strong>
                        <span>{location.city}</span>
                        <p>{location.address}</p>
                      </td>

                      <td>{location.sortOrder}</td>

                      <td>
                        <span
                          className={
                            location.isActive
                              ? "loc-admin-status active"
                              : "loc-admin-status inactive"
                          }
                        >
                          {location.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>

                      <td>{formatTanggal(location.updatedAt)}</td>

                      <td>
                        <div className="loc-admin-row-actions">
                          <button
                            type="button"
                            className="loc-admin-edit"
                            onClick={() => handleEdit(location)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="loc-admin-toggle"
                            onClick={() => handleToggle(location)}
                            disabled={busyId === location.id}
                          >
                            {busyId === location.id
                              ? "..."
                              : location.isActive
                                ? "Nonaktifkan"
                                : "Aktifkan"}
                          </button>

                          <button
                            type="button"
                            className="loc-admin-delete"
                            onClick={() => handleDelete(location)}
                            disabled={busyId === location.id}
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
      </div>
    </main>
  );
}
