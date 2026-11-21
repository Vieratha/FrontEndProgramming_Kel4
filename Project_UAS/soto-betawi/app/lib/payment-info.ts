/* Konfigurasi pembayaran restoran. */
export const PAYMENT_INFO = {
  // Informasi QRIS.
  qris: {
    merchantName: "Soto Betawi Jakarta",
    imagePath: "/images/qris-soto-betawi.jpeg",
  },

  // Informasi transfer bank.
  bankTransfer: {
    bankName: "BCA",
    accountNumber: "49519991863",
    accountName: "Soto Betawi Jakarta",
  },
};

// Memeriksa metode pembayaran yang sudah dikonfigurasi.
export const PAYMENT_AVAILABILITY = {
  qris: Boolean(PAYMENT_INFO.qris.imagePath.trim()),

  bankTransfer: Boolean(
    PAYMENT_INFO.bankTransfer.bankName.trim() &&
    PAYMENT_INFO.bankTransfer.accountNumber.trim() &&
    PAYMENT_INFO.bankTransfer.accountName.trim(),
  ),
};
