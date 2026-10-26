export const STORAGE_KEYS = {
  menus: "sotoBetawiMenus",
  cart: "sotoBetawiCart",
  orders: "sotoBetawiOrders",
  users: "sotoBetawiUsers",
  userLogin: "sotoBetawiUserLogin",
  adminLogin: "sotoBetawiAdminLogin",
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Penyimpanan lokal mungkin tidak tersedia dalam mode privat atau browser tertentu.
  }
}
