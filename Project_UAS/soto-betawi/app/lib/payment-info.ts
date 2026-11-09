/* INI BAGIAN KONFIGURASI PEMBAYARAN SOTO BETAWI */

// Informasi ini ditampilkan kepada customer.
// Jangan menyimpan PIN, OTP, password, atau kredensial bank di sini.

export const PAYMENT_INFO = {
  // INI BAGIAN INFORMASI QRIS
  qris: {
    merchantName: "Soto Betawi Jakarta",
    imagePath: "",
  },

  // INI BAGIAN INFORMASI TRANSFER BANK
  bankTransfer: {
    bankName: "",
    accountNumber: "",
    accountName: "",
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
