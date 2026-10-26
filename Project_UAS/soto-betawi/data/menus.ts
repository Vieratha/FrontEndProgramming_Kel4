export type MenuCategory = "Makanan" | "Minuman";
export type MenuStatus = "Tersedia" | "Habis";

export type MenuItem = {
  id: string;
  slug: string;
  name: string;
  category: MenuCategory;
  price: number;
  status: MenuStatus;
  description: string;
  image: string;
};

// Data awal menu diambil dari project UTS Soto Betawi.
export const defaultMenus: MenuItem[] = [
  {
    id: "soto-betawi",
    slug: "soto-betawi-spesial",
    name: "Soto Betawi Spesial",
    category: "Makanan",
    price: 48000,
    status: "Tersedia",
    description: "Soto Betawi khas Jakarta dengan kuah gurih, rempah pilihan, dan daging sapi yang empuk.",
    image: "/images/menu-soto.jpeg",
  },
  {
    id: "nasi-uduk",
    slug: "nasi-uduk",
    name: "Nasi Uduk",
    category: "Makanan",
    price: 35000,
    status: "Tersedia",
    description: "Nasi uduk harum dengan lauk dan pelengkap khas Betawi.",
    image: "/images/menu-nasi-uduk.jpeg",
  },
  {
    id: "kerak-telor",
    slug: "kerak-telor",
    name: "Kerak Telor",
    category: "Makanan",
    price: 28000,
    status: "Tersedia",
    description: "Jajanan tradisional Betawi dengan telur, beras ketan, dan serundeng.",
    image: "/images/menu-kerak-telor.jpeg",
  },
  {
    id: "bir-pletok",
    slug: "bir-pletok",
    name: "Bir Pletok",
    category: "Minuman",
    price: 18000,
    status: "Tersedia",
    description: "Minuman tradisional Betawi dengan rempah-rempah yang hangat dan harum.",
    image: "/images/menu-bir-pletok.jpeg",
  },
];

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
