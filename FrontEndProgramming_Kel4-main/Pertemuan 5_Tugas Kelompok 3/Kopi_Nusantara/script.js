//1. Cart, untuk membuat fungsi utama yang menyimpan produk Ke keranjang//
const cart = [];

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return cart.reduce((sum, item) => {
    const num = parseInt(item.price.replace(/\D/g, ""), 10);
    return sum + num * item.qty;
  }, 0);
}

function formatRupiah(num) {
  return "Rp " + num.toLocaleString("id-ID");
}

//2. Notifikasi "Toast", untuk menampilkan jenis notifikasi toast//
function showToast(message) {
  $(".kn-toast").remove();

  const $toast = $("<div>", {
    class: "kn-toast",
    text: message,
  });

  $("body").append($toast);

  $toast.addClass("kn-toast--show");

  setTimeout(function () {
    $toast.removeClass("kn-toast--show");

    setTimeout(function () {
      $toast.remove();
    }, 300);
  }, 2500);
}

//3. Cart drawer untuk membuat drawer untuk menampilkan isi keranjang//
function buildCartDrawer() {
  //Ini overlaynya
  const $overlay = $("<div>", { class: "kn-overlay" });

  //Pada setiap tombolnya menyimpan posisi item di array cart agar event handler tahu item mana yang diubah.//
  //Drawernya
  const $drawer = $(`
    <div class="kn-drawer" aria-label="Keranjang belanja">
      <div class="kn-drawer__header">
        <h2 class="kn-drawer__title">🛒 Keranjang Kamu</h2>
        <button class="kn-drawer__close" type="button" aria-label="Tutup keranjang">✕</button>
      </div>

      <div class="kn-drawer__body">
        <ul class="kn-cart-list"></ul>
        <div class="kn-cart-empty">
          <span>☕</span>
          <p>Keranjang masih kosong.<br>Yuk pilih kopimu!</p>
        </div>
      </div>

      <div class="kn-drawer__footer">
        <div class="kn-cart-total">
          <span>Total</span>
          <strong class="kn-total-price">Rp 0</strong>
        </div>
        <button class="kn-checkout-btn" type="button">Pesan Sekarang</button>
      </div>
    </div>
  `);

  $("body").append($overlay, $drawer);

  $overlay.on("click", closeCartDrawer);
  $drawer.find(".kn-drawer__close").on("click", closeCartDrawer);
  $drawer.find(".kn-checkout-btn").on("click", handleCheckout);
}

function renderCartDrawer() {
  const $list = $(".kn-cart-list");
  const $empty = $(".kn-cart-empty");
  const $total = $(".kn-total-price");

  if (!$list.length) return;

  $list.empty();

  if (cart.length === 0) {
    $list.hide();
    $empty.show();
  } else {
    $list.show();
    $empty.hide();

    cart.forEach(function (item, index) {
      const $item = $(`
        <li class="kn-cart-item">
          <div class="kn-cart-item__info">
            <span class="kn-cart-item__name">${item.name}</span>
            <span class="kn-cart-item__price">${item.price}</span>
          </div>

          <div class="kn-cart-item__controls">
            <button class="kn-qty-btn kn-qty-minus" type="button" data-index="${index}">−</button>
            <span class="kn-qty-num">${item.qty}</span>
            <button class="kn-qty-btn kn-qty-plus" type="button" data-index="${index}">+</button>
            <button class="kn-remove-btn" type="button" data-index="${index}">🗑</button>
          </div>
        </li>
      `);

      $list.append($item);
    });
  }

  $total.text(formatRupiah(getCartTotal()));
}

function updateCartUI() {
  const count = getCartCount();

  $(".cart-count").text(`Cart (${count})`);
  renderCartDrawer();
}

function openCartDrawer() {
  $(".kn-drawer").addClass("kn-drawer--open");
  $(".kn-overlay").addClass("kn-overlay--show");
  $("body").css("overflow", "hidden");
}

function closeCartDrawer() {
  $(".kn-drawer").removeClass("kn-drawer--open");
  $(".kn-overlay").removeClass("kn-overlay--show");
  $("body").css("overflow", "");
}

function handleCheckout() {
  if (cart.length === 0) {
    showToast("⚠️ Keranjang masih kosong!");
    return;
  }

  const items = cart
    .map(function (item) {
      return `${item.name} x${item.qty}`;
    })
    .join(", ");

  showToast(`✅ Pesanan dikirim: ${items}`);
  cart.length = 0;
  updateCartUI();

  setTimeout(closeCartDrawer, 600);
}

//4. Bagian add to card untuk menambahkan produk ke keranjang//
function initAddToCart() {
  $(".add-btn").on("click", function () {
    const $button = $(this);
    const $card = $button.closest(".product-card");
    const name = $card.find("h3").text().trim();
    const price = $card.find(".product-footer strong").text().trim();

    const existing = cart.find(function (item) {
      return item.name === name;
    });

    if (existing) {
      existing.qty++;
    } else {
      cart.push({ name: name, price: price, qty: 1 });
    }

    updateCartUI();
    showToast(`☕ ${name} ditambahkan ke keranjang!`);

    $button.text("✓ Added").css("background", "#2e7d32");

    setTimeout(function () {
      $button.text("Add to Cart").css("background", "");
    }, 1200);
  });
}

//5. Ini ketika cart link diklik akan open drawer//
function initCartLink() {
  $(".cart-link").on("click", function (e) {
    e.preventDefault();
    openCartDrawer();
  });
}

//6. Menambahkan bayangan navbar saat di-scroll*/
function initCartControls() {
  $(".kn-cart-list").on("click", ".kn-qty-minus", function () {
    const index = parseInt($(this).data("index"), 10);

    if (cart[index].qty > 1) {
      cart[index].qty--;
    } else {
      cart.splice(index, 1);
    }

    updateCartUI();
  });

  $(".kn-cart-list").on("click", ".kn-qty-plus", function () {
    const index = parseInt($(this).data("index"), 10);
    cart[index].qty++;
    updateCartUI();
  });

  $(".kn-cart-list").on("click", ".kn-remove-btn", function () {
    const index = parseInt($(this).data("index"), 10);
    const name = cart[index].name;

    cart.splice(index, 1);
    updateCartUI();
    showToast(`🗑 ${name} dihapus dari keranjang`);
  });
}

//7. Menampilkan elemen saat di-scroll Ke kalam viewport//
function initNavbarScroll() {
  $(window).on("scroll", function () {
    $(".navbar").toggleClass("navbar--scrolled", $(window).scrollTop() > 10);
  });
}

//8. Membuat "Menu Hamburger" untuk tampilan mobile//
function initMobileMenu() {
  const $navbar = $(".navbar");
  const $navLinks = $(".nav-links");

  if (!$navbar.length || !$navLinks.length) return;

  const $burger = $(`
    <button class="kn-burger" type="button" aria-label="Toggle menu" aria-expanded="false">
      <span></span>
      <span></span>
      <span></span>
    </button>
  `);

  $navbar.append($burger);

  $burger.on("click", function () {
    const isOpen = !$navLinks.hasClass("nav-links--open");

    $navLinks.stop(true, true).slideToggle(180);
    $navLinks.toggleClass("nav-links--open", isOpen);
    $burger.toggleClass("kn-burger--open", isOpen);
    $burger.attr("aria-expanded", isOpen);
  });

  $navLinks.find("a").on("click", function () {
    if ($(window).width() < 576) {
      $navLinks.stop(true, true).slideUp(180);
      $navLinks.removeClass("nav-links--open");
      $burger.removeClass("kn-burger--open");
      $burger.attr("aria-expanded", "false");
    }
  });
}

//9. Menambahkan efek hover pada kartu produk//
function initCardHover() {
  $(".product-card")
    .on("mouseenter", function () {
      $(this).css({
        transform: "translateY(-4px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
      });
    })
    .on("mouseleave", function () {
      $(this).css({
        transform: "",
        boxShadow: "",
      });
    });
}

//10. Memperbaiki teks tautan keranjang//
function initFAQ() {
  $(".faq-question").on("click", function () {
    const $question = $(this);
    const $answer = $question.next(".faq-answer");

    //Menutup FAQ lain agar hanya satu jawaban terbuka.
    $(".faq-answer").not($answer).stop(true, true).slideUp(250);
    $(".faq-question").not($question).removeClass("faq-question--open");
    $(".faq-question").not($question).find(".faq-icon").text("+");

    //Buka/tutup jawaban yang dipilih dengan slideToggle().
    $answer.stop(true, true).slideToggle(250);

    $question.toggleClass("faq-question--open");
    $question
      .find(".faq-icon")
      .text($question.hasClass("faq-question--open") ? "−" : "+");
  });
}

//11. Like counter yang merupakan salah satu fitur tambahan JQuery//
function initLikeButtons() {
  $(".like-btn").on("click", function () {
    const $button = $(this);
    const $count = $button.find(".like-count");
    let count = parseInt($count.text(), 10);

    if ($button.hasClass("like-btn--active")) {
      count--;
      $button.removeClass("like-btn--active");
    } else {
      count++;
      $button.addClass("like-btn--active");
    }

    $count.text(count);
    $button.find(".like-count").hide().fadeIn(180);
  });
}

//12. Scroll reveal//
function initScrollReveal() {
  $(".product-card, .section-heading, .hero-content, .hero-image")
    .css({
      opacity: 0,
      transform: "translateY(22px)",
    })
    .each(function (index) {
      $(this)
        .delay(index * 80)
        .animate({ opacity: 1 }, 500)
        .css("transform", "translateY(0)");
    });
}

//13. Filter menu yang berisi selector, event, class, dan effect jQuery//
function initMenuFilter() {
  $(".filter-btn").on("click", function () {
    const $button = $(this);
    const selectedFilter = $button.data("filter");

    //Mengubah tombol filter yang sedang aktif.
    $(".filter-btn").removeClass("filter-btn--active");
    $button.addClass("filter-btn--active");

    //Menampilkan kartu sesuai kategori yang dipilih.
    $(".product-card").each(function () {
      const $card = $(this);
      const category = $card.data("category");

      if (selectedFilter === "all" || category === selectedFilter) {
        $card.stop(true, true).fadeIn(200);
      } else {
        $card.stop(true, true).fadeOut(200);
      }
    });
  });
}

/*14. Ini bagian dari back to top*/
function initBackToTop() {
  const $button = $(".back-to-top");

  $(window).on("scroll", function () {
    if ($(window).scrollTop() > 300) {
      $button.stop(true, true).fadeIn(200);
    } else {
      $button.stop(true, true).fadeOut(200);
    }
  });

  $button.on("click", function () {
    $("html, body").animate({ scrollTop: 0 }, 500);
  });
}

function patchCartLink() {
  $(".cart-link span:last-child").addClass("cart-count");
}

//16. Hanya bagian inisialisasi fungsi//
$(document).ready(function () {
  patchCartLink();
  buildCartDrawer();
  initAddToCart();
  initCartLink();
  initCartControls();
  initNavbarScroll();
  initMobileMenu();
  initCardHover();
  initFAQ();
  initLikeButtons();
  initMenuFilter();
  initBackToTop();
  initScrollReveal();
  updateCartUI();
});
