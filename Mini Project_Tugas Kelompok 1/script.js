// Mengambil elemen dari halaman menggunakan id
let pilihan = document.getElementById("pilihan");
let jarak = document.getElementById("jarak");
let waktu = document.getElementById("waktu");
let kecepatan = document.getElementById("kecepatan");
let btnHitung = document.getElementById("btnHitung");
let btnReset = document.getElementById("btnReset");
let hasil = document.getElementById("hasil");

// Array berisi nama dan nilai jarak referensi a
let namaJarak = [
  "",
  "Jakarta → Bandung",
  "Jakarta → Surabaya",
  "Jakarta → Bali",
  "Bumi → Bulan",
];

let nilaiJarak = [150, 780, 950, 384400];

// Kecepatan cahaya dalam km/jam.
// Data ini digunakan sebagai pembanding dalam simulasi.
let kecepatanCahaya = 1079251200;

// Fungsi untuk mencari jarak referensi yang paling dekat
function cariReferensi(nilai) {
  let selisihTerkecil = nilai - nilaiJarak[0];

  if (selisihTerkecil < 0) {
    selisihTerkecil = selisihTerkecil * -1;
  }

  let indexTerdekat = 0;

  // Perulangan untuk memeriksa seluruh data referensi
  for (let i = 1; i < nilaiJarak.length; i++) {
    let selisih = nilai - nilaiJarak[i];

    if (selisih < 0) {
      selisih = selisih * -1;
    }

    if (selisih < selisihTerkecil) {
      selisihTerkecil = selisih;
      indexTerdekat = i;
    }
  }

  return indexTerdekat;
}

// Fungsi untuk menampilkan perbandingan jarak
function tampilkanReferensi(nilai) {
  let index = cariReferensi(nilai);

  return (
    "<p><strong>Perbandingan jarak:</strong><br>" +
    nilai +
    " km kira-kira mendekati " +
    namaJarak[index] +
    " (" +
    nilaiJarak[index] +
    " km).</p>"
  );
}

// Fungsi untuk menampilkan perbandingan dengan kecepatan cahaya
function tampilkanPerbandinganKecepatan(nilai) {
  let perbandingan = nilai / kecepatanCahaya;

  if (nilai > kecepatanCahaya) {
    return (
      "<p><strong>⚠ Kecepatan melebihi kecepatan cahaya.</strong><br>" +
      "Nilai ini digunakan sebagai simulasi matematis, bukan sebagai " +
      "kecepatan yang dapat dicapai benda bermassa.</p>" +
      "<p>Perbandingan: " +
      perbandingan.toFixed(2) +
      " × kecepatan cahaya.</p>"
    );
  }

  if (nilai == kecepatanCahaya) {
    return "<p><strong>⚡ Kecepatan sama dengan kecepatan cahaya.</strong></p>";
  }

  return (
    "<p>Perbandingan: " + perbandingan.toFixed(8) + " × kecepatan cahaya.</p>"
  );
}

// Fungsi utama untuk melakukan perhitungan
function hitung() {
  // Mengambil nilai input dari pengguna
  let nilaiJarakInput = Number(jarak.value);
  let nilaiWaktu = Number(waktu.value);
  let nilaiKecepatan = Number(kecepatan.value);
  let jenis = pilihan.value;

  // Menghitung kecepatan = jarak / waktu
  if (jenis == "kecepatan") {
    if (nilaiJarakInput <= 0 || nilaiWaktu <= 0) {
      hasil.innerHTML =
        "<h2>Hasil</h2>" + "<p>Masukkan jarak dan waktu yang lebih dari 0.</p>";
      return;
    }

    let hasilKecepatan = nilaiJarakInput / nilaiWaktu;

    hasil.innerHTML =
      "<h2>Hasil Perhitungan</h2>" +
      "<p><strong>Kecepatan:</strong> " +
      hasilKecepatan +
      " km/jam</p>" +
      tampilkanPerbandinganKecepatan(hasilKecepatan);
  }

  // Menghitung jarak = kecepatan × waktu
  else if (jenis == "jarak") {
    if (nilaiKecepatan <= 0 || nilaiWaktu <= 0) {
      hasil.innerHTML =
        "<h2>Hasil</h2>" +
        "<p>Masukkan kecepatan dan waktu yang lebih dari 0.</p>";
      return;
    }

    let hasilJarak = nilaiKecepatan * nilaiWaktu;

    hasil.innerHTML =
      "<h2>Hasil Perhitungan</h2>" +
      "<p><strong>Jarak:</strong> " +
      hasilJarak +
      " km</p>" +
      tampilkanReferensi(hasilJarak) +
      tampilkanPerbandinganKecepatan(nilaiKecepatan);
  }

  // Menghitung waktu = jarak / kecepatan
  else if (jenis == "waktu") {
    if (nilaiJarakInput <= 0 || nilaiKecepatan <= 0) {
      hasil.innerHTML =
        "<h2>Hasil</h2>" +
        "<p>Masukkan jarak dan kecepatan yang lebih dari 0.</p>";
      return;
    }

    let hasilWaktu = nilaiJarakInput / nilaiKecepatan;

    hasil.innerHTML =
      "<h2>Hasil Perhitungan</h2>" +
      "<p><strong>Waktu:</strong> " +
      hasilWaktu +
      " jam</p>" +
      tampilkanReferensi(nilaiJarakInput) +
      tampilkanPerbandinganKecepatan(nilaiKecepatan);
  }
}

// Fungsi untuk mengosongkan input dan hasil
function reset() {
  jarak.value = "";
  waktu.value = "";
  kecepatan.value = "";

  hasil.innerHTML =
    "<h2>Hasil</h2>" + "<p>Masukkan data lalu tekan tombol Hitung.</p>";
}

// Event ketika tombol Hitung diklik
btnHitung.addEventListener("click", hitung);

// Event ketika tombol Reset diklik
btnReset.addEventListener("click", reset);
