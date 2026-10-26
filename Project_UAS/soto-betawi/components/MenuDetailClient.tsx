"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { MenuItem } from "@/data/menus";
import { formatRupiah } from "@/data/menus";
import { readStorage, STORAGE_KEYS } from "@/lib/storage";

type Props = { slug: string; initialMenu: MenuItem | null };

export default function MenuDetailClient({ slug, initialMenu }: Props) {
  const [menu, setMenu] = useState<MenuItem | null>(initialMenu);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedMenus = readStorage<MenuItem[]>(STORAGE_KEYS.menus, []);
    const savedMenu = savedMenus.find((item) => item.slug === slug);
    if (savedMenu) setMenu(savedMenu);
    setLoaded(true);
  }, [slug]);

  if (!loaded) return <main className="sb-detail-page"><div className="container">Memuat detail menu…</div></main>;
  if (!menu) return <main className="sb-detail-page"><div className="container"><Link href="/#menu" className="sb-back-web">← Kembali ke menu</Link><section className="sb-detail-card"><div className="sb-detail-copy"><p className="sb-pill-label">MENU TIDAK DITEMUKAN</p><h1>Menu belum tersedia</h1><p>Menu ini mungkin sudah dihapus atau alamatnya tidak ditemukan.</p><Link href="/#menu" className="btn sb-btn-primary">Kembali ke menu</Link></div></section></div></main>;

  return (
    <main className="sb-detail-page">
      <div className="container">
        <Link href="/#menu" className="sb-back-web">← Kembali ke menu</Link>
        <section className="sb-detail-card">
          <div className="sb-detail-photo">
            {menu.image.startsWith("data:") ? (
              // Gambar unggahan admin disimpan sebagai data URL pada demo browser.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={menu.image} alt={menu.name} />
            ) : <Image src={menu.image} alt={menu.name} fill sizes="(max-width: 820px) 100vw, 50vw" priority />}
          </div>
          <div className="sb-detail-copy"><p className="sb-pill-label">{menu.category.toUpperCase()}</p><h1>{menu.name}</h1><p>{menu.description}</p><strong className="sb-detail-price">{formatRupiah(menu.price)}</strong><p className="sb-detail-note">Status menu: {menu.status}. Pesanan dapat dibuat melalui keranjang pada halaman utama.</p><Link href="/#menu" className="btn sb-btn-primary">Pilih dari menu <span aria-hidden="true">→</span></Link></div>
        </section>
      </div>
    </main>
  );
}
