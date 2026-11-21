# Soto Betawi Jakarta

Website pemesanan dan pengelolaan restoran Soto Betawi Jakarta yang dikembangkan sebagai proyek UAS Front-End Programming. Aplikasi ini menyediakan halaman pelanggan untuk melihat menu dan melakukan pemesanan, serta dashboard administrator untuk mengelola menu, pesanan, pembayaran, pengguna, FAQ, dan lokasi cabang.

## Fitur Aplikasi

### 1. Halaman Customer

- Halaman utama dengan informasi restoran dan navigasi.
- Menampilkan daftar menu dari database.
- Pencarian dan filter kategori makanan dan minuman.
- Keranjang belanja dengan pengaturan jumlah item.
- Fitur favorit menu yang tersimpan pada akun pengguna.
- Informasi lokasi cabang, jam operasional, dan Google Maps.
- FAQ yang dikelola melalui dashboard admin.

### 2. Pemesanan dan Pembayaran

- Checkout dengan pilihan makan di tempat atau dibawa pulang.
- Pengisian informasi pemesan, nomor meja, dan catatan pesanan.
- Pembayaran melalui kasir, QRIS, atau transfer bank.
- Pengiriman bukti pembayaran dalam format JPG, PNG, atau WebP.
- Verifikasi dan penolakan bukti pembayaran oleh administrator.
- Halaman konfirmasi dan riwayat pesanan.
- Pemantauan status pesanan dan pembayaran.

Pembayaran QRIS dan transfer bank menggunakan proses verifikasi manual oleh administrator, bukan integrasi payment gateway otomatis.

### 3. Akun Customer

- Registrasi dan login.
- Menu profil pengguna.
- Halaman informasi akun.
- Daftar menu favorit.
- Riwayat pesanan.
- Penggantian password.

### 4. Dashboard Administrator

- Ringkasan statistik pesanan dan pendapatan.
- Informasi pesanan terbaru dan menu terlaris.
- Pengelolaan menu (tambah, edit, dan hapus).
- Pengelolaan pesanan dan status prosesnya.
- Verifikasi pembayaran dan pemeriksaan bukti transaksi.
- Pengelolaan pengguna dan hak akses.
- Pengelolaan FAQ.
- Pengelolaan lokasi cabang.
- Unggah gambar untuk menu dan lokasi.

## Teknologi yang Digunakan

- Next.js 16
- React 19
- TypeScript
- CSS
- PostgreSQL
- Prisma ORM 7
- Node.js
- bcryptjs untuk hashing password

## Struktur Folder

```text
soto-betawi/
├── app/
│   ├── admin/
│   │   ├── faq/
│   │   ├── lokasi/
│   │   ├── menu/
│   │   ├── pesanan/
│   │   └── users/
│   ├── akun/
│   │   └── keamanan/
│   ├── api/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── favorites/
│   │   ├── locations/
│   │   ├── menus/
│   │   ├── orders/
│   │   └── ...
│   ├── checkout/
│   ├── components/
│   ├── konfirmasi/
│   ├── login/
│   ├── register/
│   ├── riwayat/
│   ├── lib/
│   ├── globals.css
│   └── page.tsx
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   ├── seed.ts
│   └── seed-admin.ts
├── public/
│   └── images/
├── package.json
├── package-lock.json
├── prisma.config.ts
└── README.md
```

## Persyaratan

Sebelum menjalankan aplikasi, pastikan perangkat sudah memiliki:

- Node.js dan npm.
- PostgreSQL atau layanan database PostgreSQL.
- Git untuk mengambil source code.

## Instalasi dan Konfigurasi

### 1. Clone Repository

```bash
git clone https://github.com/Vieratha/FrontEndProgramming_Kel4.git
```

Masuk ke direktori proyek:

```bash
cd FrontEndProgramming_Kel4/Project_UAS/soto-betawi
```

### 2. Instal Dependency

```bash
npm install
```

### 3. Konfigurasi Environment Variable

Buat file `.env` di direktori utama proyek dan isi dengan konfigurasi berikut:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

ADMIN_NAME="Administrator"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="GantiDenganPasswordMinimal12Karakter"
```

Sesuaikan nilai koneksi database dengan konfigurasi PostgreSQL yang digunakan.

Keterangan:

- `DATABASE_URL` digunakan oleh aplikasi untuk mengakses database.
- `DIRECT_URL` digunakan oleh konfigurasi Prisma dan proses seeding.
- `ADMIN_NAME`, `ADMIN_EMAIL`, dan `ADMIN_PASSWORD` digunakan untuk menyiapkan akun administrator.

Jangan mengunggah file `.env` yang berisi kredensial asli ke repository.

### 4. Menjalankan Database Migration

Jalankan perintah berikut untuk menerapkan migration yang tersedia:

```bash
npx prisma migrate deploy
```

### 5. Mengisi Data Awal

Untuk memasukkan data menu awal:

```bash
npx prisma db seed
```

Untuk menyiapkan akun administrator:

```bash
npm run seed:admin
```

Perintah `seed:admin` menggunakan nilai environment variable dan akan membuat atau memperbarui akun dengan email yang dikonfigurasi. Jalankan dengan kredensial admin yang memang ingin digunakan.

### 6. Menjalankan Aplikasi

```bash
npm run dev
```

Buka browser dan akses:

```text
http://localhost:3000
```

## Perintah yang Tersedia

| Perintah                    | Kegunaan                          |
| --------------------------- | --------------------------------- |
| `npm run dev`               | Menjalankan development server    |
| `npm run build`             | Membuat production build          |
| `npm run start`             | Menjalankan aplikasi production   |
| `npm run lint`              | Memeriksa kode menggunakan ESLint |
| `npm run seed:admin`        | Menyiapkan akun administrator     |
| `npx prisma migrate deploy` | Menerapkan database migration     |
| `npx prisma db seed`        | Mengisi data awal database        |

## Catatan

- Data menu, pengguna, pesanan, pembayaran, FAQ, lokasi, dan favorit dikelola melalui PostgreSQL.
- Keranjang belanja pelanggan disimpan pada browser menggunakan `localStorage`.
- Bukti pembayaran dan gambar hasil upload disimpan dalam database.
- Akses dashboard dan API administrator dibatasi berdasarkan role pengguna.
- Harga akhir pesanan dihitung kembali berdasarkan data menu yang tersimpan di database.

## Pengembangan

Proyek ini dikembangkan sebagai bagian dari tugas UAS mata kuliah Front-End Programming.

Repository:
https://github.com/Vieratha/FrontEndProgramming_Kel4

Direktori proyek:
`Project_UAS/soto-betawi`
