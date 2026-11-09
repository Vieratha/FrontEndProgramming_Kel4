/* INI BAGIAN KONFIGURASI PEMBAYARAN SOTO BETAWI */

// Informasi ini ditampilkan kepada customer.
// Jangan menyimpan PIN, OTP, password, atau kredensial bank di sini.

export const PAYMENT_INFO = {
  // INI BAGIAN INFORMASI QRIS
  qris: {
    merchantName: "Soto Betawi Jakarta",
    imagePath: "/images/qris-soto-betawi.jpeg",
  },

  // INI BAGIAN INFORMASI TRANSFER BANK
  bankTransfer: {
    bankName: "BCA",
    accountNumber: "49519991863",
    accountName: "Soto Betawi Jakarta",
  },
};

// INI BAGIAN MEMERIKSA KELENGKAPAN METODE PEMBAYARAN
export const PAYMENT_AVAILABILITY = {
  qris: Boolean(PAYMENT_INFO.qris.imagePath.trim()),

  bankTransfer: Boolean(
    PAYMENT_INFO.bankTransfer.bankName.trim() &&
    PAYMENT_INFO.bankTransfer.accountNumber.trim() &&
    PAYMENT_INFO.bankTransfer.accountName.trim(),
  ),
};
