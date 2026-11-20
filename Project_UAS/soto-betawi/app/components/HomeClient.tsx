"use client";

import { useState } from "react";
import MenuSection from "./MenuSection";

export default function HomeClient() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  return (
    <>
      {/* MENU ANDALAN DAN KERANJANG */}
      <MenuSection
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        onCartCountChange={setTotalItems}
      />

      <button
        type="button"
        className="floating-cart"
        onClick={() => setIsCartOpen(true)}
        aria-label={`Buka keranjang, ${totalItems} item`}
      >
        <svg
          viewBox="0 0 24 24"
          width="25"
          height="25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 8H6" />
          <circle cx="10" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
        </svg>

        <span className="floating-cart-count">{totalItems}</span>
      </button>
    </>
  );
}
