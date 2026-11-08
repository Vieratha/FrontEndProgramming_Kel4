"use client";

import { useEffect, useState } from "react";

// INI BAGIAN TIPE DATA ITEM PESANAN
type OrderItem = {
  id: number;
  menuId: number | null;
  menuName: string;
  price: number;
  quantity: number;
};

// INI BAGIAN TIPE DATA PEMBAYARAN
type PaymentRecord = {
  id: string;
  provider: string;
  method: string;
  reference: string | null;
  status: string;
  amount: number;
  paidAt: string | null;
  createdAt: string;
};

// INI BAGIAN TIPE DATA PESANAN
type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string | null;
  address: string | null;
  paymentMethod: string | null;
  orderType: string;
  tableNumber: string | null;
  note: string | null;
  total: number;
  status: string;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payments: PaymentRecord[];
};

type OrderTypeFilter = "Semua" | "Makan di Tempat" | "Bawa Pulang";

// INI BAGIAN MENENTUKAN STATUS SELANJUTNYA
function getNextStatus(order: Order): string | null {
  switch (order.status) {
    case "Menunggu Konfirmasi":
      return "Dikonfirmasi";

    case "Dikonfirmasi":
      return "Diproses";

    case "Diproses":
      return order.orderType === "Makan di Tempat"
        ? "Siap Disajikan"
        : "Siap Diambil";

    case "Siap Disajikan":
    case "Siap Diambil":
      return order.paymentStatus === "LUNAS" ? "Selesai" : null;

    default:
      return null;
  }
}

// INI BAGIAN MEMERIKSA PESANAN YANG DAPAT DIBATALKAN
function canCancelOrder(status: string) {
  return status === "Menunggu Konfirmasi" || status === "Dikonfirmasi";
}

// INI BAGIAN MEMERIKSA APAKAH PEMBAYARAN DAPAT DIKONFIRMASI
function canMarkPaid(order: Order) {
  const paymentMethod = order.paymentMethod || "Bayar di Kasir";

  return (
    paymentMethod === "Bayar di Kasir" &&
    order.paymentStatus === "BELUM_DIBAYAR" &&
    order.status !== "Dibatalkan"
  );
}

// INI BAGIAN MENENTUKAN WARNA STATUS PESANAN
function getStatusClass(status: string) {
  switch (status) {
    case "Menunggu Konfirmasi":
      return "waiting";

    case "Dikonfirmasi":
      return "confirmed";

    case "Diproses":
      return "processing";

    case "Siap Disajikan":
    case "Siap Diambil":
      return "ready";

    case "Selesai":
      return "completed";

    case "Dibatalkan":
      return "cancelled";

    default:
      return "";
  }
}

// INI BAGIAN MENENTUKAN WARNA STATUS PEMBAYARAN
function getPaymentStatusClass(status: string) {
  switch (status) {
    case "LUNAS":
      return "paid";

    case "MENUNGGU_PEMBAYARAN":
      return "waiting";

    case "GAGAL":
    case "DIBATALKAN":
      return "failed";

    case "KEDALUWARSA":
      return "expired";

    case "DIKEMBALIKAN":
      return "refunded";

    default:
      return "unpaid";
  }
}

// INI BAGIAN MENGUBAH LABEL STATUS PEMBAYARAN
function getPaymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    BELUM_DIBAYAR: "Belum Dibayar",
    MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
    LUNAS: "Lunas",
    GAGAL: "Gagal",
    KEDALUWARSA: "Kedaluwarsa",
    DIBATALKAN: "Dibatalkan",
    DIKEMBALIKAN: "Dikembalikan",
  };

  return labels[status] || status;
}

export default function AdminOrdersPage() {
  // INI BAGIAN DATA PESANAN
  const [orders, setOrders] = useState<Order[]>([]);

  // INI BAGIAN STATUS HALAMAN
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // INI BAGIAN PENCARIAN DAN FILTER
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterPayment, setFilterPayment] = useState("Semua");
  const [filterType, setFilterType] = useState<OrderTypeFilter>("Semua");

  // INI BAGIAN DETAIL PESANAN
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // INI BAGIAN REFRESH DATA
  const [refreshKey, setRefreshKey] = useState(0);

  // INI BAGIAN MEMUAT PESANAN DARI API ADMIN
  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/admin/orders", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil data pesanan.");
        }

        if (!cancelled) {
          const orderData: Order[] = Array.isArray(result.orders)
            ? result.orders
            : [];

          setOrders(orderData);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat mengambil pesanan.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // INI BAGIAN FORMAT RUPIAH
  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(angka);
  };

  // INI BAGIAN FORMAT TANGGAL
  const formatTanggal = (tanggal: string) => {
    return new Date(tanggal).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // INI BAGIAN PENCARIAN DAN FILTER PESANAN
  const filteredOrders = orders.filter((order) => {
    const searchValue = search.trim().toLowerCase();

    const matchSearch =
      order.orderNumber.toLowerCase().includes(searchValue) ||
      order.customerName.toLowerCase().includes(searchValue);

    const matchStatus =
      filterStatus === "Semua" || order.status === filterStatus;

    const matchPayment =
      filterPayment === "Semua" || order.paymentStatus === filterPayment;

    const matchType = filterType === "Semua" || order.orderType === filterType;

    return matchSearch && matchStatus && matchPayment && matchType;
  });

  // INI BAGIAN MENGHITUNG RINGKASAN PESANAN
  const waitingOrders = orders.filter(
    (order) => order.status === "Menunggu Konfirmasi",
  ).length;

  const processingOrders = orders.filter(
    (order) => order.status === "Diproses",
  ).length;

  const unpaidOrders = orders.filter(
    (order) =>
      order.paymentStatus === "BELUM_DIBAYAR" && order.status !== "Dibatalkan",
  ).length;

  const completedOrders = orders.filter(
    (order) => order.status === "Selesai",
  ).length;

  // INI BAGIAN MEMUAT ULANG DAFTAR PESANAN
  const handleRefresh = () => {
    setLoading(true);
    setError("");
    setSuccess("");
    setRefreshKey((previous) => previous + 1);
  };

  // INI BAGIAN MEMPERBARUI DATA PESANAN DI TAMPILAN
  const updateOrderInState = (updatedOrder: Order) => {
    setOrders((previous) =>
      previous.map((item) =>
        item.id === updatedOrder.id ? updatedOrder : item,
      ),
    );

    setSelectedOrder((previous) =>
      previous?.id === updatedOrder.id ? updatedOrder : previous,
    );
  };

  // INI BAGIAN MEMPERBARUI STATUS PESANAN
  const handleUpdateStatus = async (order: Order, targetStatus: string) => {
    if (updatingId) return;

    // INI BAGIAN KONFIRMASI PEMBATALAN
    if (targetStatus === "Dibatalkan") {
      const confirmed = window.confirm(
        `Yakin ingin membatalkan pesanan ${order.orderNumber}?`,
      );

      if (!confirmed) return;
    }

    // INI BAGIAN KONFIRMASI PESANAN SELESAI
    if (targetStatus === "Selesai") {
      const confirmed = window.confirm(
        "Pastikan pesanan sudah disajikan atau diambil dan pembayaran telah Lunas. Tandai pesanan sebagai Selesai?",
      );

      if (!confirmed) return;
    }

    setUpdatingId(order.id);
    setError("");
    setSuccess("");

    try {
      // INI BAGIAN MENGIRIM PERUBAHAN STATUS KE API
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: order.id,
          status: targetStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui status pesanan.");
      }

      const updatedOrder = result.order as Order;

      // INI BAGIAN MEMPERBARUI DATA DI TAMPILAN
      updateOrderInState(updatedOrder);

      setSuccess(
        `Pesanan ${updatedOrder.orderNumber} berhasil diperbarui menjadi ${updatedOrder.status}.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memperbarui pesanan.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // INI BAGIAN MENGONFIRMASI PEMBAYARAN OLEH KASIR
  const handleMarkPaid = async (order: Order) => {
    if (updatingId) return;

    if (!canMarkPaid(order)) {
      setError("Pembayaran pesanan ini tidak dapat dikonfirmasi.");
      return;
    }

    // INI BAGIAN KONFIRMASI PENERIMAAN UANG
    const confirmed = window.confirm(
      `Pastikan uang sebesar ${formatRupiah(order.total)} telah diterima oleh kasir. Tandai pembayaran ${order.orderNumber} sebagai Lunas?`,
    );

    if (!confirmed) return;

    setUpdatingId(order.id);
    setError("");
    setSuccess("");

    try {
      // INI BAGIAN MENGIRIM KONFIRMASI PEMBAYARAN KE SERVER
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: order.id,
          action: "MARK_PAID",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengonfirmasi pembayaran.");
      }

      const updatedOrder = result.order as Order;

      // INI BAGIAN MEMPERBARUI DATA PESANAN
      updateOrderInState(updatedOrder);

      setSuccess(
        `Pembayaran pesanan ${updatedOrder.orderNumber} berhasil dikonfirmasi Lunas.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengonfirmasi pembayaran.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="ao-page">
      {/* INI BAGIAN HEADER HALAMAN */}
      <header className="ao-header">
        <div>
          <p className="ao-breadcrumb">Pesanan</p>
          <h1>Kelola Pesanan</h1>

          <p className="ao-description">
            Pantau pesanan, proses makanan, dan konfirmasi pembayaran customer.
          </p>
        </div>

        <button
          type="button"
          className="ao-refresh-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          ↻ {loading ? "Memuat..." : "Refresh"}
        </button>
      </header>

      {/* INI BAGIAN NOTIFIKASI */}
      {success && (
        <div className="ao-alert ao-alert-success" role="status">
          {success}
        </div>
      )}

      {error && (
        <div className="ao-alert ao-alert-error" role="alert">
          {error}
        </div>
      )}

      {/* INI BAGIAN RINGKASAN PESANAN */}
      <section className="ao-summary">
        <div className="ao-summary-card">
          <span>Menunggu Konfirmasi</span>
          <strong>{loading ? "..." : waitingOrders}</strong>
        </div>

        <div className="ao-summary-card">
          <span>Sedang Diproses</span>
          <strong>{loading ? "..." : processingOrders}</strong>
        </div>

        <div className="ao-summary-card">
          <span>Belum Dibayar</span>
          <strong>{loading ? "..." : unpaidOrders}</strong>
        </div>

        <div className="ao-summary-card">
          <span>Pesanan Selesai</span>
          <strong>{loading ? "..." : completedOrders}</strong>
        </div>
      </section>

      {/* INI BAGIAN PENCARIAN DAN FILTER */}
      <section className="ao-table-card">
        <div className="ao-toolbar">
          <input
            type="search"
            placeholder="Cari nomor pesanan atau nama customer..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Cari pesanan"
          />

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            aria-label="Filter status pesanan"
          >
            <option value="Semua">Semua Status Pesanan</option>
            <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
            <option value="Dikonfirmasi">Dikonfirmasi</option>
            <option value="Diproses">Diproses</option>
            <option value="Siap Disajikan">Siap Disajikan</option>
            <option value="Siap Diambil">Siap Diambil</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
          </select>

          <select
            value={filterPayment}
            onChange={(event) => setFilterPayment(event.target.value)}
            aria-label="Filter status pembayaran"
          >
            <option value="Semua">Semua Pembayaran</option>
            <option value="BELUM_DIBAYAR">Belum Dibayar</option>
            <option value="MENUNGGU_PEMBAYARAN">Menunggu Pembayaran</option>
            <option value="LUNAS">Lunas</option>
            <option value="GAGAL">Gagal</option>
            <option value="KEDALUWARSA">Kedaluwarsa</option>
            <option value="DIBATALKAN">Dibatalkan</option>
            <option value="DIKEMBALIKAN">Dikembalikan</option>
          </select>

          <select
            value={filterType}
            onChange={(event) =>
              setFilterType(event.target.value as OrderTypeFilter)
            }
            aria-label="Filter jenis pesanan"
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Makan di Tempat">Makan di Tempat</option>
            <option value="Bawa Pulang">Bawa Pulang</option>
          </select>
        </div>

        {/* INI BAGIAN TABEL PESANAN */}
        <div className="ao-table-scroll">
          <table className="ao-table">
            <thead>
              <tr>
                <th>Nomor Pesanan</th>
                <th>Pelanggan</th>
                <th>Jenis Pesanan</th>
                <th>Total</th>
                <th>Waktu</th>
                <th>Status Pesanan</th>
                <th>Status Pembayaran</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="ao-empty">
                    Memuat data pesanan...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="ao-empty">
                    Tidak ada pesanan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const nextStatus = getNextStatus(order);
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id}>
                      <td>
                        <strong className="ao-order-number">
                          {order.orderNumber}
                        </strong>
                      </td>

                      <td>{order.customerName}</td>

                      <td>
                        <span className="ao-order-type">{order.orderType}</span>

                        {order.tableNumber && (
                          <small className="ao-table-number">
                            Meja {order.tableNumber}
                          </small>
                        )}
                      </td>

                      <td className="ao-price">{formatRupiah(order.total)}</td>

                      <td className="ao-date">
                        {formatTanggal(order.createdAt)}
                      </td>

                      {/* INI BAGIAN STATUS PESANAN */}
                      <td>
                        <span
                          className={`ao-status ${getStatusClass(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* INI BAGIAN STATUS PEMBAYARAN */}
                      <td>
                        <span
                          className={`ao-payment-status ${getPaymentStatusClass(order.paymentStatus)}`}
                        >
                          {getPaymentStatusLabel(order.paymentStatus)}
                        </span>
                      </td>

                      {/* INI BAGIAN AKSI PESANAN */}
                      <td>
                        <div className="ao-actions">
                          <button
                            type="button"
                            className="ao-detail-button"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Detail
                          </button>

                          {canMarkPaid(order) && (
                            <button
                              type="button"
                              className="ao-payment-button"
                              onClick={() => handleMarkPaid(order)}
                              disabled={Boolean(updatingId)}
                            >
                              {isUpdating ? "Memproses..." : "Tandai Lunas"}
                            </button>
                          )}

                          {nextStatus && (
                            <button
                              type="button"
                              className="ao-process-button"
                              onClick={() =>
                                handleUpdateStatus(order, nextStatus)
                              }
                              disabled={Boolean(updatingId)}
                            >
                              {isUpdating ? "Memproses..." : nextStatus}
                            </button>
                          )}

                          {canCancelOrder(order.status) && (
                            <button
                              type="button"
                              className="ao-cancel-button"
                              onClick={() =>
                                handleUpdateStatus(order, "Dibatalkan")
                              }
                              disabled={Boolean(updatingId)}
                            >
                              Batalkan
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* INI BAGIAN JUMLAH HASIL FILTER */}
        {!loading && (
          <p className="ao-result-count">
            Menampilkan {filteredOrders.length} dari {orders.length} pesanan.
          </p>
        )}
      </section>

      {/* INI BAGIAN MODAL DETAIL PESANAN */}
      {selectedOrder && (
        <div
          className="ao-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !updatingId) {
              setSelectedOrder(null);
            }
          }}
        >
          <section
            className="ao-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ao-modal-title"
          >
            <div className="ao-modal-header">
              <div>
                <p>Detail Pesanan</p>
                <h2 id="ao-modal-title">{selectedOrder.orderNumber}</h2>
              </div>

              <button
                type="button"
                className="ao-close-button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Tutup detail"
                disabled={Boolean(updatingId)}
              >
                ×
              </button>
            </div>

            {/* INI BAGIAN STATUS PESANAN */}
            <div className="ao-modal-status">
              <span>Status Pesanan</span>

              <strong
                className={`ao-status ${getStatusClass(selectedOrder.status)}`}
              >
                {selectedOrder.status}
              </strong>
            </div>

            {/* INI BAGIAN STATUS PEMBAYARAN */}
            <div className="ao-modal-status">
              <span>Status Pembayaran</span>

              <strong
                className={`ao-payment-status ${getPaymentStatusClass(selectedOrder.paymentStatus)}`}
              >
                {getPaymentStatusLabel(selectedOrder.paymentStatus)}
              </strong>
            </div>

            {/* INI BAGIAN INFORMASI CUSTOMER */}
            <div className="ao-detail-section">
              <h3>Informasi Pemesan</h3>

              <div className="ao-detail-grid">
                <div>
                  <span>Nama Customer</span>
                  <strong>{selectedOrder.customerName}</strong>
                </div>

                <div>
                  <span>Jenis Pesanan</span>
                  <strong>{selectedOrder.orderType}</strong>
                </div>

                {selectedOrder.tableNumber && (
                  <div>
                    <span>Nomor Meja</span>
                    <strong>{selectedOrder.tableNumber}</strong>
                  </div>
                )}

                {selectedOrder.phone && (
                  <div>
                    <span>Nomor Telepon</span>
                    <strong>{selectedOrder.phone}</strong>
                  </div>
                )}

                <div>
                  <span>Metode Pembayaran</span>
                  <strong>
                    {selectedOrder.paymentMethod || "Bayar di Kasir"}
                  </strong>
                </div>

                <div>
                  <span>Waktu Pemesanan</span>
                  <strong>{formatTanggal(selectedOrder.createdAt)}</strong>
                </div>

                {selectedOrder.paidAt && (
                  <div>
                    <span>Waktu Pembayaran</span>
                    <strong>{formatTanggal(selectedOrder.paidAt)}</strong>
                  </div>
                )}
              </div>

              {selectedOrder.address && (
                <div className="ao-detail-note">
                  <span>Alamat</span>
                  <p>{selectedOrder.address}</p>
                </div>
              )}

              {selectedOrder.note && (
                <div className="ao-detail-note">
                  <span>Catatan Customer</span>
                  <p>{selectedOrder.note}</p>
                </div>
              )}
            </div>

            {/* INI BAGIAN ITEM PESANAN */}
            <div className="ao-detail-section">
              <h3>Rincian Menu</h3>

              <div className="ao-detail-items">
                {selectedOrder.items.map((item) => (
                  <div className="ao-detail-item" key={item.id}>
                    <div>
                      <strong>{item.menuName}</strong>
                      <span>
                        {item.quantity} × {formatRupiah(item.price)}
                      </span>
                    </div>

                    <strong>{formatRupiah(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>

              {/* INI BAGIAN TOTAL PESANAN */}
              <div className="ao-detail-total">
                <span>Total Pembayaran</span>
                <strong>{formatRupiah(selectedOrder.total)}</strong>
              </div>
            </div>

            {/* INI BAGIAN RIWAYAT TRANSAKSI PEMBAYARAN */}
            {selectedOrder.payments.length > 0 && (
              <div className="ao-detail-section">
                <h3>Riwayat Pembayaran</h3>

                <div className="ao-detail-items">
                  {selectedOrder.payments.map((payment) => (
                    <div className="ao-detail-item" key={payment.id}>
                      <div>
                        <strong>{payment.method}</strong>
                        <span>{payment.reference || "Tanpa referensi"}</span>
                        <span>{getPaymentStatusLabel(payment.status)}</span>
                      </div>

                      <strong>{formatRupiah(payment.amount)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INI BAGIAN AKSI STATUS DAN PEMBAYARAN */}
            <div className="ao-modal-actions">
              {canMarkPaid(selectedOrder) && (
                <button
                  type="button"
                  className="ao-payment-button"
                  onClick={() => handleMarkPaid(selectedOrder)}
                  disabled={Boolean(updatingId)}
                >
                  {updatingId === selectedOrder.id
                    ? "Memproses..."
                    : "Tandai Pembayaran Lunas"}
                </button>
              )}

              {getNextStatus(selectedOrder) && (
                <button
                  type="button"
                  className="ao-process-button"
                  onClick={() =>
                    handleUpdateStatus(
                      selectedOrder,
                      getNextStatus(selectedOrder)!,
                    )
                  }
                  disabled={Boolean(updatingId)}
                >
                  {updatingId === selectedOrder.id
                    ? "Memproses..."
                    : `Ubah ke ${getNextStatus(selectedOrder)}`}
                </button>
              )}

              {canCancelOrder(selectedOrder.status) && (
                <button
                  type="button"
                  className="ao-cancel-button"
                  onClick={() =>
                    handleUpdateStatus(selectedOrder, "Dibatalkan")
                  }
                  disabled={Boolean(updatingId)}
                >
                  Batalkan Pesanan
                </button>
              )}

              <button
                type="button"
                className="ao-secondary-button"
                onClick={() => setSelectedOrder(null)}
                disabled={Boolean(updatingId)}
              >
                Tutup
              </button>
            </div>

            {selectedOrder.status === "Selesai" && (
              <p className="ao-payment-note">
                Pesanan sudah selesai dan pembayaran berstatus Lunas.
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
