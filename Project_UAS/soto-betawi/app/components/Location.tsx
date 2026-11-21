"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Data lokasi yang ditampilkan kepada customer.
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

export default function Location() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Mengambil daftar lokasi aktif dari database.
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

  // Membuat link Google Maps jika lokasi belum memiliki URL khusus.
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
        <div className="location-heading">
          <span className="location-badge">Kunjungi Kami</span>

          <h2>Temukan Cabang Terdekat</h2>

          <p>
            Nikmati kehangatan Soto Betawi Jakarta dengan mengunjungi cabang
            kami.
          </p>
        </div>

        {loading && (
          <div className="location-message">Memuat informasi lokasi...</div>
        )}

        {!loading && error && (
          <div className="location-message">
            Informasi lokasi belum dapat dimuat. Silakan coba beberapa saat
            lagi.
          </div>
        )}

        {!loading && !error && locations.length === 0 && (
          <div className="location-message">
            Informasi cabang sedang diperbarui. Silakan kunjungi kembali halaman
            ini nanti.
          </div>
        )}

        {/* Daftar cabang restoran */}
        {!loading && !error && locations.length > 0 && (
          <div className="location-grid">
            {locations.map((location) => (
              <article key={location.id} className="location-card">
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

                <div className="location-info">
                  <span className="location-city">{location.city}</span>

                  <h3>{location.name}</h3>

                  <div className="location-detail">
                    <span className="location-detail-icon">📍</span>

                    <p>{location.address}</p>
                  </div>

                  <div className="location-detail">
                    <span className="location-detail-icon">◷</span>

                    <p>{location.openingHours}</p>
                  </div>

                  {location.phone && (
                    <div className="location-detail">
                      <span className="location-detail-icon">☎</span>

                      <p>{location.phone}</p>
                    </div>
                  )}

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
