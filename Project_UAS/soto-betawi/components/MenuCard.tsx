import Image from "next/image";
import Link from "next/link";
import type { MenuItem } from "@/data/menus";
import { formatRupiah } from "@/data/menus";

type Props = {
  menu: MenuItem;
  favorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (menu: MenuItem) => void;
};

export default function MenuCard({ menu, favorite, onToggleFavorite, onAddToCart }: Props) {
  const imageIsUploaded = menu.image.startsWith("data:");

  return (
    <article className="sb-menu-card h-100">
      <Link className="sb-menu-photo" href={`/menu/${menu.slug}`} aria-label={`Lihat detail ${menu.name}`}>
        {imageIsUploaded ? (
          // Gambar yang diunggah admin tersimpan sebagai data URL di localStorage.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={menu.image} alt={menu.name} />
        ) : (
          <Image src={menu.image} alt={menu.name} fill sizes="(max-width: 560px) 100vw, (max-width: 992px) 50vw, 33vw" />
        )}
        <span className="sb-menu-category">{menu.category}</span>
      </Link>
      <div className="sb-menu-body">
        <Link href={`/menu/${menu.slug}`} className="sb-menu-title"><h3>{menu.name}</h3></Link>
        <p>{menu.description}</p>
        <div className="sb-menu-bottom">
          <strong>{formatRupiah(menu.price)}</strong>
          <div className="sb-menu-actions">
            <button type="button" className={`sb-favorite-btn ${favorite ? "is-favorite" : ""}`} onClick={() => onToggleFavorite(menu.id)} aria-pressed={favorite} aria-label={favorite ? `Hapus ${menu.name} dari favorit` : `Tandai ${menu.name} sebagai favorit`}>
              {favorite ? "♥" : "♡"}
            </button>
            <button type="button" className="sb-add-btn" onClick={() => onAddToCart(menu)} aria-label={`Tambah ${menu.name} ke keranjang`}>+</button>
          </div>
        </div>
      </div>
    </article>
  );
}
