/*Ini bagian atas yang "Soto Betawi Jakarta, Keranjang & Pemesanan di Restoran"*/
(function () {
  ("use strict");

  //Ini konfigurasinya
  var STORAGE_KEY = "sotoBetawiCart";
  var ORDERS_KEY = "sotoBetawiOrders"; //Ini riwayat pesanan (di browser perangkat ini)

  //Elemen-elemennya
  var $ = function (id) {
    return document.getElementById(id);
  };
  var cartToggle = $("cartToggle");
  var cartCount = $("cartCount");
  var overlay = $("cartOverlay");
  var drawer = $("cartDrawer");
  var cartBody = $("cartBody");
  var cartFoot = $("cartFoot");
  var cartTotal = $("cartTotal");
  var orderDone = $("orderDone");
  var toast = $("toast");
  var toastTimer;
  var lastFocus = null;

  //State keranjang
  var cart = load();

  //Ini mengambil data keranjang dari penyimpanan web
  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return data && typeof data === "object" ? data : {};
    } catch (e) {
      return {};
    }
  }

  //Ini menyimpan data keranjang ke penyimpanan web
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {}
  }

  //Ini berfungsi mengubah angkat menjadi format Rp
  function rupiah(n) {
    return "Rp " + n.toLocaleString("id-ID");
  }

  //Ini menghitung jumlah item dan total harga keranjang
  function totals() {
    var qty = 0,
      sum = 0;
    Object.keys(cart).forEach(function (id) {
      qty += cart[id].qty;
      sum += cart[id].qty * cart[id].price;
    });
    return { qty: qty, sum: sum };
  }

  //Ini bagian action saat di keranjang di mana akan menambahkan menu ke cart
  function addItem(id, name, price) {
    if (cart[id]) {
      cart[id].qty += 1;
    } else {
      cart[id] = { id: id, name: name, price: price, qty: 1 };
    }
    save();
    render();
    bumpIcon();
    showToast(name + " ditambahkan ke keranjang");
  }

  //Ini mengubah jumlah menu di keranjang
  function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];
    save();
    render();
  }

  //Ini mengosongkan seluruh isi keranjang
  function clearCart() {
    cart = {};
    save();
    render();
  }

  //Ini section render di mana menampilkan jumlah item pada tombol keranjang
  function render() {
    var t = totals();

    //Mengosongkan seluruh isi keranjang
    cartCount.textContent = t.qty;
    cartCount.hidden = t.qty === 0;
    cartToggle.setAttribute(
      "aria-label",
      "Buka keranjang (" + t.qty + " item)",
    );

    //Menampilkan jumlah item pada tombol keranjang
    var ids = Object.keys(cart);
    if (ids.length === 0) {
      cartBody.innerHTML =
        '<div class="cart-empty">' +
        "<strong>Keranjang masih kosong</strong>" +
        "Yuk pilih menu favorit Anda dulu." +
        '<br><a href="#menu" class="btn btn-primary btn-small" data-close-cart>Lihat Menu</a>' +
        "</div>";
      cartFoot.hidden = true;
      return;
    }
    /*Ini bagian menampilkan isi keranjang*/
    cartFoot.hidden = false;
    cartBody.innerHTML = ids
      .map(function (id) {
        var it = cart[id];
        return (
          '<div class="cart-item">' +
          "<h3>" +
          escapeHtml(it.name) +
          "</h3>" +
          '<span class="cart-item-sub">' +
          rupiah(it.qty * it.price) +
          "</span>" +
          '<span class="cart-item-price">' +
          rupiah(it.price) +
          " / porsi</span>" +
          '<div class="qty">' +
          '<button type="button" data-action="dec" data-id="' +
          escapeHtml(id) +
          '" aria-label="Kurangi ' +
          escapeHtml(it.name) +
          '">−</button>' +
          "<span>" +
          it.qty +
          "</span>" +
          '<button type="button" data-action="inc" data-id="' +
          escapeHtml(id) +
          '" aria-label="Tambah ' +
          escapeHtml(it.name) +
          '">+</button>' +
          "</div>" +
          "</div>"
        );
      })
      .join("");
    cartTotal.textContent = rupiah(t.sum);
  }

  //Ini akan mengamankan teks sebelum ditampilkan ke HTML
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  //Ini emberikan animasi pada tombol keranjang
  function bumpIcon() {
    cartToggle.classList.remove("bump");
    void cartToggle.offsetWidth;
    cartToggle.classList.add("bump");
  }

  //Menampilkan notifikasi kepada pengguna
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 1800);
  }

  //Membuka panel keranjang
  function openCart() {
    if (!orderDone.hidden) resetView();
    lastFocus = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(function () {
      overlay.classList.add("open");
      drawer.classList.add("open");
    });
    drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");
    $("cartClose").focus();
  }

  //Membuka panel keranjang
  function closeCart() {
    overlay.classList.remove("open");
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
    setTimeout(function () {
      overlay.hidden = true;
    }, 300);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  //Ini akan mengecek apakah keranjang sedang terbuka
  function isOpen() {
    return drawer.classList.contains("open");
  }

  //Ini bagian pesanan di restoran di mana akan mengambil riwayat pesanan dari penyimpanan web
  function loadOrders() {
    try {
      var d = JSON.parse(localStorage.getItem(ORDERS_KEY));
      return Array.isArray(d) ? d : [];
    } catch (e) {
      return [];
    }
  }

  //Menyimpan riwayat pesanan ke penyimpanan browser
  function saveOrders(list) {
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  //Membuat penanda tanggal untuk pesanan
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  //Ini akan membuat nomor antrean urut per hari: A001, A002, ...
  function nextOrderNumber(list) {
    var today = todayKey();
    var n =
      list.filter(function (o) {
        return o.day === today;
      }).length + 1;
    return "A" + String(n).padStart(3, "0");
  }

  //Mengambil jenis pesanan yang dipilih
  function orderType() {
    return document.querySelector('input[name="orderType"]:checked').value;
  }

  //Mengambil jenis pesanan yang dipilih
  function updateTableField() {
    var dineIn = orderType() === "Makan di tempat";
    $("tableField").hidden = !dineIn;
  }

  //Menampilkan pesan kesalahan pada input
  function invalid(inputId, msg) {
    var el = $(inputId);
    el.parentElement.classList.add("invalid");
    el.focus();
    showToast(msg);
  }

  //Menampilkan pesan kesalahan pada input
  function checkout() {
    var t = totals();
    if (t.qty === 0) return;
    var type = orderType();
    var table = $("orderTable").value.trim();
    var name = $("orderName").value.trim();

    if (type === "Makan di tempat" && !table)
      return invalid("orderTable", "Mohon isi nomor meja Anda");
    if (!name) return invalid("orderName", "Mohon isi nama pemesan");

    var list = loadOrders();
    var order = {
      no: nextOrderNumber(list),
      day: todayKey(),
      time: new Date().toISOString(),
      type: type,
      table: type === "Makan di tempat" ? table : "",
      name: name,
      note: $("orderNote").value.trim(),
      items: Object.keys(cart).map(function (id) {
        return cart[id];
      }),
      total: t.sum,
      status: "Baru",
    };
    list.push(order);
    saveOrders(list);

    clearCart();
    $("orderTable").value = "";
    $("orderName").value = "";
    $("orderNote").value = "";
    showReceipt(order);
  }

  function showReceipt(o) {
    var when = new Date(o.time).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    var rows = o.items
      .map(function (it) {
        return (
          '<div class="receipt-row"><span>' +
          it.qty +
          "× " +
          escapeHtml(it.name) +
          "</span>" +
          "<span>" +
          rupiah(it.qty * it.price) +
          "</span></div>"
        );
      })
      .join("");

    orderDone.innerHTML =
      '<div class="done-icon" aria-hidden="true">✓</div>' +
      "<h3>Pesanan Diterima</h3>" +
      '<p class="done-sub">Nomor pesanan Anda</p>' +
      '<div class="done-number">' +
      escapeHtml(o.no) +
      "</div>" +
      '<div class="receipt">' +
      '<div class="receipt-meta">' +
      "<span>" +
      escapeHtml(o.type) +
      (o.table ? " · Meja " + escapeHtml(o.table) : "") +
      "</span>" +
      "<span>" +
      escapeHtml(o.name) +
      " · " +
      when +
      "</span>" +
      "</div>" +
      rows +
      (o.note
        ? '<div class="receipt-note">Catatan: ' + escapeHtml(o.note) + "</div>"
        : "") +
      '<div class="receipt-row receipt-total"><span>Total</span><span>' +
      rupiah(o.total) +
      "</span></div>" +
      "</div>" +
      '<p class="done-pay">Silakan lakukan pembayaran di kasir<br>dengan menyebutkan nomor pesanan.</p>' +
      '<button type="button" class="btn btn-outline cart-checkout no-print" id="printReceipt">Cetak Struk</button>' +
      '<button type="button" class="btn btn-primary cart-checkout no-print" id="newOrder">Pesan Lagi</button>';

    cartBody.hidden = true;
    cartFoot.hidden = true;
    orderDone.hidden = false;
    $("cartTitle").textContent = "Terima Kasih";
    orderDone.scrollTop = 0;

    $("printReceipt").addEventListener("click", function () {
      window.print();
    });
    $("newOrder").addEventListener("click", function () {
      resetView();
      closeCart();
      var menu = $("menu");
      if (menu) menu.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  //Kembali ke tampilan keranjang normal
  function resetView() {
    orderDone.hidden = true;
    orderDone.innerHTML = "";
    cartBody.hidden = false;
    $("cartTitle").textContent = "Keranjang Anda";
    render();
  }

  //Event-event ini menggunakan jQuery. Sebab jQuery(...) bagian fungsi $ di atas dipakai untuk mengambil elemen berdasarkan ID.
  jQuery(function () {
    //Tombol tambah menu
    jQuery(document).on("click", ".add-to-cart", function () {
      var btn = jQuery(this);
      addItem(
        btn.data("id"),
        btn.data("name"),
        parseInt(btn.data("price"), 10),
      );
      btn.addClass("added").text("✓");
      setTimeout(function () {
        btn.removeClass("added").text("+");
      }, 900);
    });

    //Buka dan tutup keranjang
    jQuery("#cartToggle").on("click", openCart);
    jQuery("#cartClose, #cartOverlay").on("click", closeCart);

    jQuery(document).on("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) closeCart();
    });

    //Tombol Pesan Online membuka keranjang
    jQuery("#ctaCart").on("click", function (e) {
      e.preventDefault();
      openCart();
    });

    //Tombol tambah/kurang jumlah di dalam keranjang dan link Lihat Menu
    jQuery("#cartBody").on("click", "[data-action]", function () {
      var btn = jQuery(this);
      changeQty(btn.data("id"), btn.data("action") === "inc" ? 1 : -1);
    });

    jQuery("#cartBody").on("click", "[data-close-cart]", function () {
      closeCart();
    });

    //Kosongkan keranjang dan checkout
    jQuery("#clearCart").on("click", clearCart);
    jQuery("#checkoutBtn").on("click", checkout);

    //Hapus penanda invalid saat pengguna mulai mengetik lagi
    jQuery("#orderName, #orderTable").on("input", function () {
      jQuery(this).parent().removeClass("invalid");
    });

    //Tampilkan/sembunyikan input nomor meja berdasarkan jenis pesanan
    jQuery('input[name="orderType"]').on("change", updateTableField);
    updateTableField();

    //Tombol Pesan Sekarang menggulir ke bagian menu
    jQuery("#orderNow").on("click", function (e) {
      var menu = document.getElementById("menu");
      if (!menu) return;
      e.preventDefault();
      jQuery("html, body").animate(
        { scrollTop: jQuery(menu).offset().top },
        500,
      );
      history.replaceState(null, "", "#menu");
    });

    //Navigasi aktif mengikuti bagian halaman yang sedang dilihat
    var navLinks = jQuery(".main-nav a");
    var sections = navLinks
      .map(function () {
        return jQuery(jQuery(this).attr("href"))[0];
      })
      .get();

    function updateActiveNav() {
      var y = jQuery(window).scrollTop() + 140;
      var current = 0;
      var best = -1;
      sections.forEach(function (section, i) {
        if (
          section &&
          jQuery(section).offset().top <= y &&
          jQuery(section).offset().top > best
        ) {
          best = jQuery(section).offset().top;
          current = i;
        }
      });
      navLinks.removeClass("active").eq(current).addClass("active");
    }

    jQuery(window).on("scroll", updateActiveNav);
    updateActiveNav();

    //Ini akan sinkronisasi keranjang saat berubah dari tab browser lain
    jQuery(window).on("storage", function (e) {
      var originalEvent = e.originalEvent;
      if (originalEvent && originalEvent.key === STORAGE_KEY) {
        cart = load();
        render();
      }
    });
    //Tombol struk dan pesan lagi dibuat secara dinamis saat checkout
    jQuery(document).on("click", "#printReceipt", function () {
      window.print();
    });
    jQuery(document).on("click", "#newOrder", function () {
      resetView();
      closeCart();
      var menu = document.getElementById("menu");
      if (menu)
        jQuery("html, body").animate(
          { scrollTop: jQuery(menu).offset().top },
          500,
        );
    });
    //Menampilkan menu yang dikelola Admin
    renderCustomerMenus();

    //Fitur pencarian, filter, dan favorit
    initMenuFilter();
    initMenuSearch();
    initFavoriteButtons();
    initFAQ();
  });
  render();
})();

//Filter menu berdasarkan kategori
function initMenuFilter() {
  $(".filter-btn").on("click", function () {
    const filter = $(this).data("filter");
    //Mengubah tombol filter yang aktif
    $(".filter-btn").removeClass("active");
    $(this).addClass("active");
    $(".menu-card").each(function () {
      const category = $(this).data("category");
      if (filter === "all" || category === filter) {
        $(this).fadeIn(200);
      } else {
        $(this).fadeOut(200);
      }
    });
  });
}

//Pencarian menu berdasarkan nama
function initMenuSearch() {
  $("#menuSearch").on("input", function () {
    const keyword = $(this).val().toLowerCase();
    $(".menu-card").each(function () {
      const menuName = $(this).find("h3").text().toLowerCase();
      if (menuName.includes(keyword)) {
        $(this).fadeIn(200);
      } else {
        $(this).fadeOut(200);
      }
    });
  });
}

//Tombol untuk menandai menu favorit
function initFavoriteButtons() {
  $(".favorite-btn").on("click", function () {
    const $button = $(this);
    const $icon = $button.find(".favorite-icon");
    const $count = $button.find(".favorite-count");
    let count = parseInt($count.text(), 10);
    if ($button.hasClass("favorite-active")) {
      count--;
      $button.removeClass("favorite-active");
      $icon.text("♡");
    } else {
      count++;
      $button.addClass("favorite-active");
      $icon.text("♥");
    }
    $count.text(count);
  });
}

//FAQ Accordion menggunakan jQuery
function initFAQ() {
  $(".faq-question").on("click", function () {
    const $question = $(this);
    const $answer = $question.next(".faq-answer");
    const $icon = $question.find(".faq-icon");

    //Menutup FAQ lain yang sedang terbuka
    $(".faq-answer").not($answer).slideUp(200);
    $(".faq-icon").not($icon).text("+");

    //Membuka atau menutup jawaban yang dipilih
    $answer.slideToggle(200, function () {
      if ($answer.is(":visible")) {
        $icon.text("−");
      } else {
        $icon.text("+");
      }
    });
  });
}

/*Ini bagian profile customer*/
function initCustomerProfile() {
  var profileToggle = document.getElementById("profileToggle");
  var profileDropdown = document.getElementById("profileDropdown");
  if (!profileToggle || !profileDropdown) {
    return;
  }

  /*Ini bagian mengambil data user*/
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem("sotoBetawiUserLogin"));
    } catch (error) {
      return null;
    }
  }

  /*Ini bagian menampilkan profile*/
  function renderProfile() {
    var user = getUser();
    if (user) {
      profileDropdown.innerHTML = `
        <div class="profile-info">
          <div class="profile-name">
            ${user.name}
          </div>
          <div class="profile-email">
            ${user.email}
          </div>
        </div>
        <div class="profile-menu">
          <button
            type="button"
            class="profile-logout"
            id="userLogout"
          >
            Logout
          </button>
        </div>
      `;

      /*Ini bagian logout customer*/
      var logoutButton = document.getElementById("userLogout");
      logoutButton.addEventListener("click", function () {
        localStorage.removeItem("sotoBetawiUserLogin");
        profileDropdown.classList.remove("show");
        renderProfile();
      });
    } else {
      profileDropdown.innerHTML = `
        <div class="profile-info">
          <div class="profile-name">
            Belum Login
          </div>
          <div class="profile-email">
            Login untuk menggunakan fitur akun.
          </div>
        </div>
        <div class="profile-menu">
          <a href="login.html">
            Login
          </a>
          <a href="register.html">
            Daftar
          </a>
        </div>
      `;
    }
  }

  /*Ini bagian membuka profile*/
  profileToggle.addEventListener("click", function (event) {
    event.stopPropagation();
    var isOpen = profileDropdown.classList.toggle("show");
    profileToggle.setAttribute("aria-expanded", isOpen);
  });

  /*Ini bagian menutup profile*/
  document.addEventListener("click", function (event) {
    if (
      !profileDropdown.contains(event.target) &&
      !profileToggle.contains(event.target)
    ) {
      profileDropdown.classList.remove("show");
      profileToggle.setAttribute("aria-expanded", "false");
    }
  });
  renderProfile();
}

/*Ini bagian menjalankan profile*/
initCustomerProfile();

/*Ini bagian mengambil data menu dari Admin*/
function loadCustomerMenus() {
  try {
    var data = JSON.parse(localStorage.getItem("sotoBetawiMenus"));
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  } catch (error) {
    return [];
  }
}

/*Ini bagian menyesuaikan lokasi gambar dari Admin ke Customer*/
function getCustomerImage(image) {
  var imagePath = image || "";
  if (imagePath.indexOf("../images/") === 0) {
    imagePath = imagePath.substring(3);
  }
  return imagePath;
}

/*Ini bagian menampilkan menu dari Admin*/
function renderCustomerMenus() {
  var menus = loadCustomerMenus();
  var container = document.getElementById("customerMenuGrid");
  if (!container) {
    return;
  }
  container.innerHTML = "";
  menus.forEach(function (menu) {
    if (menu.status !== "Tersedia") {
      return;
    }
    var card = document.createElement("article");
    card.className = "menu-card";
    card.setAttribute("data-category", menu.category.toLowerCase());
    card.innerHTML = `
      <div class="menu-photo">
        <img
          src="${getCustomerImage(menu.image)}"
          alt="${menu.name}"
        />
      </div>
      <div class="menu-body">
        <h3>${menu.name}</h3>
        <p>${menu.description || ""}</p>
        <div class="menu-bottom">
          <strong>Rp ${Number(menu.price || 0).toLocaleString("id-ID")}</strong>
          <!--Ini tombol favorite-->
          <button
            class="favorite-btn"
            type="button"
            aria-label="Tandai menu"
          >
            <span class="favorite-icon">♡</span>
            <span class="favorite-count">0</span>
          </button>
          <!--Ini tombol tambah-->
          <button
            class="circle-btn add-to-cart"
            type="button"
            data-id="${menu.id}"
            data-name="${menu.name}"
            data-price="${menu.price}"
            aria-label="Tambah ${menu.name} ke keranjang"
          >
            +
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

/*Ini bagian sinkronisasi menu*/
window.addEventListener("storage", function (event) {
  if (event.key === "sotoBetawiMenus") {
    renderCustomerMenus();
    initFavoriteButtons();
  }
});
