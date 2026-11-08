import HomeClient from "./components/HomeClient";
import CustomerProfile from "./components/CustomerProfile";
import { getCurrentUser } from "./lib/auth";

export default async function Home() {
  // INI BAGIAN MENGAMBIL DATA USER DARI SESSION PRISMA
  const user = await getCurrentUser();

  return (
    <>
      {/* INI BAGIAN HEADER DAN NAVBAR */}
      <header className="site-header">
        <div className="container navbar">
          <a href="#home" className="brand">
            <span className="brand-mark">♨</span>
            <span className="brand-main">SOTO BETAWI</span>
            <span className="brand-accent">JAKARTA</span>
          </a>

          {/* INI BAGIAN NAVIGASI UTAMA */}
          <nav className="main-nav" aria-label="Navigasi utama">
            <a className="active" href="#home">
              Home
            </a>

            <a href="#menu">Menu</a>
            <a href="#tentang">Tentang Kami</a>
            <a href="#lokasi">Lokasi</a>
          </nav>

          {/* INI BAGIAN AKSI NAVBAR */}
          <div className="nav-actions">
            <a href="#menu" className="btn btn-primary btn-small" id="orderNow">
              Pesan Sekarang
            </a>

            <CustomerProfile user={user} />
          </div>
        </div>
      </header>

      <main>
        {/* INI BAGIAN HERO SECTION */}
        <section className="hero" id="home">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">WARISAN KULINER</p>

              <h1>
                Rasa Asli Betawi,
                <br />
                <span>Hangat</span> di Setiap
                <br />
                Suapan
              </h1>

              <p className="hero-description">
                Nikmati Soto Betawi dengan cita rasa khas Jakarta, dibuat dari
                bahan pilihan dan resep yang diwariskan dari generasi ke
                generasi.
              </p>

              <div className="hero-actions">
                <a className="btn btn-primary" href="#menu">
                  Lihat Menu <span>›</span>
                </a>

                <a className="btn btn-outline" href="#lokasi">
                  Temukan Lokasi
                </a>
              </div>
            </div>

            <div className="hero-image-wrap">
              <img
                src="/images/hero-soto.jpeg"
                alt="Soto Betawi"
                className="hero-image"
              />
            </div>
          </div>
        </section>

        {/* INI BAGIAN TENTANG KAMI */}
        <section className="about section-cream" id="tentang">
          <div className="container about-grid">
            <div className="about-image-wrap decorative-frame">
              <img
                src="/images/tentang-betawi.jpeg"
                alt="Tradisi kuliner Betawi"
                className="about-image"
              />
            </div>

            <div className="about-copy">
              <p className="eyebrow">WARISAN KULINER BETAWI</p>

              <h2>Cita Rasa Otentik Sejak 1980</h2>

              <p>
                Berawal dari kedai sederhana di pinggiran Jakarta, kami
                mendedikasikan diri untuk melestarikan keaslian cita rasa
                masakan Betawi. Resep rahasia kaldu gurih berpadu rempah-rempah
                alami terus kami jaga demi memanjakan lidah para penikmat
                kuliner sejati.
              </p>

              <p>
                Kami percaya bahwa makanan yang lezat lahir dari kesabaran dan
                kecintaan. Setiap potongan daging sapi pilihan dimasak perlahan
                hingga empuk sempurna, disajikan hangat dengan siraman kuah
                santan dan susu yang kaya rasa, menyatukan tradisi dan
                kenyamanan modern.
              </p>

              <div className="about-stats">
                <div className="stat">
                  <strong>46+</strong>
                  <span>Tahun Warisan Rasa</span>
                </div>

                <div className="stat">
                  <strong>20+</strong>
                  <span>Rempah Pilihan</span>
                </div>

                <blockquote>
                  “Melestarikan Tradisi, Menghidupkan Memori.”
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* INI BAGIAN MENU DAN KERANJANG */}
        <HomeClient />
      </main>
    </>
  );
}
