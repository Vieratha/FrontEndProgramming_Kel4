/*Ini bagian data menu admin*/
var MENU_KEY = "sotoBetawiMenus";

/*Ini bagian mengambil data menu*/
function loadMenus() {
  try {
    var data = JSON.parse(localStorage.getItem(MENU_KEY));
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  } catch (error) {
    return [];
  }
}

/*Ini bagian menyimpan data menu*/
function saveMenus(menus) {
  localStorage.setItem(MENU_KEY, JSON.stringify(menus));
}

/*Ini bagian menu awal*/
function createDefaultMenus() {
  var menus = loadMenus();
  if (menus.length > 0) {
    return;
  }

  var defaultMenus = [
    {
      id: "soto-betawi",
      name: "Soto Betawi Spesial",
      category: "Makanan",
      price: 48000,
      status: "Tersedia",
      description: "Soto Betawi khas Jakarta.",
      image: "../images/menu-soto.jpeg",
    },

    {
      id: "nasi-uduk",
      name: "Nasi Uduk",
      category: "Makanan",
      price: 35000,
      status: "Tersedia",
      description: "Nasi uduk dengan lauk khas Betawi.",
      image: "../images/menu-nasi-uduk.jpeg",
    },

    {
      id: "kerak-telor",
      name: "Kerak Telor",
      category: "Makanan",
      price: 28000,
      status: "Tersedia",
      description: "Makanan tradisional khas Betawi.",
      image: "../images/menu-kerak-telor.jpeg",
    },

    {
      id: "bir-pletok",
      name: "Bir Pletok",
      category: "Minuman",
      price: 18000,
      status: "Tersedia",
      description: "Minuman tradisional khas Betawi.",
      image: "../images/menu-bir-pletok.jpeg",
    },
  ];

  saveMenus(defaultMenus);
}

/*Ini bagian memperbaiki gambar menu awal*/
function restoreDefaultImages() {
  var menus = loadMenus();
  var defaultImages = {
    "soto-betawi": "../images/menu-soto.jpeg",
    "nasi-uduk": "../images/menu-nasi-uduk.jpeg",
    "kerak-telor": "../images/menu-kerak-telor.jpeg",
    "bir-pletok": "../images/menu-bir-pletok.jpeg",
  };
  var changed = false;
  menus = menus.map(function (menu) {
    if (defaultImages[menu.id] && !menu.image) {
      menu.image = defaultImages[menu.id];
      changed = true;
    }
    return menu;
  });
  if (changed) {
    saveMenus(menus);
  }
}

/*Ini bagian format harga*/
function rupiah(value) {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
}

/*Ini bagian menampilkan menu*/
function renderMenus() {
  var menus = loadMenus();
  var search = document.getElementById("adminMenuSearch").value.toLowerCase();
  var category = document.getElementById("adminMenuCategory").value;
  var filteredMenus = menus.filter(function (menu) {
    var matchName = menu.name.toLowerCase().includes(search);
    var matchCategory = category === "Semua" || menu.category === category;
    return matchName && matchCategory;
  });
  var table = document.getElementById("menuTableBody");
  if (filteredMenus.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="5" class="empty-data">
          Menu tidak ditemukan.
        </td>
      </tr>
    `;
    return;
  }
  /*Ini bagian menampilkan data menu*/
  table.innerHTML = filteredMenus
    .map(function (menu) {
      var statusClass =
        menu.status === "Tersedia" ? "available" : "unavailable";
      return `
        <tr>
          <td>
            <strong>${menu.name}</strong>
          </td>
          <td>
            ${menu.category}
          </td>
          <td>
            ${rupiah(menu.price)}
          </td>
          <td>
            <span class="menu-status ${statusClass}">
              ${menu.status}
            </span>
          </td>
          <td>
            <div class="menu-action">
              <button
                type="button"
                class="menu-edit"
                onclick="editMenu('${menu.id}')"
              >
                Edit
              </button>
              <button
                type="button"
                class="menu-delete"
                onclick="deleteMenu('${menu.id}')"
              >
                Hapus
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

/*Ini bagian membuka modal*/
function openMenuModal() {
  document.getElementById("menuModal").classList.add("show");
}

/*Ini bagian menutup modal*/
function closeMenuModal() {
  document.getElementById("menuModal").classList.remove("show");
}

/*Ini bagian reset form*/
function resetMenuForm() {
  document.getElementById("menuForm").reset();
  document.getElementById("menuId").value = "";
  document.getElementById("menuImage").dataset.currentImage = "";
  document.getElementById("menuImagePreview").hidden = true;
  document.getElementById("menuImagePreview").removeAttribute("src");
  document.getElementById("modalTitle").textContent = "Tambah Menu";
}

/*Ini bagian preview gambar menu*/
function showMenuImagePreview(image) {
  var preview = document.getElementById("menuImagePreview");
  if (!image) {
    preview.hidden = true;
    preview.removeAttribute("src");
    return;
  }
  preview.src = image;
  preview.hidden = false;
}

/*Ini bagian memilih gambar menu*/
document.getElementById("menuImage").addEventListener("change", function () {
  var file = this.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function (event) {
    document.getElementById("menuImage").dataset.currentImage =
      event.target.result;
    showMenuImagePreview(event.target.result);
  };
  reader.readAsDataURL(file);
});

/*Ini bagian edit menu*/
function editMenu(id) {
  var menus = loadMenus();
  var menu = menus.find(function (item) {
    return item.id === id;
  });
  if (!menu) {
    return;
  }
  document.getElementById("menuId").value = menu.id;
  document.getElementById("menuName").value = menu.name;
  document.getElementById("menuCategory").value = menu.category;
  document.getElementById("menuPrice").value = menu.price;
  document.getElementById("menuStatus").value = menu.status;
  document.getElementById("menuDescription").value = menu.description;
  document.getElementById("menuImage").value = "";
  document.getElementById("menuImage").dataset.currentImage = menu.image || "";
  var preview = document.getElementById("menuImagePreview");
  if (menu.image) {
    preview.src = menu.image;
    preview.hidden = false;
  } else {
    preview.hidden = true;
    preview.removeAttribute("src");
  }
  showMenuImagePreview(menu.image || "");
  document.getElementById("modalTitle").textContent = "Edit Menu";
  openMenuModal();
}

/*Ini bagian hapus menu*/
function deleteMenu(id) {
  var menus = loadMenus();
  var menu = menus.find(function (item) {
    return item.id === id;
  });
  if (!menu) {
    return;
  }
  var confirmDelete = confirm('Hapus menu "' + menu.name + '"?');
  if (!confirmDelete) {
    return;
  }
  menus = menus.filter(function (item) {
    return item.id !== id;
  });
  saveMenus(menus);
  renderMenus();
}

/*Ini bagian memilih gambar menu*/
document.getElementById("menuImage").addEventListener("change", function () {
  var file = this.files[0];
  if (!file) {
    return;
  }
  var reader = new FileReader();
  reader.onload = function (event) {
    document.getElementById("menuImage").dataset.currentImage =
      event.target.result;
    var preview = document.getElementById("menuImagePreview");
    preview.src = event.target.result;
    preview.hidden = false;
  };
  reader.readAsDataURL(file);
});

/*Ini bagian menyimpan menu*/
document
  .getElementById("menuForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    var id = document.getElementById("menuId").value;
    var name = document.getElementById("menuName").value.trim();
    var category = document.getElementById("menuCategory").value;
    var price = Number(document.getElementById("menuPrice").value);
    var status = document.getElementById("menuStatus").value;
    var description = document.getElementById("menuDescription").value.trim();
    var imageInput = document.getElementById("menuImage");
    var image = imageInput.dataset.currentImage || "";
    var menus = loadMenus();

    if (id) {
      /*Ini bagian mengubah menu*/
      menus = menus.map(function (menu) {
        if (menu.id === id) {
          return {
            id: id,
            name: name,
            category: category,
            price: price,
            status: status,
            description: description,
            image: image,
          };
        }
        return menu;
      });
    } else {
      /*Ini bagian menambahkan menu*/
      menus.push({
        id: "menu-" + Date.now(),
        name: name,
        category: category,
        price: price,
        status: status,
        description: description,
        image: image,
      });
    }
    saveMenus(menus);
    renderMenus();
    closeMenuModal();
    resetMenuForm();
  });

/*Ini tombol tambah menu*/
document.getElementById("addMenuButton").addEventListener("click", function () {
  resetMenuForm();
  openMenuModal();
});

/*Ini tombol tutup modal*/
document
  .getElementById("closeMenuModal")
  .addEventListener("click", closeMenuModal);

/*Ini tombol batal*/
document.getElementById("cancelMenu").addEventListener("click", closeMenuModal);

/*Ini bagian pencarian menu*/
document
  .getElementById("adminMenuSearch")
  .addEventListener("input", renderMenus);

/*Ini bagian filter kategori*/
document
  .getElementById("adminMenuCategory")
  .addEventListener("change", renderMenus);

/*Ini bagian logout admin*/
var adminLogout = document.getElementById("adminLogout");
if (adminLogout) {
  adminLogout.addEventListener("click", function () {
    localStorage.removeItem("sotoBetawiAdminLogin");
    window.location.href = "login.html";
  });
}

/*Ini bagian menjalankan halaman menu*/
createDefaultMenus();
restoreDefaultImages();
renderMenus();
