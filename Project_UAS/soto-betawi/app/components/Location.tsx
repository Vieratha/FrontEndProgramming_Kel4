export default function Location() {
  return (
    /* INI BAGIAN LOKASI RESTORAN */
    <section className="location-section" id="lokasi">
      <div className="container">
        {/* INI BAGIAN HEADER LOKASI */}
        <div className="location-heading">
          <h2>Temukan Kami</h2>

          <p className="location-description">
            Kunjungi cabang terdekat di Jakarta untuk menikmati soto hangat
            langsung di tempat.
          </p>
        </div>

        {/* INI BAGIAN DAFTAR CABANG RESTORAN */}
        <div className="location-grid">
          {/* CABANG MENTENG */}
          <div className="location-card">
            <img
              src="/images/map-menteng.jpeg"
              alt="Peta lokasi Menteng"
              className="location-map"
            />

            <div className="location-info">
              <h3>Menteng, Jakarta Pusat</h3>

              <p>
                Jl. Teuku Umar No. 12, Menteng, Kec. Menteng, Kota Jakarta
                Pusat, 10310
              </p>

              <div className="location-details">
                <p>◷ Buka Setiap Hari: 10:00 – 22:00</p>
                <p>☎ +62 21 390-1234</p>
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Jl+Teuku+Umar+No+12+Menteng+Jakarta"
                target="_blank"
                rel="noopener noreferrer"
                className="location-link"
              >
                Lihat di Peta ↗
              </a>
            </div>
          </div>

          {/* CABANG KEMANG */}
          <div className="location-card">
            <img
              src="/images/map-kemang.jpeg"
              alt="Peta lokasi Kemang"
              className="location-map"
            />

            <div className="location-info">
              <h3>Kemang, Jakarta Selatan</h3>

              <p>
                Jl. Kemang Raya No. 45B, Bangka, Mampang Prapatan, Jakarta
                Selatan, 12730
              </p>

              <div className="location-details">
                <p>◷ Buka Setiap Hari: 10:00 – 22:00</p>
                <p>☎ +62 21 719-5678</p>
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Jl+Kemang+Raya+No+45B+Jakarta"
                target="_blank"
                rel="noopener noreferrer"
                className="location-link"
              >
                Lihat di Peta ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
