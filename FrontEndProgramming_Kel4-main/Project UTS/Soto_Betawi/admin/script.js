/*Ini bagian mengecek login admin*/
if (localStorage.getItem("sotoBetawiAdminLogin") !== "true") {
  window.location.href = "login.html";
}

/*Ini bagian data pesanan admin*/
var ORDERS_KEY = "sotoBetawiOrders";

/*Ini bagian mengambil data pesanan*/
function loadOrders() {
  try {
    var data = JSON.parse(localStorage.getItem(ORDERS_KEY));
    if (!Array.isArray(data)) {
      return [];
    }
    return data;
  } catch (error) {
    return [];
  }
}

/*Ini bagian format harga*/
function rupiah(value) {
  return "Rp" + Number(value || 0).toLocaleString("id-ID");
}

/*Ini bagian format waktu pesanan*/
function formatOrderTime(time) {
  var date = new Date(time);
  var today = new Date();
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    return (
      "Hari ini, " +
      String(date.getHours()).padStart(2, "0") +
      ":" +
      String(date.getMinutes()).padStart(2, "0")
    );
  }
  return (
    date.getDate() +
    "/" +
    (date.getMonth() + 1) +
    " " +
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0")
  );
}

/*Ini bagian menampilkan statistik*/
function renderStats(orders) {
  var totalOrders = orders.length;
  var today = new Date();
  var todayKey =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  var todayOrders = orders.filter(function (order) {
    return order.day === todayKey;
  });
  var totalRevenue = orders.reduce(function (total, order) {
    return total + Number(order.total || 0);
  }, 0);
  var totalItems = orders.reduce(function (total, order) {
    return (
      total +
      order.items.reduce(function (sum, item) {
        return sum + Number(item.qty || 0);
      }, 0)
    );
  }, 0);
  document.getElementById("totalOrders").textContent = totalOrders;
  document.getElementById("todayOrders").textContent = todayOrders.length;
  document.getElementById("totalRevenue").textContent = rupiah(totalRevenue);
  document.getElementById("totalItems").textContent = totalItems;
}

/*Ini bagian menampilkan pesanan terbaru*/
function renderRecentOrders(orders) {
  var container = document.getElementById("recentOrders");
  if (orders.length === 0) {
    container.innerHTML =
      '<tr><td colspan="4" class="empty-data">Belum ada pesanan.</td></tr>';
    return;
  }

  var recentOrders = orders
    .slice()
    .sort(function (a, b) {
      return new Date(b.time) - new Date(a.time);
    })
    .slice(0, 5);
  
  container.innerHTML = recentOrders
    .map(function (order) {
      var status = String(order.status || "Baru").toLowerCase();
      return `
      <tr>
        <td>#${order.no || "-"}</td>
        <td>${order.name || "Pelanggan"}</td>
        <td>${rupiah(order.total)}</td>
        <td>${formatOrderTime(order.time)}</td>
        <td>
        <span class="status ${status}">
            ${order.status || "Baru"}
        </span>
        </td>
      </tr>
    `;
    })
    .join("");
}

/*Ini bagian menghitung menu yang paling banyak dipesan*/
function getBestMenus(orders) {
  var menuData = {};
  orders.forEach(function (order) {
    if (!Array.isArray(order.items)) {
      return;
    }
    order.items.forEach(function (item) {
      var name = item.name || "Menu";
      if (!menuData[name]) {
        menuData[name] = 0;
      }
      menuData[name] += Number(item.qty || 0);
    });
  });
  return Object.keys(menuData)
    .map(function (name) {
      return {
        name: name,
        qty: menuData[name],
      };
    })
    .sort(function (a, b) {
      return b.qty - a.qty;
    })
    .slice(0, 5);
}

/*Ini bagian menampilkan menu terlaris*/
function renderBestMenus(orders) {
  var container = document.getElementById("bestMenus");
  var menus = getBestMenus(orders);
  if (menus.length === 0) {
    container.innerHTML = '<div class="empty-data">Belum ada data menu.</div>';
    return;
  }
  var maxQty = menus[0].qty;

  container.innerHTML = menus
    .map(function (menu) {
      var percentage = (menu.qty / maxQty) * 100;
      return `
      <div class="best-menu">
        <div class="best-menu-info">
          <span class="best-menu-name">
            ${menu.name}
          </span>
          <span class="best-menu-count">
            ${menu.qty} terjual
          </span>
        </div>
        <div class="best-menu-bar">
          <div
            class="best-menu-fill"
            style="width: ${percentage}%">
          </div>
        </div>

      </div>
    `;
    })
    .join("");
}

/*Ini bagian menjalankan dashboard*/
function initDashboard() {
  var orders = loadOrders();
  renderStats(orders);
  renderRecentOrders(orders);
  renderBestMenus(orders);
}
initDashboard();

/*Ini bagian logout admin*/
var adminLogout = document.getElementById("adminLogout");
if (adminLogout) {
  adminLogout.addEventListener("click", function () {
    localStorage.removeItem("sotoBetawiAdminLogin");

    window.location.href = "login.html";
  });
}

/*Ini bagian sinkronisasi pesanan*/
window.addEventListener("storage", function (event) {
  if (event.key === ORDERS_KEY) {
    initDashboard();
  }
});
