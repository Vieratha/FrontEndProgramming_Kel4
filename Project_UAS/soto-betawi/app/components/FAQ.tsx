"use client";

import { useEffect, useState } from "react";

// INI BAGIAN TIPE DATA FAQ CUSTOMER
type FaqItem = {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
};

// INI BAGIAN KOMPONEN FAQ CUSTOMER
export default function FAQ() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // INI BAGIAN MENGAMBIL FAQ AKTIF DARI DATABASE
  useEffect(() => {
    let ignore = false;

    const fetchFaqs = async () => {
      try {
        const response = await fetch("/api/faq", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Gagal mengambil FAQ.");
        }

        if (!ignore) {
          setFaqs(Array.isArray(data.faqs) ? data.faqs : []);
        }
      } catch (error) {
        console.error("FAQ Customer error:", error);

        if (!ignore) {
          setFaqs([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchFaqs();

    return () => {
      ignore = true;
    };
  }, []);

  // INI BAGIAN MENYEMBUNYIKAN FAQ JIKA BELUM ADA DATA
  if (loading || faqs.length === 0) {
    return null;
  }

  return (
    <section id="faq" className="faq-section">
      {/* INI BAGIAN HEADER FAQ */}
      <div className="faq-header">
        <span className="faq-badge">Pertanyaan Umum</span>

        <h2 className="faq-title">Pertanyaan yang Sering Ditanyakan</h2>

        <p className="faq-subtitle">
          Temukan jawaban atas pertanyaan umum seputar menu, lokasi, dan layanan
          Soto Betawi Jakarta.
        </p>
      </div>

      {/* INI BAGIAN DAFTAR FAQ */}
      <div className="faq-list">
        {faqs.map((item) => {
          const open = openIndex === item.id;

          return (
            <div key={item.id} className="faq-item">
              {/* INI BAGIAN TOMBOL PERTANYAAN */}
              <button
                type="button"
                className="faq-trigger"
                onClick={() => setOpenIndex(open ? null : item.id)}
                aria-expanded={open}
                aria-controls={`faq-panel-${item.id}`}
              >
                {item.question}

                <span
                  className={`faq-icon ${open ? "is-open" : ""}`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>

              {/* INI BAGIAN JAWABAN FAQ */}
              <div
                id={`faq-panel-${item.id}`}
                className={`faq-panel ${open ? "is-open" : ""}`}
              >
                <div className="faq-panel-inner">
                  <p className="faq-answer">{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
