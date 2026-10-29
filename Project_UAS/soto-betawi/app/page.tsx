import Link from "next/link";
import HomeClient from "./components/HomeClient";
<HomeClient />
export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="container navbar">
          <a href="#home" className="brand">
            <span className="brand-mark">♨</span>
            <span className="brand-main">SOTO BETAWI</span>
            <span className="brand-accent">JAKARTA</span>
          </a>

          <nav className="main-nav" aria-label="Navigasi utama">
            <a className="active" href="#home">Home</a>
            <a href="#menu">Menu</a>
            <a href="#tentang">Tentang Kami</a>
            <a href="#lokasi">Lokasi</a>
          </nav>

          <div className="nav-actions">
            <a
              href="#menu"
              className="btn btn-primary btn-small"
              id="orderNow"
            >
              Pesan Sekarang
            </a>

            <div className="profile-wrapper">
              <Link
                href="/login"
                className="profile-toggle"
                aria-label="Masuk akun customer"
              >
                ♙
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
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
                Nikmati Soto Betawi dengan cita rasa khas Jakarta,
                dibuat dari bahan pilihan dan resep yang diwariskan
                dari generasi ke generasi.
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
        Berawal dari kedai sederhana di pinggiran Jakarta,
        kami mendedikasikan diri untuk melestarikan
        keaslian cita rasa masakan Betawi. Resep rahasia
        kaldu gurih berpadu rempah-rempah alami terus
        kami jaga demi memanjakan lidah para penikmat
        kuliner sejati.
      </p>

      <p>
        Kami percaya bahwa makanan yang lezat lahir dari
        kesabaran dan kecintaan. Setiap potongan daging
        sapi pilihan dimasak perlahan hingga empuk
        sempurna, disajikan hangat dengan siraman kuah
        santan dan susu yang kaya rasa, menyatukan
        tradisi dan kenyamanan modern.
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

<HomeClient />

      </main>
    </>
  );
}
