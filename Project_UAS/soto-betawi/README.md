# Soto Betawi Jakarta — Next.js

Project UTS Soto Betawi Jakarta dikembangkan kembali menggunakan Next.js App Router, React, TypeScript, CSS, dan Bootstrap 5. Tampilan dan alur yang sudah ada dipertahankan sebisa mungkin, sedangkan pengelolaan interaksi dipindahkan ke komponen React.

## Fitur

- Halaman utama dengan hero, Tentang Kami, daftar menu, keunggulan, testimoni, lokasi, FAQ, CTA, dan footer.
- Pencarian menu dan filter kategori Makanan/Minuman.
- Kartu menu yang dapat ditambahkan ke keranjang dan ditandai sebagai favorit.
- Keranjang belanja, pengubahan kuantitas, pilihan makan di tempat/bawa pulang, validasi nama dan nomor meja, catatan pesanan, serta struk pesanan.
- Registrasi dan login pelanggan demo.
- Dashboard admin dengan ringkasan pesanan, total pendapatan simulasi, menu terlaris, dan pengelolaan menu (tambah, edit, hapus, cari, filter, status, serta unggah gambar berukuran kecil).
- Halaman detail menu dengan *dynamic route* `/menu/[slug]`.
- Navigasi internal menggunakan `Link` dari `next/link` serta penanda navigasi aktif pada halaman utama.
- Tampilan responsif untuk desktop, tablet, dan ponsel.

## Teknologi dan kesesuaian materi praktikum

- HTML semantik, tautan, gambar, heading, tabel, dan form sebagai fondasi struktur halaman.
- JavaScript: fungsi, array/objek, kondisi, event handling, validasi, dan penyimpanan data di browser.
- Responsive UI: CSS Flexbox/Grid, unit relatif, serta media query untuk breakpoint layar.
- Bootstrap 5.3.3 dimuat melalui CDN untuk sistem grid 12 kolom, utility class, form, dan komponen tata letak. Bootstrap 5 tidak membutuhkan jQuery.
- Next.js App Router: `app/layout.tsx`, `app/page.tsx`, folder halaman bertingkat, route dinamis `[slug]`, `public/` untuk aset, dan komponen yang dapat digunakan ulang.
- `next/image` digunakan untuk gambar lokal. Interaksi yang sebelumnya menggunakan jQuery (misalnya FAQ accordion, pencarian, filter, dan keranjang) diterjemahkan ke state dan event handler React. Ini menghindari jQuery memanipulasi DOM yang dikendalikan React, sesuai pendekatan berbasis komponen di materi Next.js.

## Menyiapkan gambar

Paket konversi tidak menggandakan file gambar sumber. Sesudah menyalin file project ke repository, jalankan perintah berikut dari root repository di PowerShell:

```powershell
New-Item -ItemType Directory -Force ".\Project_UAS\soto-betawi\public\images" | Out-Null
Copy-Item ".\Project UTS\Soto_Betawi\images\*" ".\Project_UAS\soto-betawi\public\images\" -Recurse -Force
```

Pastikan file gambar seperti `hero-soto.jpeg`, `tentang-betawi.jpeg`, `menu-soto.jpeg`, `menu-nasi-uduk.jpeg`, `menu-kerak-telor.jpeg`, `menu-bir-pletok.jpeg`, `suasana-restoran.jpeg`, gambar avatar, dan gambar peta sudah berada di `public/images/`.

## Menjalankan project

Buka terminal pada folder `Project_UAS/soto-betawi`, lalu jalankan:

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Untuk memeriksa kualitas kode dan membuat build produksi:

```bash
npm run lint
npm run build
```

## Route

| Route | Kegunaan |
|---|---|
| `/` | Website pelanggan |
| `/menu/soto-betawi-spesial` | Detail Soto Betawi Spesial |
| `/menu/nasi-uduk` | Detail Nasi Uduk |
| `/menu/kerak-telor` | Detail Kerak Telor |
| `/menu/bir-pletok` | Detail Bir Pletok |
| `/login` | Login pelanggan |
| `/register` | Registrasi pelanggan |
| `/admin/login` | Login admin |
| `/admin` | Dashboard admin |
| `/admin/menu` | Pengelolaan menu |

## Akun demo admin

- Username: `admin123`
- Password: `admin123`

## Catatan penting

Project ini merupakan demonstrasi front-end untuk praktikum. Data pelanggan, sesi login, keranjang, menu admin, dan pesanan disimpan di `localStorage` browser sehingga tidak tersinkron antarperangkat dan bukan pengganti backend/database. Password pelanggan pada demo ini juga tersimpan di browser; jangan gunakan password asli. Login admin demo hanya pemeriksaan sisi klien dan tidak aman untuk produksi.

Folder `Project UTS/Soto_Betawi` sebaiknya tetap disimpan sebagai salinan sumber dan tempat asal aset gambar.
