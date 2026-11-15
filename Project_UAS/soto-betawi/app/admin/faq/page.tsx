"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

// INI BAGIAN TIPE DATA FAQ
type FaqItem = {
  id: number;
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

// INI BAGIAN TIPE DATA FORM FAQ
type FaqForm = {
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: string;
};

// INI BAGIAN FORM KOSONG
const emptyForm: FaqForm = {
  question: "",
  answer: "",
  isActive: true,
  sortOrder: "1",
};

// INI BAGIAN HALAMAN MANAJEMEN FAQ
export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // INI BAGIAN PENCARIAN DAN FILTER
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");

  // INI BAGIAN FORM FAQ
  const [form, setForm] = useState<FaqForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  // INI BAGIAN NOTIFIKASI
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // INI BAGIAN MEMBACA FAQ DARI DATABASE
  const fetchFaqs = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/faq", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil data FAQ.");
      }

      setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengambil FAQ.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // INI BAGIAN MEMUAT DATA FAQ PERTAMA KALI
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchFaqs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchFaqs]);

  // INI BAGIAN MENGHITUNG STATISTIK FAQ
  const totalFaqs = faqs.length;

  const activeFaqs = faqs.filter((faq) => faq.isActive).length;

  const inactiveFaqs = faqs.filter((faq) => !faq.isActive).length;

  // INI BAGIAN PENCARIAN DAN FILTER FAQ
  const filteredFaqs = faqs.filter((faq) => {
    const keyword = search.toLowerCase().trim();

    const matchSearch =
      faq.question.toLowerCase().includes(keyword) ||
      faq.answer.toLowerCase().includes(keyword);

    const matchStatus =
      filterStatus === "Semua" ||
      (filterStatus === "Aktif" && faq.isActive) ||
      (filterStatus === "Nonaktif" && !faq.isActive);

    return matchSearch && matchStatus;
  });

  // INI BAGIAN MENGOSONGKAN FORM
  const resetForm = () => {
    setForm({
      ...emptyForm,
      sortOrder: String(faqs.length + 1),
    });

    setEditingId(null);
  };

  // INI BAGIAN MEMPERBARUI INPUT FORM
  const updateForm = <K extends keyof FaqForm>(field: K, value: FaqForm[K]) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // INI BAGIAN MEMBUKA FORM EDIT
  const handleEdit = (faq: FaqItem) => {
    setEditingId(faq.id);

    setForm({
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive,
      sortOrder: String(faq.sortOrder),
    });

    setSuccess("");
    setError("");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // INI BAGIAN MENYIMPAN FAQ BARU ATAU PERUBAHAN FAQ
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    const question = form.question.trim();
    const answer = form.answer.trim();
    const sortOrder = Number(form.sortOrder);

    // INI BAGIAN VALIDASI PERTANYAAN
    if (!question || question.length > 200) {
      setError("Pertanyaan wajib diisi dan maksimal 200 karakter.");
      return;
    }

    // INI BAGIAN VALIDASI JAWABAN
    if (!answer || answer.length > 3000) {
      setError("Jawaban wajib diisi dan maksimal 3000 karakter.");
      return;
    }

    // INI BAGIAN VALIDASI URUTAN
    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
      setError("Urutan FAQ harus berupa angka 0 sampai 9999.");
      return;
    }

    try {
      setSaving(true);

      // INI BAGIAN MENENTUKAN METHOD API
      const method = editingId !== null ? "PATCH" : "POST";

      // INI BAGIAN MENGIRIM DATA FAQ KE API
      const response = await fetch("/api/admin/faq", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingId !== null ? { id: editingId } : {}),
          question,
          answer,
          isActive: form.isActive,
          sortOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menyimpan FAQ.");
      }

      // INI BAGIAN MEMUAT ULANG DATA FAQ
      await fetchFaqs();

      setSuccess(
        editingId !== null
          ? "FAQ berhasil diperbarui."
          : "FAQ berhasil ditambahkan.",
      );

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan FAQ.",
      );
    } finally {
      setSaving(false);
    }
  };

  // INI BAGIAN MENGAKTIFKAN ATAU MENONAKTIFKAN FAQ
  const handleToggle = async (faq: FaqItem) => {
    setBusyId(faq.id);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/admin/faq", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          isActive: !faq.isActive,
          sortOrder: faq.sortOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah status FAQ.");
      }

      await fetchFaqs();

      setSuccess(
        faq.isActive
          ? "FAQ berhasil dinonaktifkan."
          : "FAQ berhasil diaktifkan.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengubah status FAQ.",
      );
    } finally {
      setBusyId(null);
    }
  };

  // INI BAGIAN MENGHAPUS FAQ
  const handleDelete = async (faq: FaqItem) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus pertanyaan "${faq.question}"?`,
    );

    if (!confirmed) return;

    setBusyId(faq.id);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/admin/faq", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: faq.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal menghapus FAQ.");
      }

      await fetchFaqs();

      if (editingId === faq.id) {
        resetForm();
      }

      setSuccess("FAQ berhasil dihapus.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menghapus FAQ.",
      );
    } finally {
      setBusyId(null);
    }
  };

  // INI BAGIAN FORMAT TANGGAL
  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
    });
  };

  return (
    <main className="faq-admin-page">
      {/* INI BAGIAN HEADER HALAMAN */}
      <header className="faq-admin-header">
        <div>
          <p className="faq-admin-breadcrumb">FAQ</p>
          <h1>Kelola FAQ</h1>
          <p>
            Kelola pertanyaan dan jawaban yang ditampilkan kepada pengunjung
            website.
          </p>
        </div>

        <button
          type="button"
          className="faq-admin-refresh"
          onClick={() => {
            setSuccess("");
            setError("");
            void fetchFaqs();
          }}
          disabled={loading}
        >
          ↻ {loading ? "Memuat..." : "Refresh"}
        </button>
      </header>

      {/* INI BAGIAN NOTIFIKASI */}
      {success && (
        <div className="faq-admin-alert success" role="status">
          {success}
        </div>
      )}

      {error && (
        <div className="faq-admin-alert error" role="alert">
          {error}
        </div>
      )}

      {/* INI BAGIAN RINGKASAN STATISTIK FAQ */}
      <section className="faq-admin-summary">
        <div className="faq-admin-summary-card">
          <span>Total FAQ</span>
          <strong>{loading ? "..." : totalFaqs}</strong>
        </div>

        <div className="faq-admin-summary-card">
          <span>FAQ Aktif</span>
          <strong>{loading ? "..." : activeFaqs}</strong>
        </div>

        <div className="faq-admin-summary-card">
          <span>FAQ Nonaktif</span>
          <strong>{loading ? "..." : inactiveFaqs}</strong>
        </div>
      </section>

      {/* INI BAGIAN FORM DAN DAFTAR FAQ */}
      <div className="faq-admin-layout">
        {/* INI BAGIAN FORM TAMBAH DAN EDIT FAQ */}
        <section className="faq-admin-form-card">
          <div className="faq-admin-card-header">
            <div>
              <p>Manajemen Konten</p>
              <h2>
                {editingId !== null ? "Edit Pertanyaan" : "Tambah Pertanyaan"}
              </h2>
            </div>
          </div>

          <form className="faq-admin-form" onSubmit={handleSubmit}>
            {/* INI BAGIAN INPUT PERTANYAAN */}
            <div className="faq-admin-field">
              <label htmlFor="faq-question">Pertanyaan</label>

              <input
                id="faq-question"
                type="text"
                maxLength={200}
                placeholder="Contoh: Apa saja menu yang tersedia?"
                value={form.question}
                onChange={(event) => updateForm("question", event.target.value)}
                required
              />

              <small>{form.question.length}/200 karakter</small>
            </div>

            {/* INI BAGIAN INPUT JAWABAN */}
            <div className="faq-admin-field">
              <label htmlFor="faq-answer">Jawaban</label>

              <textarea
                id="faq-answer"
                rows={7}
                maxLength={3000}
                placeholder="Tuliskan jawaban untuk pertanyaan tersebut..."
                value={form.answer}
                onChange={(event) => updateForm("answer", event.target.value)}
                required
              />

              <small>{form.answer.length}/3000 karakter</small>
            </div>

            {/* INI BAGIAN URUTAN FAQ */}
            <div className="faq-admin-field">
              <label htmlFor="faq-sort">Urutan Tampil</label>

              <input
                id="faq-sort"
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

            {/* INI BAGIAN STATUS AKTIF */}
            <label className="faq-admin-checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  updateForm("isActive", event.target.checked)
                }
              />

              <span>Tampilkan FAQ di halaman utama</span>
            </label>

            {/* INI BAGIAN TOMBOL FORM */}
            <div className="faq-admin-form-actions">
              <button
                type="submit"
                className="faq-admin-save"
                disabled={saving}
              >
                {saving
                  ? "Menyimpan..."
                  : editingId !== null
                    ? "Simpan Perubahan"
                    : "Tambah FAQ"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="faq-admin-cancel"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Batal Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* INI BAGIAN DAFTAR FAQ */}
        <section className="faq-admin-list-card">
          <div className="faq-admin-card-header">
            <div>
              <p>Konten Website</p>
              <h2>Daftar Pertanyaan</h2>
            </div>

            <span className="faq-admin-count">{filteredFaqs.length} FAQ</span>
          </div>

          {/* INI BAGIAN PENCARIAN DAN FILTER */}
          <div className="faq-admin-toolbar">
            <input
              type="search"
              placeholder="Cari pertanyaan atau jawaban..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Cari FAQ"
            />

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              aria-label="Filter status FAQ"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          {/* INI BAGIAN TABEL FAQ */}
          <div className="faq-admin-table-scroll">
            <table className="faq-admin-table">
              <thead>
                <tr>
                  <th>FAQ</th>
                  <th>Urutan</th>
                  <th>Status</th>
                  <th>Diperbarui</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="faq-admin-empty">
                      Memuat data FAQ...
                    </td>
                  </tr>
                ) : filteredFaqs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="faq-admin-empty">
                      Belum ada FAQ yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredFaqs.map((faq) => (
                    <tr key={faq.id}>
                      <td className="faq-admin-content-cell">
                        <strong>{faq.question}</strong>
                        <p>{faq.answer}</p>
                      </td>

                      <td>{faq.sortOrder}</td>

                      <td>
                        <span
                          className={
                            faq.isActive
                              ? "faq-admin-status active"
                              : "faq-admin-status inactive"
                          }
                        >
                          {faq.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>

                      <td>{formatTanggal(faq.updatedAt)}</td>

                      <td>
                        <div className="faq-admin-row-actions">
                          <button
                            type="button"
                            className="faq-admin-edit"
                            onClick={() => handleEdit(faq)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="faq-admin-toggle"
                            onClick={() => handleToggle(faq)}
                            disabled={busyId === faq.id}
                          >
                            {busyId === faq.id
                              ? "..."
                              : faq.isActive
                                ? "Nonaktifkan"
                                : "Aktifkan"}
                          </button>

                          <button
                            type="button"
                            className="faq-admin-delete"
                            onClick={() => handleDelete(faq)}
                            disabled={busyId === faq.id}
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
