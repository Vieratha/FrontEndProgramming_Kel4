"use client";

import { useEffect, useState } from "react";

const navigationItems = [
  { id: "home", label: "Home" },
  { id: "tentang", label: "Tentang Kami" },
  { id: "menu", label: "Menu" },
  { id: "lokasi", label: "Lokasi" },
];

export default function MainNavigation() {
  const [activeSection, setActiveSection] = useState("home");

  // MEMANTAU BAGIAN HALAMAN YANG SEDANG DILIHAT
  useEffect(() => {
    const sections = navigationItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

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
