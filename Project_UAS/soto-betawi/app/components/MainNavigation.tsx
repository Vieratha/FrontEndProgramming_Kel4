"use client";

import { useCallback, useEffect, useState } from "react";

const navigationItems = [
  { id: "home", label: "Home" },
  { id: "tentang", label: "Tentang Kami" },
  { id: "menu", label: "Menu" },
  { id: "lokasi", label: "Lokasi" },
];

export default function MainNavigation() {
  const [activeSection, setActiveSection] = useState("home");

  // MEMERIKSA BAGIAN HALAMAN YANG SEDANG DILIHAT
  const updateActiveSection = useCallback(() => {
    const activationPosition = window.scrollY + 130;
    let currentSection = "home";

    for (const item of navigationItems) {
      const section = document.getElementById(item.id);

      if (!section) continue;

      const sectionTop = section.getBoundingClientRect().top + window.scrollY;

      if (activationPosition >= sectionTop) {
        currentSection = item.id;
      } else {
        break;
      }
    }

    setActiveSection(currentSection);
  }, []);

  // MEMANTAU SCROLL DAN PERUBAHAN UKURAN LAYAR
  useEffect(() => {
    let animationFrame = 0;

    const handleScroll = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(() => {
        updateActiveSection();
      });
    };

    // MEMPERBARUI STATUS AKTIF SETELAH BROWSER SIAP
    animationFrame = window.requestAnimationFrame(() => {
      updateActiveSection();
    });

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [updateActiveSection]);

  return (
    <nav className="main-nav" aria-label="Navigasi utama">
      {navigationItems.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={activeSection === item.id ? "active" : ""}
          aria-current={activeSection === item.id ? "location" : undefined}
          onClick={() => setActiveSection(item.id)}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
