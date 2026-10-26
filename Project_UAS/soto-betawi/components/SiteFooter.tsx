import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="sb-footer">
      <div className="container sb-footer-grid">
        <div className="sb-footer-about">
          <Link href="/" className="sb-brand sb-brand-footer">
            <span className="sb-brand-mark" aria-hidden="true">♨</span>
            <span className="sb-brand-main">SOTO BETAWI</span>
          </Link>
          <p>Warisan kuliner asli Betawi dengan resep turun-temurun, bahan pilihan, dan suasana hangat.</p>
        </div>
        <div className="sb-footer-column">
          <h3>MENU</h3>
          <a href="/#menu">Soto Betawi Spesial</a>
          <a href="/#menu">Nasi Uduk</a>
          <a href="/#menu">Kerak Telor</a>
          <a href="/#menu">Bir Pletok</a>
        </div>
        <div className="sb-footer-column">
          <h3>LOKASI GERAI</h3>
          <a href="/#lokasi">Menteng</a>
          <a href="/#lokasi">Kemang</a>
        </div>
        <div className="sb-footer-column">
          <h3>JAM OPERASIONAL</h3>
          <p>Setiap Hari: 10:00–22:00</p>
          <h3 className="sb-footer-subtitle">HUBUNGI LAYANAN</h3>
          <a href="tel:+62811999787">+62 811 999 787</a>
        </div>
        <div className="sb-footer-column">
          <h3>IKUTI KAMI</h3>
          <div className="sb-socials"><a href="#footer" aria-label="Instagram">◎</a><a href="#footer" aria-label="TikTok">♪</a><a href="#footer" aria-label="Facebook">f</a></div>
        </div>
      </div>
      <div className="container sb-footer-bottom">
        <span>© 2026 Soto Betawi Jakarta.</span>
        <span>Melestarikan Tradisi, Menghidupkan Memori.</span>
      </div>
    </footer>
  );
}
