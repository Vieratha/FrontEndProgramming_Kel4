// Mengambil elemen HTML berdasarkan id
let pilihan = document.getElementById("pilihan");
let jarak = document.getElementById("jarak");
let waktu = document.getElementById("waktu");
let kecepatan = document.getElementById("kecepatan");

let inputJarak = document.getElementById("inputJarak");
let inputWaktu = document.getElementById("inputWaktu");
let inputKecepatan = document.getElementById("inputKecepatan");

let btnHitung = document.getElementById("btnHitung");
let btnReset = document.getElementById("btnReset");
let hasil = document.getElementById("hasil");

// Data referensi kecepatan
let kecepatanSuara = 1235;
let kecepatanCahaya = 1079251200;

// Menampilkan input yang diperlukan sesuai pilihan
function ubahInput() {
<<<<<<< HEAD
  inputJarak.style.display = "block";
  inputWaktu.style.display = "block";
  inputKecepatan.style.display = "block";

  if (pilihan.value == "kecepatan") {
    inputKecepatan.style.display = "none";
  } else if (pilihan.value == "jarak") {
    inputJarak.style.display = "none";
  } else if (pilihan.value == "waktu") {
    inputWaktu.style.display = "none";
  }

  hasil.innerHTML =
    "<h2>Hasil Perhitungan</h2>" +
    "<p>Masukkan data lalu tekan tombol Hitung.</p>";
}

// Membuat angka lebih mudah dibaca
function formatAngka(angka) {
  return angka.toLocaleString("id-ID", {
    maximumFractionDigits: 4,
  });
}

// Menentukan perbandingan jarak berdasarkan skala
function tampilkanReferensiJarak(nilai) {
  if (nilai < 1) {
    return (
      "<p><strong>Skala jarak:</strong><br>" +
      formatAngka(nilai * 1000) +
      " meter.</p>"
    );
  } else if (nilai < 150) {
    return (
      "<p><strong>Skala jarak:</strong><br>" +
      formatAngka(nilai) +
      " km, masih lebih pendek dari jarak Jakarta → Bandung.</p>"
    );
  } else if (nilai < 780) {
    return (
      "<p><strong>Perbandingan jarak:</strong><br>" +
      formatAngka(nilai) +
      " km berada dalam skala perjalanan Jakarta → Bandung hingga Jakarta → Surabaya.</p>"
    );
  } else if (nilai < 384400) {
    return (
      "<p><strong>Perbandingan jarak:</strong><br>" +
      formatAngka(nilai) +
      " km masih berada di bawah jarak rata-rata Bumi → Bulan.</p>"
    );
  } else {
    return (
      "<p><strong>Skala jarak:</strong><br>" +
      formatAngka(nilai / 384400) +
      " × jarak rata-rata Bumi → Bulan.</p>"
    );
  }
}

// Menampilkan perbandingan khusus untuk hasil kecepatan
function tampilkanReferensiKecepatan(nilai) {
  let hasilKecepatan = "";

  if (nilai < kecepatanSuara) {
    hasilKecepatan =
      "<p><strong>Kecepatan suara:</strong><br>" +
      formatAngka((nilai / kecepatanSuara) * 100) +
      "% dari kecepatan suara.</p>";
  } else if (nilai == kecepatanSuara) {
    hasilKecepatan =
      "<p><strong>Kecepatan suara:</strong><br>" +
      "Kira-kira sama dengan kecepatan suara.</p>";
  } else {
    hasilKecepatan =
      "<p><strong>Kecepatan suara:</strong><br>" +
      formatAngka(nilai / kecepatanSuara) +
      " × kecepatan suara.</p>";
  }

  if (nilai == kecepatanCahaya) {
    hasilKecepatan +=
      "<p><strong>Kecepatan cahaya:</strong><br>" +
      "Nilai ini sama dengan kecepatan cahaya.</p>";
  } else if (nilai > kecepatanCahaya) {
    hasilKecepatan +=
      "<div class='peringatan'>" +
      "<strong>⚠ Melebihi kecepatan cahaya.</strong><br>" +
      "Nilai ini ditampilkan sebagai simulasi matematis.</div>" +
      "<p>" +
      formatAngka(nilai / kecepatanCahaya) +
      " × kecepatan cahaya.</p>";
  } else {
    hasilKecepatan +=
      "<p><strong>Kecepatan cahaya:</strong><br>" +
      formatAngka((nilai / kecepatanCahaya) * 100) +
      "% dari kecepatan cahaya.</p>";
  }

  return hasilKecepatan;
}

// Mengubah waktu dari jam menjadi minggu, hari, jam, menit, dan detik
function konversiWaktu(jam) {
  let totalDetik = jam * 60 * 60;

  let minggu = Math.floor(totalDetik / (7 * 24 * 60 * 60));
  totalDetik = totalDetik % (7 * 24 * 60 * 60);

  let hari = Math.floor(totalDetik / (24 * 60 * 60));
  totalDetik = totalDetik % (24 * 60 * 60);

  let jamSisa = Math.floor(totalDetik / (60 * 60));
  totalDetik = totalDetik % (60 * 60);

  let menit = Math.floor(totalDetik / 60);
  let detik = totalDetik % 60;

  let hasilKonversi = "";

  // Menampilkan minggu jika ada
  if (minggu > 0) {
    hasilKonversi += minggu + " minggu ";
  }

  // Menampilkan hari jika ada
  if (hari > 0) {
    hasilKonversi += hari + " hari ";
  }

  // Menampilkan jam jika ada
  if (jamSisa > 0) {
    hasilKonversi += jamSisa + " jam ";
  }

  // Menampilkan menit jika ada
  if (menit > 0) {
    hasilKonversi += menit + " menit ";
  }

  // Menampilkan detik jika ada
  if (detik > 0) {
    hasilKonversi += detik.toFixed(2) + " detik";
  }

  // Jika hasil terlalu kecil
  if (hasilKonversi == "") {
    hasilKonversi = "Kurang dari 1 detik";
  }

  return "<p><strong>Konversi waktu:</strong><br>" + hasilKonversi + "</p>";
}

// Fungsi utama perhitungan
function hitung() {
  let nilaiJarak = Number(jarak.value);
  let nilaiWaktu = Number(waktu.value);
  let nilaiKecepatan = Number(kecepatan.value);

  if (pilihan.value == "kecepatan") {
    if (nilaiJarak <= 0 || nilaiWaktu <= 0) {
      hasil.innerHTML =
        "<h2>Hasil Perhitungan</h2>" +
        "<p>Masukkan jarak dan waktu yang lebih dari 0.</p>";
      return;
=======
    inputJarak.style.display = "block";
    inputWaktu.style.display = "block";
    inputKecepatan.style.display = "block";

    if (pilihan.value == "kecepatan") {
        inputKecepatan.style.display = "none";
    }
    else if (pilihan.value == "jarak") {
        inputJarak.style.display = "none";
    }
    else if (pilihan.value == "waktu") {
        inputWaktu.style.display = "none";
    }

    hasil.innerHTML =
        "<h2>Hasil Perhitungan</h2>" +
        "<p>Masukkan data lalu tekan tombol Hitung.</p>";
}

// Membuat angka lebih mudah dibaca
function formatAngka(angka) {
    return angka.toLocaleString("id-ID", {
        maximumFractionDigits: 4
    });
}

// Menentukan perbandingan jarak berdasarkan skala
function tampilkanReferensiJarak(nilai) {
    if (nilai < 1) {
        return "<p><strong>Skala jarak:</strong><br>" +
            formatAngka(nilai * 1000) + " meter.</p>";
    }
    else if (nilai < 150) {
        return "<p><strong>Skala jarak:</strong><br>" +
            formatAngka(nilai) +
            " km, masih lebih pendek dari jarak Jakarta → Bandung.</p>";
    }
    else if (nilai < 780) {
        return "<p><strong>Perbandingan jarak:</strong><br>" +
            formatAngka(nilai) +
            " km berada dalam skala perjalanan Jakarta → Bandung hingga Jakarta → Surabaya.</p>";
    }
    else if (nilai < 384400) {
        return "<p><strong>Perbandingan jarak:</strong><br>" +
            formatAngka(nilai) +
            " km masih berada di bawah jarak rata-rata Bumi → Bulan.</p>";
    }
    else {
        return "<p><strong>Skala jarak:</strong><br>" +
            formatAngka(nilai / 384400) +
            " × jarak rata-rata Bumi → Bulan.</p>";
    }
}

// Menampilkan perbandingan khusus untuk hasil kecepatan
function tampilkanReferensiKecepatan(nilai) {
    let hasilKecepatan = "";

    if (nilai < kecepatanSuara) {
        hasilKecepatan =
            "<p><strong>Kecepatan suara:</strong><br>" +
            formatAngka(nilai / kecepatanSuara * 100) +
            "% dari kecepatan suara.</p>";
    }
    else if (nilai == kecepatanSuara) {
        hasilKecepatan =
            "<p><strong>Kecepatan suara:</strong><br>" +
            "Kira-kira sama dengan kecepatan suara.</p>";
    }
    else {
        hasilKecepatan =
            "<p><strong>Kecepatan suara:</strong><br>" +
            formatAngka(nilai / kecepatanSuara) +
            " × kecepatan suara.</p>";
    }

    if (nilai == kecepatanCahaya) {
        hasilKecepatan +=
            "<p><strong>Kecepatan cahaya:</strong><br>" +
            "Nilai ini sama dengan kecepatan cahaya.</p>";
    }
    else if (nilai > kecepatanCahaya) {
        hasilKecepatan +=
            "<div class='peringatan'>" +
            "<strong>⚠ Melebihi kecepatan cahaya.</strong><br>" +
            "Nilai ini ditampilkan sebagai simulasi matematis.</div>" +
            "<p>" +
            formatAngka(nilai / kecepatanCahaya) +
            " × kecepatan cahaya.</p>";
    }
    else {
        hasilKecepatan +=
            "<p><strong>Kecepatan cahaya:</strong><br>" +
            formatAngka(nilai / kecepatanCahaya * 100) +
            "% dari kecepatan cahaya.</p>";
    }

    return hasilKecepatan;
}

// Mengubah waktu menjadi minggu, hari, jam, menit, dan detik
function konversiWaktu(jam) {
    let totalDetik = jam * 60 * 60;

    let minggu = Math.floor(totalDetik / (7 * 24 * 60 * 60));
    totalDetik = totalDetik % (7 * 24 * 60 * 60);

    let hari = Math.floor(totalDetik / (24 * 60 * 60));
    totalDetik = totalDetik % (24 * 60 * 60);

    let jamSisa = Math.floor(totalDetik / (60 * 60));
    totalDetik = totalDetik % (60 * 60);

    let menit = Math.floor(totalDetik / 60);
    let detik = totalDetik % 60;

    return "<p><strong>Konversi waktu:</strong></p>" +
        "<ul>" +
        "<li>" + minggu + " minggu</li>" +
        "<li>" + hari + " hari</li>" +
        "<li>" + jamSisa + " jam</li>" +
        "<li>" + menit + " menit</li>" +
        "<li>" + detik.toFixed(2) + " detik</li>" +
        "</ul>";
}

// Fungsi utama perhitungan
function hitung() {
    let nilaiJarak = Number(jarak.value);
    let nilaiWaktu = Number(waktu.value);
    let nilaiKecepatan = Number(kecepatan.value);

    if (pilihan.value == "kecepatan") {
        if (nilaiJarak <= 0 || nilaiWaktu <= 0) {
            hasil.innerHTML =
                "<h2>Hasil Perhitungan</h2>" +
                "<p>Masukkan jarak dan waktu yang lebih dari 0.</p>";
            return;
        }

        let hasilKecepatan = nilaiJarak / nilaiWaktu;

        hasil.innerHTML =
            "<h2>Hasil Kecepatan</h2>" +
            "<p><strong>Kecepatan:</strong> " +
            formatAngka(hasilKecepatan) + " km/jam</p>" +
            tampilkanReferensiKecepatan(hasilKecepatan);
>>>>>>> 90d59d06f35d3e952a680035fec484a9573865ac
    }
    else if (pilihan.value == "jarak") {
        if (nilaiKecepatan <= 0 || nilaiWaktu <= 0) {
            hasil.innerHTML =
                "<h2>Hasil Perhitungan</h2>" +
                "<p>Masukkan kecepatan dan waktu yang lebih dari 0.</p>";
            return;
        }

<<<<<<< HEAD
    let hasilKecepatan = nilaiJarak / nilaiWaktu;

    hasil.innerHTML =
      "<h2>Hasil Kecepatan</h2>" +
      "<p><strong>Kecepatan:</strong> " +
      formatAngka(hasilKecepatan) +
      " km/jam</p>" +
      tampilkanReferensiKecepatan(hasilKecepatan);
  } else if (pilihan.value == "jarak") {
    if (nilaiKecepatan <= 0 || nilaiWaktu <= 0) {
      hasil.innerHTML =
        "<h2>Hasil Perhitungan</h2>" +
        "<p>Masukkan kecepatan dan waktu yang lebih dari 0.</p>";
      return;
=======
        let hasilJarak = nilaiKecepatan * nilaiWaktu;

        hasil.innerHTML =
            "<h2>Hasil Jarak</h2>" +
            "<p><strong>Jarak:</strong> " +
            formatAngka(hasilJarak) + " km</p>" +
            tampilkanReferensiJarak(hasilJarak) +
            "<div class='info'>" +
            "<strong>Konversi:</strong><br>" +
            formatAngka(hasilJarak * 1000) + " meter.</div>";
>>>>>>> 90d59d06f35d3e952a680035fec484a9573865ac
    }
    else if (pilihan.value == "waktu") {
        if (nilaiJarak <= 0 || nilaiKecepatan <= 0) {
            hasil.innerHTML =
                "<h2>Hasil Perhitungan</h2>" +
                "<p>Masukkan jarak dan kecepatan yang lebih dari 0.</p>";
            return;
        }

        let hasilWaktu = nilaiJarak / nilaiKecepatan;

<<<<<<< HEAD
    hasil.innerHTML =
      "<h2>Hasil Jarak</h2>" +
      "<p><strong>Jarak:</strong> " +
      formatAngka(hasilJarak) +
      " km</p>" +
      tampilkanReferensiJarak(hasilJarak) +
      "<div class='info'>" +
      "<strong>Konversi:</strong><br>" +
      formatAngka(hasilJarak * 1000) +
      " meter.</div>";
  } else if (pilihan.value == "waktu") {
    if (nilaiJarak <= 0 || nilaiKecepatan <= 0) {
      hasil.innerHTML =
        "<h2>Hasil Perhitungan</h2>" +
        "<p>Masukkan jarak dan kecepatan yang lebih dari 0.</p>";
      return;
    }

    let hasilWaktu = nilaiJarak / nilaiKecepatan;

    hasil.innerHTML =
      "<h2>Hasil Waktu</h2>" +
      "<p><strong>Waktu:</strong> " +
      formatAngka(hasilWaktu) +
      " jam</p>" +
      konversiWaktu(hasilWaktu) +
      tampilkanReferensiJarak(nilaiJarak);
  }
=======
        hasil.innerHTML =
            "<h2>Hasil Waktu</h2>" +
            "<p><strong>Waktu:</strong> " +
            formatAngka(hasilWaktu) + " jam</p>" +
            konversiWaktu(hasilWaktu) +
            tampilkanReferensiJarak(nilaiJarak);
    }
>>>>>>> 90d59d06f35d3e952a680035fec484a9573865ac
}

// Mengosongkan input dan hasil
function reset() {
    jarak.value = "";
    waktu.value = "";
    kecepatan.value = "";

<<<<<<< HEAD
  hasil.innerHTML =
    "<h2>Hasil Perhitungan</h2>" +
    "<p>Masukkan data lalu tekan tombol Hitung.</p>";
=======
    hasil.innerHTML =
        "<h2>Hasil Perhitungan</h2>" +
        "<p>Masukkan data lalu tekan tombol Hitung.</p>";
>>>>>>> 90d59d06f35d3e952a680035fec484a9573865ac
}

// Event listener
pilihan.addEventListener("change", ubahInput);
btnHitung.addEventListener("click", hitung);
btnReset.addEventListener("click", reset);

// Menjalankan pengaturan input saat halaman dibuka
ubahInput();
