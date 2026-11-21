import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="sb-footer">
      <div className="sb-footer-container">
        <div className="sb-footer-main">
          {/* IDENTITAS RESTORAN */}
          <div className="sb-footer-brand-column">
            <a
              href="#home"
              className="sb-footer-brand"
              aria-label="Soto Betawi Jakarta - Beranda"
            >
              <Image
                src="/images/logo-soto-betawi.png"
                alt=""
                width={48}
                height={48}
                className="sb-footer-logo"
              />

              <span className="sb-footer-wordmark">
                <span>SOTO BETAWI</span>
                <span className="sb-footer-brand-accent">JAKARTA</span>
              </span>
            </a>

            <p className="sb-footer-description">
              Menyajikan cita rasa autentik Betawi dengan bahan pilihan dan
              resep yang diwariskan dari generasi ke generasi. Menghadirkan
              kehangatan dalam setiap suapan.
            </p>
          </div>

          {/* NAVIGASI */}
          <div className="sb-footer-link-column">
            <h2 className="sb-footer-section-title">Jelajahi</h2>

            <nav aria-label="Navigasi footer">
              <ul className="sb-footer-link-list">
                <li>
                  <a href="#home">Beranda</a>
                </li>
                <li>
                  <a href="#tentang">Tentang Kami</a>
                </li>
                <li>
                  <a href="#menu">Menu</a>
                </li>
                <li>
                  <a href="#lokasi">Lokasi</a>
                </li>
              </ul>
            </nav>
          </div>

          {/* AJAKAN CUSTOMER */}
          <div className="sb-footer-visit-column">
            <h2 className="sb-footer-section-title">Nikmati Sajian Kami</h2>

            <p className="sb-footer-visit-description">
              Temukan menu favoritmu dan kunjungi cabang Soto Betawi Jakarta
              untuk menikmati hidangan khas Betawi.
            </p>

            <div className="sb-footer-action-group">
              <a href="#menu" className="sb-footer-primary-button">
                Lihat Menu
                <span aria-hidden="true">→</span>
              </a>

              <a href="#lokasi" className="sb-footer-secondary-button">
                Temukan Lokasi
              </a>
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="sb-footer-bottom">
          <p>© {currentYear} Soto Betawi Jakarta. Hak cipta dilindungi.</p>

          <a href="#home" className="sb-footer-back-to-top">
            Kembali ke atas
            <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
