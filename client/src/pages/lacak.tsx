import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Package, ChefHat, CheckCircle, Clock, ShoppingBag, ArrowLeft, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type TrackedOrder = {
  id: string;
  customerName: string;
  tableNumber: string;
  orderType: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  items: any[];
  createdAt: string;
  updatedAt: string;
};

const STATUS_STEPS = [
  { key: "queued",    label: "Pesanan Diterima",  icon: ShoppingBag, color: "#FF9500" },
  { key: "preparing", label: "Sedang Dimasak",    icon: ChefHat,     color: "#FF9500" },
  { key: "ready",     label: "Siap Diambil",      icon: Package,     color: "#34C759" },
  { key: "served",    label: "Selesai",            icon: CheckCircle, color: "#34C759" },
];

const STATUS_INDEX: Record<string, number> = {
  queued: 0,
  preparing: 1,
  ready: 2,
  served: 3,
  cancelled: -1,
};

function getStepIndex(status: string) {
  return STATUS_INDEX[status] ?? 0;
}

function StatusProgress({ status }: { status: string }) {
  const currentIdx = getStepIndex(status);
  const cancelled = status === "cancelled";

  if (cancelled) {
    return (
      <div style={{
        padding: "12px 16px", borderRadius: 10, background: "#FEF2F2",
        color: "#B91C1C", fontSize: 14, fontWeight: 600, textAlign: "center"
      }}>
        Pesanan Dibatalkan
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", position: "relative" }}>
        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              {idx < STATUS_STEPS.length - 1 && (
                <div style={{
                  position: "absolute", top: 17, left: "50%", width: "100%", height: 3,
                  background: idx < currentIdx ? "#FF9500" : "#E5E5EA",
                  zIndex: 0,
                }} />
              )}
              <div style={{
                width: 36, height: 36, borderRadius: "50%", zIndex: 1,
                background: done ? (idx === 3 ? "#34C759" : "#FF9500") : "#F5F5F7",
                border: active ? `3px solid ${step.color}` : "3px solid transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: active ? `0 0 0 4px ${step.color}22` : "none",
                transition: "all 0.3s",
              }}>
                <Icon style={{ width: 16, height: 16, color: done ? "#fff" : "#AEAEB2" }} />
              </div>
              <div style={{
                marginTop: 8, fontSize: 11, fontWeight: active ? 700 : 400,
                color: done ? "#1D1D1F" : "#8E8E93", textAlign: "center", lineHeight: 1.3,
                maxWidth: 70,
              }}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: TrackedOrder }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(order.createdAt);
  const timeStr = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const isPaid = order.paymentStatus === "paid";
  const isActive = !["served", "cancelled"].includes(order.orderStatus);
  const isTakeaway = order.orderType === "take_away";

  const paymentLabel =
    order.paymentStatus === "paid" ? "Lunas" :
    order.paymentStatus === "pending" ? "Menunggu Pembayaran" :
    order.paymentStatus === "unpaid" ? "Belum Dibayar" : order.paymentStatus;

  return (
    <div style={{
      background: "#fff", borderRadius: 16, border: isActive ? "1.5px solid #FF9500" : "1.5px solid #E5E5EA",
      overflow: "hidden", boxShadow: isActive ? "0 4px 20px rgba(255,149,0,0.12)" : "0 2px 8px rgba(0,0,0,0.05)",
    }}>
      <div
        style={{ padding: "16px 20px", cursor: "pointer", userSelect: "none" }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#8E8E93", marginBottom: 2 }}>
              {dateStr} · {timeStr} · {isTakeaway ? "Takeaway" : `Meja ${order.tableNumber}`}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>
              #{order.id.slice(-8).toUpperCase()}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>
              {formatCurrency(order.total)}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 600, marginTop: 3,
              color: isPaid ? "#15803D" : "#92400E",
              background: isPaid ? "#F0FFF4" : "#FFFBEB",
              padding: "2px 8px", borderRadius: 20, display: "inline-block",
            }}>
              {paymentLabel}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <StatusProgress status={order.orderStatus} />
        </div>

        {isActive && (
          <div style={{
            marginTop: 8, padding: "8px 12px", borderRadius: 8,
            background: order.orderStatus === "ready" ? "#F0FFF4" : "#FFF9F0",
            color: order.orderStatus === "ready" ? "#15803D" : "#92400E",
            fontSize: 12, fontWeight: 600, textAlign: "center",
          }}>
            {order.orderStatus === "queued" && "Pesanan kamu sedang menunggu dikonfirmasi"}
            {order.orderStatus === "preparing" && "Dapur sedang menyiapkan pesanan kamu"}
            {order.orderStatus === "ready" && (isTakeaway ? "Pesanan siap! Silakan ambil di kasir" : "Pesanan siap disajikan ke mejamu")}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #F2F2F7", padding: "16px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#8E8E93", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Detail Pesanan
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>{item.name}</div>
                  {item.notes && <div style={{ fontSize: 11, color: "#8E8E93" }}>Catatan: {item.notes}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, color: "#1D1D1F" }}>{formatCurrency(item.price)} x{item.quantity}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #F2F2F7", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Total</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#FF9500" }}>{formatCurrency(order.total)}</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#8E8E93" }}>
            Metode Bayar: {order.paymentMethod === "qris" ? "QRIS" : order.paymentMethod === "cash" ? "Tunai" : order.paymentMethod}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LacakPage() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [orders, setOrders] = useState<TrackedOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const trimmed = phone.trim();
    if (trimmed.length < 5) {
      setError("Masukkan nomor telepon yang valid");
      return;
    }
    setLoading(true);
    setError("");
    setOrders(null);
    try {
      const normalized = trimmed.replace(/\D/g, '');
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(normalized)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Gagal mengambil data pesanan");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setOrders(data);
      setSubmittedPhone(trimmed);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders?.filter(o => !["served", "cancelled"].includes(o.orderStatus)) ?? [];
  const doneOrders = orders?.filter(o => ["served", "cancelled"].includes(o.orderStatus)) ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)",
        padding: "20px 20px 36px",
        position: "relative",
      }}>
        <button
          onClick={() => setLocation("/")}
          style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 20, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6, color: "#fff", cursor: "pointer", marginBottom: 20, fontSize: 13, fontWeight: 600 }}
          data-testid="button-back-home"
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          Kembali
        </button>
        <div style={{ color: "#fff" }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Lacak Pesanan</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Cek status pesanan takeaway kamu</div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px" }}>
        {/* Search Card */}
        <div style={{
          background: "#fff", borderRadius: 20, padding: 24, marginTop: -20,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)", position: "relative", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Phone style={{ width: 16, height: 16, color: "#FF9500" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Nomor Telepon</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Contoh: 08123456789"
              style={{
                flex: 1, padding: "12px 14px", fontSize: 15, fontWeight: 500,
                border: "1.5px solid #E5E5EA", borderRadius: 12, outline: "none",
                fontFamily: "inherit", color: "#1D1D1F",
              }}
              data-testid="input-phone-track"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                padding: "12px 18px", borderRadius: 12, border: "none",
                background: loading ? "#FFAB00" : "#FF9500", color: "#fff",
                fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
                fontFamily: "inherit",
              }}
              data-testid="button-search-orders"
            >
              {loading ? (
                <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.5)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <Search style={{ width: 18, height: 18 }} />
              )}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#B91C1C", fontWeight: 500 }} data-testid="text-error-track">
              {error}
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 11, color: "#8E8E93" }}>
            Masukkan nomor HP yang kamu gunakan saat pesan
          </div>
        </div>

        {/* Results */}
        {orders !== null && (
          <div style={{ marginTop: 24, paddingBottom: 40 }}>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <ShoppingBag style={{ width: 48, height: 48, color: "#AEAEB2", margin: "0 auto 12px" }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F" }}>Tidak ada pesanan</div>
                <div style={{ fontSize: 13, color: "#8E8E93", marginTop: 6 }}>
                  Tidak ditemukan pesanan untuk nomor <strong>{submittedPhone}</strong>
                </div>
              </div>
            ) : (
              <>
                {activeOrders.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#FF9500", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <Clock style={{ width: 14, height: 14 }} />
                      Pesanan Aktif ({activeOrders.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {activeOrders.map(o => <OrderCard key={o.id} order={o} />)}
                    </div>
                  </div>
                )}

                {doneOrders.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#8E8E93", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle style={{ width: 14, height: 14 }} />
                      Riwayat ({doneOrders.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {doneOrders.map(o => <OrderCard key={o.id} order={o} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: #FF9500 !important; box-shadow: 0 0 0 3px rgba(255,149,0,0.12); }
      `}</style>
    </div>
  );
}
