"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import { defaultMenus, formatRupiah, type MenuCategory, type MenuItem, type MenuStatus } from "@/data/menus";
import { readStorage, STORAGE_KEYS, writeStorage } from "@/lib/storage";

const emptyForm = { name: "", category: "Makanan" as MenuCategory, price: "", status: "Tersedia" as MenuStatus, description: "", image: "" };

function makeSlug(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminMenuPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [menus, setMenus] = useState<MenuItem[]>(defaultMenus);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEYS.adminLogin) !== "true") {
      router.replace("/admin/login");
      return;
    }
    const saved = readStorage<MenuItem[]>(STORAGE_KEYS.menus, []);
    const initialMenus = saved.length > 0 ? saved : defaultMenus;
    setMenus(initialMenus);
    writeStorage(STORAGE_KEYS.menus, initialMenus);
    setReady(true);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (ready) writeStorage(STORAGE_KEYS.menus, menus);
  }, [menus, ready]);

  const filteredMenus = useMemo(() => menus.filter((menu) => {
    const matchesName = menu.name.toLowerCase().includes(search.toLowerCase().trim());
    const matchesCategory = filter === "Semua" || menu.category === filter;
    return matchesName && matchesCategory;
  }), [menus, search, filter]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  }

  function editMenu(menu: MenuItem) {
    setEditingId(menu.id);
    setForm({ name: menu.name, category: menu.category, price: String(menu.price), status: menu.status, description: menu.description, image: menu.image });
    setMessage("");
    document.getElementById("admin-menu-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("File harus berupa gambar.");
      return;
    }
    if (file.size > 1_000_000) {
      setMessage("Ukuran gambar maksimal 1 MB untuk penyimpanan browser.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, image: String(reader.result || current.image) }));
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || !Number.isFinite(price) || price <= 0) {
      setMessage("Nama menu dan harga yang valid wajib diisi.");
      return;
    }
    const slug = makeSlug(form.name);
    const duplicate = menus.some((item) => item.slug === slug && item.id !== editingId);
    if (duplicate) {
      setMessage("Nama menu tersebut sudah digunakan. Gunakan nama yang berbeda.");
      return;
    }

    if (editingId) {
      setMenus((current) => current.map((menu) => menu.id === editingId ? { ...menu, name: form.name.trim(), slug, category: form.category, price, status: form.status, description: form.description.trim(), image: form.image || "/images/menu-soto.jpeg" } : menu));
      setMessage("Menu berhasil diperbarui.");
    } else {
      const newMenu: MenuItem = { id: `menu-${Date.now()}`, slug, name: form.name.trim(), category: form.category, price, status: form.status, description: form.description.trim(), image: form.image || "/images/menu-soto.jpeg" };
      setMenus((current) => [...current, newMenu]);
      setMessage("Menu berhasil ditambahkan.");
    }
    setEditingId(null);
    setForm(emptyForm);
  }

  function deleteMenu(menu: MenuItem) {
    if (!window.confirm(`Hapus menu "${menu.name}"?`)) return;
    setMenus((current) => current.filter((item) => item.id !== menu.id));
    if (editingId === menu.id) resetForm();
  }

  if (loading) return <main className="sb-admin-loading">Memuat data menu…</main>;

  return (
    <div className="sb-admin-layout">
      <AdminSidebar />
      <main className="sb-admin-main">
        <header className="sb-admin-header"><div><p className="sb-admin-greeting">ADMINISTRASI</p><h1>Kelola Menu</h1><p>Tambah, perbarui, cari, dan ubah status menu yang ditampilkan kepada pelanggan.</p></div><span className="sb-admin-count">{menus.length} menu</span></header>
        <section className="sb-admin-panel sb-menu-management">
          <div className="sb-admin-panel-head"><div><h2>Daftar Menu</h2><p>Menu berstatus Tersedia muncul di halaman pelanggan.</p></div></div>
          <div className="sb-menu-toolbar"><input className="form-control" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama menu..." aria-label="Cari menu admin" /><select className="form-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter kategori"><option>Semua</option><option>Makanan</option><option>Minuman</option></select></div>
          <div className="table-responsive"><table className="table align-middle sb-admin-table"><thead><tr><th>Menu</th><th>Kategori</th><th>Harga</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filteredMenus.length === 0 ? <tr><td colSpan={5} className="text-center py-4">Menu tidak ditemukan.</td></tr> : filteredMenus.map((menu) => <tr key={menu.id}><td><div className="sb-admin-menu-cell"><span className="sb-admin-menu-thumb">{menu.image.startsWith("data:") ? <img src={menu.image} alt="" /> : <Image src={menu.image} alt="" fill sizes="64px" />}</span><span><strong>{menu.name}</strong><small>{menu.description}</small></span></div></td><td>{menu.category}</td><td>{formatRupiah(menu.price)}</td><td><span className={`sb-status ${menu.status === "Tersedia" ? "tersedia" : "habis"}`}>{menu.status}</span></td><td><div className="sb-menu-action"><button type="button" className="sb-admin-edit" onClick={() => editMenu(menu)}>Edit</button><button type="button" className="sb-admin-delete" onClick={() => deleteMenu(menu)}>Hapus</button></div></td></tr>)}</tbody></table></div>
        </section>

        <section className="sb-admin-panel sb-admin-form-panel" id="admin-menu-form">
          <div className="sb-admin-panel-head"><div><h2>{editingId ? "Edit Menu" : "Tambah Menu"}</h2><p>Data disimpan ke localStorage browser, tanpa server database.</p></div>{editingId && <button type="button" className="btn sb-btn-outline" onClick={resetForm}>Batal Edit</button>}</div>
          <form onSubmit={handleSubmit} className="sb-admin-menu-form">
            <div className="row g-3">
              <div className="col-12 col-lg-6"><label className="sb-cart-field"><span>Nama Menu</span><input className="form-control" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required placeholder="Contoh: Soto Betawi Spesial" /></label></div>
              <div className="col-12 col-sm-6 col-lg-3"><label className="sb-cart-field"><span>Kategori</span><select className="form-select" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as MenuCategory })}><option>Makanan</option><option>Minuman</option></select></label></div>
              <div className="col-12 col-sm-6 col-lg-3"><label className="sb-cart-field"><span>Harga (Rp)</span><input className="form-control" type="number" min="1" step="1000" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required placeholder="48000" /></label></div>
              <div className="col-12 col-sm-6"><label className="sb-cart-field"><span>Status</span><select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as MenuStatus })}><option>Tersedia</option><option>Habis</option></select></label></div>
              <div className="col-12 col-sm-6"><label className="sb-cart-field"><span>Gambar Menu (opsional)</span><input className="form-control" type="file" accept="image/*" onChange={chooseImage} /><small className="sb-input-help">Maksimal 1 MB. Gambar tersimpan di browser.</small></label></div>
              <div className="col-12"><label className="sb-cart-field"><span>Deskripsi</span><textarea className="form-control" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Deskripsi singkat menu" /></label></div>
            </div>
            {form.image && <div className="sb-admin-image-preview"><span>Pratinjau gambar</span>{form.image.startsWith("data:") ? <img src={form.image} alt="Pratinjau gambar menu" /> : <Image src={form.image} alt="Pratinjau gambar menu" width={180} height={120} />}</div>}
            {message && <p className={message.includes("berhasil") ? "sb-form-success" : "sb-form-error"} role="status">{message}</p>}
            <div className="sb-modal-actions"><button type="button" className="btn sb-btn-outline" onClick={resetForm}>Reset Form</button><button type="submit" className="btn sb-btn-primary">{editingId ? "Simpan Perubahan" : "Tambah Menu"}</button></div>
          </form>
        </section>
      </main>
    </div>
  );
}
