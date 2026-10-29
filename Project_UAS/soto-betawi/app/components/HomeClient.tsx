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

      {/* TOMBOL KERANJANG MENGAMBANG */}
      <button
        type="button"
        className="floating-cart"
        onClick={() => setIsCartOpen(true)}
        aria-label={`Buka keranjang, ${totalItems} item`}
      >
        🛒
        <span className="floating-cart-count">
          {totalItems}
        </span>
      </button>
    </>
  );
}
