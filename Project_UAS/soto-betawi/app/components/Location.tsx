"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// INI BAGIAN TIPE DATA LOKASI CUSTOMER
type LocationItem = {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  openingHours: string;
  imagePath: string;
  mapUrl: string | null;
  sortOrder: number;
};

// INI BAGIAN KOMPONEN LOKASI CUSTOMER
export default function Location() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // INI BAGIAN MENGAMBIL LOKASI AKTIF DARI DATABASE
  useEffect(() => {
    let ignore = false;

    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/locations", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Gagal mengambil lokasi.");
        }

        if (!ignore) {
          setLocations(Array.isArray(data.locations) ? data.locations : []);
          setError(false);
        }
      } catch (err) {
        console.error("Location Customer error:", err);

        if (!ignore) {
          setLocations([]);
          setError(true);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchLocations();

    return () => {
      ignore = true;
    };
  }, []);

  // INI BAGIAN MEMBUAT LINK GOOGLE MAPS
  const getMapUrl = (location: LocationItem) => {
    if (location.mapUrl) {
      return location.mapUrl;
    }

    const searchQuery = [location.name, location.address, location.city].join(
      " ",
    );

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      searchQuery,
    )}`;
  };

  return (
    <section className="location-section" id="lokasi">
      <div className="location-container">
        {/* INI BAGIAN HEADER LOKASI */}
        <div className="location-heading">
          <span className="location-badge">Kunjungi Kami</span>

          <h2>Temukan Cabang Terdekat</h2>

          <p>
            Nikmati kehangatan Soto Betawi Jakarta dengan mengunjungi cabang
            kami.
          </p>
        </div>

        {/* INI BAGIAN STATUS PEMUATAN */}
        {loading && (
          <div className="location-message">Memuat informasi lokasi...</div>
        )}

        {/* INI BAGIAN PESAN ERROR */}
        {!loading && error && (
          <div className="location-message">
            Informasi lokasi belum dapat dimuat. Silakan coba beberapa saat
            lagi.
          </div>
        )}

        {/* INI BAGIAN JIKA BELUM ADA LOKASI AKTIF */}
        {!loading && !error && locations.length === 0 && (
          <div className="location-message">
            Informasi cabang sedang diperbarui. Silakan kunjungi kembali halaman
            ini nanti.
          </div>
        )}

        {/* INI BAGIAN DAFTAR CABANG RESTORAN */}
        {!loading && !error && locations.length > 0 && (
          <div className="location-grid">
            {locations.map((location) => (
              <article key={location.id} className="location-card">
                {/* INI BAGIAN GAMBAR PETA */}
                <div className="location-image-wrap">
                  <Image
                    src={location.imagePath}
                    alt={`Peta ${location.name}`}
                    width={800}
                    height={600}
                    unoptimized
                    className="location-map"
                  />
                </div>

                {/* INI BAGIAN INFORMASI CABANG */}
                <div className="location-info">
                  <span className="location-city">{location.city}</span>

                  <h3>{location.name}</h3>

                  {/* INI BAGIAN ALAMAT */}
                  <div className="location-detail">
                    <span className="location-detail-icon">📍</span>

                    <p>{location.address}</p>
                  </div>

                  {/* INI BAGIAN JAM OPERASIONAL */}
                  <div className="location-detail">
                    <span className="location-detail-icon">◷</span>

                    <p>{location.openingHours}</p>
                  </div>

                  {/* INI BAGIAN NOMOR TELEPON */}
                  {location.phone && (
                    <div className="location-detail">
                      <span className="location-detail-icon">☎</span>

                      <p>{location.phone}</p>
                    </div>
                  )}

                  {/* INI BAGIAN TOMBOL GOOGLE MAPS */}
                  <a
                    href={getMapUrl(location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-link"
                  >
                    Lihat Rute di Google Maps ↗
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
