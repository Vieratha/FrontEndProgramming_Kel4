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

function updateCartUI() {
  const count = getCartCount();
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = `Cart (${count})`;
  });
  renderCartDrawer();
}

//2. Notifikasi "Toast", untuk menampilkan jenis notifikasi toast//
function showToast(message) {
  const existing = document.querySelector(".kn-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "kn-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("kn-toast--show"));
  });

  setTimeout(() => {
    toast.classList.remove("kn-toast--show");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
  }, 2500);
}

//3. Cart drawer untuk membuat drawer untuk menampilkan isi keranjang//
function buildCartDrawer() {
  //Overlaynya
  const overlay = document.createElement("div");
  overlay.className = "kn-overlay";
  overlay.addEventListener("click", closeCartDrawer);

  //Pada setiap tombolnya menyimpan posisi item di array cart agar event handler tahu item mana yang diubah.//
  //Drawernya
  const drawer = document.createElement("div");
  drawer.className = "kn-drawer";
  drawer.setAttribute("aria-label", "Keranjang belanja");
  drawer.innerHTML = `
    <div class="kn-drawer__header">
      <h2 class="kn-drawer__title">🛒 Keranjang Kamu</h2>
      <button class="kn-drawer__close" aria-label="Tutup keranjang">✕</button>
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
      <button class="kn-checkout-btn">Pesan Sekarang</button>
    </div>
  `;

  drawer
    .querySelector(".kn-drawer__close")
    .addEventListener("click", closeCartDrawer);
  drawer
    .querySelector(".kn-checkout-btn")
    .addEventListener("click", handleCheckout);

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);
}

function renderCartDrawer() {
  const list = document.querySelector(".kn-cart-list");
  const empty = document.querySelector(".kn-cart-empty");
  const totalEl = document.querySelector(".kn-total-price");
  if (!list) return;

  list.innerHTML = "";

  if (cart.length === 0) {
    list.style.display = "none";
    empty.style.display = "flex";
  } else {
    list.style.display = "block";
    empty.style.display = "none";

    cart.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "kn-cart-item";
      li.innerHTML = `
        <div class="kn-cart-item__info">
          <span class="kn-cart-item__name">${item.name}</span>
          <span class="kn-cart-item__price">${item.price}</span>
        </div>
        <div class="kn-cart-item__controls">
          <button class="kn-qty-btn kn-qty-minus" data-index="${index}" aria-label="Kurangi">−</button>
          <span class="kn-qty-num">${item.qty}</span>
          <button class="kn-qty-btn kn-qty-plus" data-index="${index}" aria-label="Tambah">+</button>
          <button class="kn-remove-btn" data-index="${index}" aria-label="Hapus">🗑</button>
        </div>
      `;
      list.appendChild(li);
    });

    //Fungsinya sendiri untuk mengelola perubahan jumlah dan penghapusan item//
    //Ini bagian qty & remove events
    list.querySelectorAll(".kn-qty-minus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.index);
        if (cart[i].qty > 1) {
          cart[i].qty--;
        } else {
          cart.splice(i, 1);
        }
        updateCartUI();
      });
    });

    list.querySelectorAll(".kn-qty-plus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.index);
        cart[i].qty++;
        updateCartUI();
      });
    });

    list.querySelectorAll(".kn-remove-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = parseInt(btn.dataset.index);
        const name = cart[i].name;
        cart.splice(i, 1);
        updateCartUI();
        showToast(`🗑 ${name} dihapus dari keranjang`);
      });
    });
  }

  totalEl.textContent = formatRupiah(getCartTotal());
}

function openCartDrawer() {
  document.querySelector(".kn-drawer").classList.add("kn-drawer--open");
  document.querySelector(".kn-overlay").classList.add("kn-overlay--show");
  document.body.style.overflow = "hidden";
}

function closeCartDrawer() {
  document.querySelector(".kn-drawer").classList.remove("kn-drawer--open");
  document.querySelector(".kn-overlay").classList.remove("kn-overlay--show");
  document.body.style.overflow = "";
}

function handleCheckout() {
  if (cart.length === 0) {
    showToast("⚠️ Keranjang masih kosong!");
    return;
  }
  const items = cart.map((i) => `${i.name} x${i.qty}`).join(", ");
  showToast(`✅ Pesanan dikirim: ${items}`);
  cart.length = 0;
  updateCartUI();
  setTimeout(closeCartDrawer, 600);
}

//4. Bagian add to card untuk menambahkan produk ke keranjang//
function initAddToCart() {
  document.querySelectorAll(".add-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const card = this.closest(".product-card");
      const name = card.querySelector("h3").textContent.trim();
      const price = card
        .querySelector(".product-footer strong")
        .textContent.trim();

      const existing = cart.find((i) => i.name === name);
      if (existing) {
        existing.qty++;
      } else {
        cart.push({ name, price, qty: 1 });
      }

      updateCartUI();
      showToast(`☕ ${name} ditambahkan ke keranjang!`);

      this.textContent = "✓ Added";
      this.style.background = "#2e7d32";
      setTimeout(() => {
        this.textContent = "Add to Cart";
        this.style.background = "";
      }, 1200);
    });
  });
}

//5. Ini ketika cart link diklik akan open drawer//
function initCartLink() {
  document.querySelectorAll(".cart-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });
}

//6. Menambahkan bayangan navbar saat di-scroll*/
function initNavbarScroll() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle("navbar--scrolled", window.scrollY > 10);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

//7. Menampilkan elemen saat di-scroll Ke kalam viewport//
function initScrollReveal() {
  const targets = document.querySelectorAll(
    ".product-card, .section-heading, .hero-content, .hero-image",
  );
  targets.forEach((el) => el.classList.add("kn-reveal"));

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("kn-reveal--visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("kn-reveal--visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );

  targets.forEach((el) => observer.observe(el));
}

//8. Membuat "Menu Hamburger" untuk tampilan mobile//
function initMobileMenu() {
  const navbar = document.querySelector(".navbar");
  const navLinks = document.querySelector(".nav-links");
  if (!navbar || !navLinks) return;

  const burger = document.createElement("button");
  burger.className = "kn-burger";
  burger.setAttribute("aria-label", "Toggle menu");
  burger.innerHTML = `<span></span><span></span><span></span>`;
  navbar.appendChild(burger);

  burger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("nav-links--open");
    burger.classList.toggle("kn-burger--open", isOpen);
    burger.setAttribute("aria-expanded", isOpen);
  });

  navLinks.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      navLinks.classList.remove("nav-links--open");
      burger.classList.remove("kn-burger--open");
    });
  });
}

//9. Menambahkan efek hover pada kartu produk//
function initCardHover() {
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-4px)";
      card.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
      card.style.transition = "transform 0.22s ease, box-shadow 0.22s ease";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.style.boxShadow = "";
    });
  });
}

//10. Memperbaiki teks tautan keranjang//
function patchCartLink() {
  document.querySelectorAll(".cart-link span:last-child").forEach((el) => {
    el.classList.add("cart-count");
  });
}

//11. Hanya bagian inisialisasi fungsi//
document.addEventListener("DOMContentLoaded", () => {
  patchCartLink();
  buildCartDrawer();
  initAddToCart();
  initCartLink();
  initNavbarScroll();
  initScrollReveal();
  initMobileMenu();
  initCardHover();
});
