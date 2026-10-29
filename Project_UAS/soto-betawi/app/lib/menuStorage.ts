
export type Menu = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: "Makanan" | "Minuman";
  image: string;
  status?: "Tersedia" | "Habis";
};

export const MENU_KEY = "soto-betawi-menus";

export const defaultMenus: Menu[] = [
  {
    id: 1,
    name: "Soto Betawi",
    description: "Soto khas Betawi dengan kuah gurih.",
    price: 35000,
    category: "Makanan",
    image: "/images/menu-soto.jpeg",
    status: "Tersedia",
  },
  {
    id: 2,
    name: "Kerak Telor",
    description: "Makanan tradisional khas Betawi.",
    price: 25000,
    category: "Makanan",
    image: "/images/menu-kerak-telor.jpeg",
    status: "Tersedia",
  },
  {
    id: 3,
    name: "Nasi Uduk",
    description: "Nasi gurih dengan lauk pilihan.",
    price: 28000,
    category: "Makanan",
    image: "/images/menu-nasi-uduk.jpeg",
    status: "Tersedia",
  },
  {
    id: 4,
    name: "Bir Pletok",
    description: "Minuman rempah tradisional Betawi.",
    price: 15000,
    category: "Minuman",
    image: "/images/menu-bir-pletok.jpeg",
    status: "Tersedia",
  },
];

export function getMenus(): Menu[] {
  if (typeof window === "undefined") {
    return defaultMenus;
  }

  try {
    const saved = localStorage.getItem(MENU_KEY);

    if (saved !== null) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed.map((menu: Menu) => ({
          ...menu,
          status: menu.status ?? "Tersedia",
        }));
      }
    }
  } catch (error) {
    console.error("Gagal membaca menu:", error);
  }

  return defaultMenus;
}

export function saveMenus(menus: Menu[]): boolean {
  try {
    localStorage.setItem(
      MENU_KEY,
      JSON.stringify(menus)
    );

    window.dispatchEvent(new Event("menu-updated"));
    return true;
  } catch (error) {
    console.error("Gagal menyimpan menu:", error);
    return false;
  }
}
