import { useState } from "react";
import { useLocation } from "wouter";
import { PackageSearch, ChefHat, CheckCircle, ShoppingBag, ArrowLeft, Phone, Package, ChevronDown, ChevronUp, Utensils, AlertCircle } from "lucide-react";
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
  { key: "queued",    label: "Diterima",  icon: ShoppingBag },
  { key: "preparing", label: "Dimasak",   icon: ChefHat },
  { key: "ready",     label: "Siap",      icon: Package },
  { key: "served",    label: "Selesai",   icon: CheckCircle },
];

const STATUS_INDEX: Record<string, number> = {
  queued: 0, preparing: 1, ready: 2, served: 3, cancelled: -1,
};

const STATUS_MESSAGE: Record<string, { text: string; emoji: string; color: string; bg: string; border: string }> = {
  queued:    { text: "Pesanan sudah masuk, menunggu konfirmasi dapur", emoji: "⏳", color: "#92400E", bg: "#FFFBEB", border: "#FDE68A" },
  preparing: { text: "Dapur sedang menyiapkan pesanan kamu!", emoji: "👨‍🍳", color: "#C2410C", bg: "#FFF7ED", border: "#FED7AA" },
  ready:     { text: "Pesanan kamu sudah siap! Silakan ambil di kasir", emoji: "✅", color: "#15803D", bg: "#F0FFF4", border: "#86EFAC" },
  served:    { text: "Selamat menikmati! Terima kasih sudah berkunjung", emoji: "🎉", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
  cancelled: { text: "Pesanan ini dibatalkan", emoji: "❌", color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
};

function ProgressTracker({ status }: { status: string }) {
  const currentIdx = STATUS_INDEX[status] ?? 0;

  if (status === "cancelled") {
    return (
      <div style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
        Pesanan Dibatalkan
      </div>
    );
  }

  const filledPct = currentIdx === 0 ? 0 : (currentIdx / 3) * 100;

  return (
    <div style={{ margin: "18px 0 6px" }}>
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* Track base */}
        <div style={{ position: "absolute", top: 17, left: "8%", right: "8%", height: 2, background: "#E5E5EA", borderRadius: 99, zIndex: 0 }} />
        {/* Track filled */}
        <div style={{
          position: "absolute", top: 17, left: "8%",
          height: 2, borderRadius: 99, zIndex: 1,
          background: currentIdx >= 3 ? "#34C759" : "linear-gradient(90deg, #FF9500, #FFAB00)",
          width: `${filledPct * 0.84}%`,
          transition: "width 0.5s ease",
        }} />

        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          const Icon = step.icon;
          const color = done ? (idx === 3 ? "#34C759" : "#FF9500") : "#C7C7CC";

          return (
            <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative", zIndex: 2 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: done ? color : "#F2F2F7",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: active ? `0 0 0 4px ${idx === 3 ? "#34C75920" : "#FF950025"}` : "none",
                border: active ? "2px solid white" : "none",
                transition: "all 0.35s",
              }}>
                <Icon style={{ width: 15, height: 15, color: done ? "#fff" : "#C7C7CC" }} />
              </div>
              <div style={{ marginTop: 6, fontSize: 10, fontWeight: active ? 800 : done ? 600 : 400, color: active ? "#1D1D1F" : done ? "#6E6E73" : "#AEAEB2", textAlign: "center", lineHeight: 1.3 }}>
                {step.label}
              </div>
              {active && (
                <div style={{ fontSize: 8, color: "#FF9500", fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>
                  SEKARANG
                </div>
              )}
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
  const dateStr = date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const isTakeaway = order.orderType === "take_away";
  const isActive = !["served", "cancelled"].includes(order.orderStatus);
  const isPaid = order.paymentStatus === "paid";
  const msg = STATUS_MESSAGE[order.orderStatus];
  const items = Array.isArray(order.items) ? order.items : [];

  const paymentLabel = order.paymentStatus === "paid" ? "Lunas" :
    order.paymentStatus === "pending" ? "Menunggu" :
    order.paymentStatus === "unpaid" ? "Belum Bayar" : order.paymentStatus;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 18,
      overflow: "hidden",
      border: `1.5px solid ${isActive ? (order.orderStatus === "ready" ? "#86EFAC" : "#FFD480") : "#F0F0F0"}`,
      boxShadow: isActive
        ? `0 2px 20px rgba(${order.orderStatus === "ready" ? "52,199,89" : "255,149,0"},0.12)`
        : "0 1px 6px rgba(0,0,0,0.05)",
    }}>
      {/* Status stripe */}
      <div style={{
        height: 3,
        background: order.orderStatus === "ready" ? "linear-gradient(90deg,#34C759,#30D158)" :
          order.orderStatus === "served" ? "#C7C7CC" :
          order.orderStatus === "cancelled" ? "#FF3B30" :
          "linear-gradient(90deg,#FF9500,#FFAB00)",
      }} />

      <div style={{ padding: "16px 18px 18px" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#1D1D1F", fontFamily: "monospace", letterSpacing: -0.5 }}>
                #{order.id.slice(-8).toUpperCase()}
              </span>
              {isActive && (
                <span style={{ fontSize: 9, fontWeight: 800, background: "linear-gradient(135deg,#FF9500,#FFAB00)", color: "#fff", padding: "2px 7px", borderRadius: 99, letterSpacing: 0.3 }}>
                  AKTIF
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#AEAEB2" }}>{dateStr} · {timeStr}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: isTakeaway ? "#7C3AED" : "#6E6E73",
                background: isTakeaway ? "#EDE9FE" : "#F5F5F7",
                padding: "2px 8px", borderRadius: 99,
              }}>
                {isTakeaway ? "Takeaway" : `Meja ${order.tableNumber}`}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1D1D1F" }}>
              {formatCurrency(order.total)}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: isPaid ? "#15803D" : "#92400E",
              background: isPaid ? "#DCFCE7" : "#FEF3C7",
              padding: "2px 8px", borderRadius: 99,
            }}>
              {paymentLabel}
            </span>
          </div>
        </div>

        {/* Progress */}
        <ProgressTracker status={order.orderStatus} />

        {/* Status message bubble */}
        {msg && (
          <div style={{
            marginTop: 14, padding: "10px 14px",
            borderRadius: 12, border: `1px solid ${msg.border}`,
            background: msg.bg, display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>{msg.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: msg.color, lineHeight: 1.5 }}>{msg.text}</span>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            marginTop: 14, width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: "none", border: "1.5px solid #F0F0F0", borderRadius: 10, padding: "8px 0",
            cursor: "pointer", color: "#8E8E93", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
            transition: "background 0.15s",
          }}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? "Sembunyikan" : `Lihat ${items.length} item`}
        </button>
      </div>

      {/* Items */}
      {expanded && (
        <div style={{ borderTop: "1px solid #F5F5F7", padding: "14px 18px 18px", background: "#FAFAFA" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item: any, i: number) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#fff", borderRadius: 12, padding: "10px 14px",
                border: "1px solid #F0F0F0",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                  {item.notes && (
                    <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 1, fontStyle: "italic" }}>"{item.notes}"</div>
                  )}
                  <div style={{ fontSize: 11, color: "#AEAEB2", marginTop: 2 }}>
                    {item.quantity}× {formatCurrency(item.price)}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#1D1D1F", flexShrink: 0, marginLeft: 10 }}>
                  {formatCurrency((item.price || 0) * (item.quantity || 1))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1.5px dashed #E5E5EA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>Total</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#FF9500" }}>{formatCurrency(order.total)}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11, color: "#AEAEB2" }}>
            Pembayaran: {order.paymentMethod === "qris" ? "QRIS" : order.paymentMethod === "cash" ? "Tunai" : order.paymentMethod}
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
    if (trimmed.length < 5) { setError("Masukkan nomor telepon yang valid"); return; }
    setLoading(true); setError(""); setOrders(null);
    try {
      const normalized = trimmed.replace(/\D/g, "");
      const res = await fetch(`/api/orders/track?phone=${encodeURIComponent(normalized)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Gagal mengambil data pesanan");
        setLoading(false); return;
      }
      setOrders(await res.json());
      setSubmittedPhone(trimmed);
    } catch { setError("Tidak dapat terhubung ke server. Coba lagi."); }
    finally { setLoading(false); }
  };

  const activeOrders = orders?.filter(o => !["served", "cancelled"].includes(o.orderStatus)) ?? [];
  const doneOrders = orders?.filter(o => ["served", "cancelled"].includes(o.orderStatus)) ?? [];

  return (
    <div style={{ minHeight: "100dvh", background: "#F5F5F7", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0F0F0", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
        <button
          onClick={() => setLocation("/")}
          style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E5E5EA", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          data-testid="button-back-home"
        >
          <ArrowLeft size={16} color="#1D1D1F" />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#FF9500,#FFAB00)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px rgba(255,149,0,0.3)", flexShrink: 0 }}>
            <PackageSearch size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", lineHeight: 1.2 }}>Lacak Pesanan</div>
            <div style={{ fontSize: 11, color: "#8E8E93" }}>Cek status pesanan kamu</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 48px" }}>

        {/* Search Card */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "18px 18px 16px", marginBottom: 20, border: "1.5px solid #F0F0F0" }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.07em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Phone size={12} color="#FF9500" />
            Nomor telepon kamu
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="08123456789"
              style={{
                flex: 1, height: 48, padding: "0 16px",
                fontSize: 16, fontWeight: 600, color: "#1D1D1F",
                border: `1.5px solid ${error ? "#FF3B30" : phone ? "#FF9500" : "#E5E5EA"}`,
                borderRadius: 12, outline: "none", fontFamily: "inherit",
                background: phone ? "#FFFBF5" : "#F9F9F9",
                transition: "all 0.15s", boxSizing: "border-box",
              }}
              data-testid="input-phone-track"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                width: 48, height: 48, borderRadius: 12, border: "none", flexShrink: 0,
                background: loading ? "#FFCF6B" : "linear-gradient(135deg,#FF9500,#FFAB00)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 3px 12px rgba(255,149,0,0.35)",
                transition: "all 0.15s",
              }}
              data-testid="button-search-orders"
            >
              {loading ? (
                <div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              ) : (
                <PackageSearch size={19} color="#fff" />
              )}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, color: "#FF3B30", fontSize: 12, fontWeight: 600 }} data-testid="text-error-track">
              <AlertCircle size={13} />
              {error}
            </div>
          )}
          <p style={{ marginTop: 8, fontSize: 11, color: "#AEAEB2" }}>
            Gunakan nomor HP yang kamu daftarkan saat memesan
          </p>
        </div>

        {/* Results */}
        {orders !== null && (
          <>
            {orders.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 18, padding: "40px 24px", textAlign: "center", border: "1.5px solid #F0F0F0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#F5F5F7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <PackageSearch size={28} color="#C7C7CC" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#1D1D1F", marginBottom: 6 }}>Pesanan tidak ditemukan</div>
                <div style={{ fontSize: 13, color: "#8E8E93", lineHeight: 1.6 }}>
                  Tidak ada pesanan untuk<br />
                  <strong style={{ color: "#1D1D1F" }}>{submittedPhone}</strong>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Active */}
                {activeOrders.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF9500", boxShadow: "0 0 0 3px rgba(255,149,0,0.2)", animation: "pulse 1.5s ease-in-out infinite" }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#FF9500", letterSpacing: "0.07em" }}>
                        PESANAN AKTIF ({activeOrders.length})
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {activeOrders.map(o => <OrderCard key={o.id} order={o} />)}
                    </div>
                  </div>
                )}

                {/* Done */}
                {doneOrders.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#C7C7CC" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.07em" }}>
                        RIWAYAT ({doneOrders.length})
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {doneOrders.map(o => <OrderCard key={o.id} order={o} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 3px rgba(255,149,0,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(255,149,0,0.08); }
        }
      `}</style>
    </div>
  );
}
