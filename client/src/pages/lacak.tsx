import { useState } from "react";
import { useLocation } from "wouter";
import { PackageSearch, ChefHat, CheckCircle, Clock, ShoppingBag, ArrowLeft, Phone, Utensils, Package, ChevronDown, ChevronUp } from "lucide-react";
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
  { key: "queued",    label: "Diterima",     sub: "Pesanan masuk",       icon: ShoppingBag },
  { key: "preparing", label: "Dimasak",      sub: "Dapur sedang proses", icon: ChefHat },
  { key: "ready",     label: "Siap",         sub: "Siap diambil",        icon: Package },
  { key: "served",    label: "Selesai",      sub: "Selamat menikmati",   icon: CheckCircle },
];

const STATUS_INDEX: Record<string, number> = {
  queued: 0, preparing: 1, ready: 2, served: 3, cancelled: -1,
};

const STATUS_MESSAGE: Record<string, { text: string; color: string; bg: string }> = {
  queued:    { text: "Pesanan kamu sudah masuk, menunggu konfirmasi dapur", color: "#92400E", bg: "#FFFBEB" },
  preparing: { text: "Dapur sedang menyiapkan pesanan kamu dengan penuh semangat!", color: "#FF9500", bg: "#FFF7ED" },
  ready:     { text: "Pesanan sudah siap! Silakan ambil di kasir", color: "#15803D", bg: "#F0FFF4" },
  served:    { text: "Selamat menikmati! Terima kasih sudah berkunjung", color: "#1D4ED8", bg: "#EFF6FF" },
  cancelled: { text: "Pesanan ini dibatalkan", color: "#B91C1C", bg: "#FEF2F2" },
};

function ProgressBar({ status }: { status: string }) {
  const currentIdx = STATUS_INDEX[status] ?? 0;
  const cancelled = status === "cancelled";

  if (cancelled) {
    return (
      <div style={{
        margin: "16px 0 4px",
        padding: "10px 16px",
        borderRadius: 12,
        background: "#FEF2F2",
        color: "#B91C1C",
        fontSize: 13,
        fontWeight: 700,
        textAlign: "center",
      }}>
        Pesanan Dibatalkan
      </div>
    );
  }

  return (
    <div style={{ margin: "20px 0 8px", position: "relative" }}>
      {/* Line track */}
      <div style={{
        position: "absolute",
        top: 18, left: "12.5%", right: "12.5%",
        height: 3, background: "#F2F2F7", borderRadius: 99, zIndex: 0,
      }} />
      <div style={{
        position: "absolute",
        top: 18, left: "12.5%",
        height: 3,
        borderRadius: 99, zIndex: 1,
        background: currentIdx >= 3
          ? "linear-gradient(90deg, #FF9500, #34C759)"
          : "linear-gradient(90deg, #FF9500, #FFAB00)",
        width: currentIdx === 0 ? "0%" :
               currentIdx === 1 ? "25%" :
               currentIdx === 2 ? "50%" :
               "75%",
        transition: "width 0.6s ease",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          const Icon = step.icon;
          return (
            <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "25%" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: done
                  ? (idx === 3 ? "#34C759" : "#FF9500")
                  : "#F2F2F7",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: active ? `0 0 0 5px ${idx === 3 ? "#34C75922" : "#FF950033"}` : "none",
                transition: "all 0.4s ease",
                border: active ? "2.5px solid white" : "2.5px solid transparent",
              }}>
                <Icon style={{ width: 16, height: 16, color: done ? "#fff" : "#C7C7CC" }} />
              </div>
              <div style={{
                marginTop: 8, fontSize: 11,
                fontWeight: active ? 800 : done ? 600 : 400,
                color: active ? "#1D1D1F" : done ? "#3C3C43" : "#AEAEB2",
                textAlign: "center", lineHeight: 1.3,
              }}>
                {step.label}
              </div>
              {active && (
                <div style={{
                  fontSize: 9, color: "#FF9500", fontWeight: 700, marginTop: 2,
                  background: "#FFF7ED", padding: "1px 6px", borderRadius: 99,
                }}>
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
  const itemCount = Array.isArray(order.items) ? order.items.length : 0;

  const paymentLabel =
    order.paymentStatus === "paid" ? "Lunas" :
    order.paymentStatus === "pending" ? "Menunggu" :
    order.paymentStatus === "unpaid" ? "Belum Bayar" : order.paymentStatus;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: isActive
        ? "0 4px 24px rgba(255,149,0,0.15), 0 1px 4px rgba(0,0,0,0.06)"
        : "0 2px 12px rgba(0,0,0,0.07)",
      border: isActive ? "1.5px solid #FFCF6B" : "1.5px solid #F2F2F7",
    }}>
      {/* Card top accent stripe */}
      {isActive && (
        <div style={{
          height: 4,
          background: order.orderStatus === "ready"
            ? "linear-gradient(90deg, #34C759, #30D158)"
            : "linear-gradient(90deg, #FF9500, #FFAB00)",
        }} />
      )}

      <div style={{ padding: "16px 18px" }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{
                fontSize: 15, fontWeight: 800, color: "#1D1D1F",
                letterSpacing: -0.3, fontFamily: "monospace",
              }}>
                #{order.id.slice(-8).toUpperCase()}
              </span>
              {isActive && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: "linear-gradient(90deg, #FF9500, #FFAB00)",
                  color: "#fff", padding: "2px 7px", borderRadius: 99,
                }}>
                  AKTIF
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#8E8E93" }}>
                {dateStr} · {timeStr}
              </span>
              <span style={{
                fontSize: 11, color: isTakeaway ? "#5856D6" : "#6E6E73",
                background: isTakeaway ? "#EEF2FF" : "#F5F5F7",
                padding: "1px 7px", borderRadius: 99, fontWeight: 600,
              }}>
                {isTakeaway ? "Takeaway" : `Meja ${order.tableNumber}`}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1D1D1F" }}>
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
        <ProgressBar status={order.orderStatus} />

        {/* Status message */}
        {msg && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 12,
            background: msg.bg, color: msg.color,
            fontSize: 12, fontWeight: 600, lineHeight: 1.5,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Utensils style={{ width: 13, height: 13, flexShrink: 0 }} />
            {msg.text}
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            marginTop: 12, width: "100%", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 4, background: "#F5F5F7",
            border: "none", borderRadius: 10, padding: "8px 0",
            cursor: "pointer", color: "#6E6E73", fontSize: 12, fontWeight: 600,
            fontFamily: "inherit",
          }}
        >
          {expanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
          {expanded ? "Sembunyikan detail" : `Lihat ${itemCount} item`}
        </button>
      </div>

      {/* Item detail */}
      {expanded && (
        <div style={{
          borderTop: "1px solid #F2F2F7",
          padding: "14px 18px 18px",
          background: "#FAFAFA",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#fff", borderRadius: 12, padding: "10px 14px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>{item.name}</div>
                  {item.notes && (
                    <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 2, fontStyle: "italic" }}>
                      "{item.notes}"
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "#AEAEB2", marginTop: 2 }}>
                    {item.quantity}× {formatCurrency(item.price)}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#1D1D1F", flexShrink: 0 }}>
                  {formatCurrency((item.price || 0) * (item.quantity || 1))}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: "1.5px dashed #E5E5EA",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>Total</span>
            <span style={{
              fontSize: 15, fontWeight: 800,
              background: "linear-gradient(90deg, #FF9500, #FFAB00)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{formatCurrency(order.total)}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#AEAEB2" }}>
            Bayar via: {order.paymentMethod === "qris" ? "QRIS" : order.paymentMethod === "cash" ? "Tunai" : order.paymentMethod}
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
      const normalized = trimmed.replace(/\D/g, '');
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
    <div style={{ minHeight: "100vh", background: "#F5F5F7", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero header */}
      <div style={{
        background: "linear-gradient(145deg, #1D1D1F 0%, #3A3A3C 100%)",
        padding: "0 20px 48px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: -40, right: -40, width: 200, height: 200,
          borderRadius: "50%", background: "rgba(255,149,0,0.15)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -20, left: -20, width: 130, height: 130,
          borderRadius: "50%", background: "rgba(255,45,85,0.10)", pointerEvents: "none",
        }} />

        {/* Back button */}
        <div style={{ paddingTop: 16 }}>
          <button
            onClick={() => setLocation("/")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 20, padding: "6px 14px",
              color: "rgba(255,255,255,0.85)", cursor: "pointer",
              fontSize: 13, fontWeight: 600, fontFamily: "inherit",
              backdropFilter: "blur(8px)",
            }}
            data-testid="button-back-home"
          >
            <ArrowLeft style={{ width: 13, height: 13 }} />
            Kembali
          </button>
        </div>

        {/* Title */}
        <div style={{ marginTop: 20, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "linear-gradient(135deg, #FF9500, #FFAB00)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(255,149,0,0.4)",
          }}>
            <PackageSearch style={{ width: 22, height: 22, color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
              Lacak Pesanan
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 1 }}>
              Cek status pesanan takeaway kamu
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px" }}>
        {/* Search card — floats over header */}
        <div style={{
          background: "#fff",
          borderRadius: 24,
          padding: 20,
          marginTop: -28,
          boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          position: "relative", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "#FFF7ED",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Phone style={{ width: 13, height: 13, color: "#FF9500" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>
              Nomor telepon kamu
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="08123456789"
                style={{
                  width: "100%", padding: "13px 16px",
                  fontSize: 16, fontWeight: 600,
                  border: error ? "1.5px solid #FF3B30" : "1.5px solid #E5E5EA",
                  borderRadius: 14, outline: "none",
                  fontFamily: "inherit", color: "#1D1D1F",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                data-testid="input-phone-track"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                width: 50, height: 50, borderRadius: 14,
                border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: loading
                  ? "#FFCF6B"
                  : "linear-gradient(135deg, #FF9500, #FFAB00)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: loading ? "none" : "0 4px 12px rgba(255,149,0,0.35)",
                transition: "all 0.2s",
              }}
              data-testid="button-search-orders"
            >
              {loading ? (
                <div style={{
                  width: 20, height: 20,
                  border: "2.5px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }} />
              ) : (
                <PackageSearch style={{ width: 20, height: 20, color: "#fff" }} />
              )}
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: 8, fontSize: 12, fontWeight: 600,
              color: "#FF3B30", display: "flex", alignItems: "center", gap: 6,
            }} data-testid="text-error-track">
              ⚠ {error}
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 11, color: "#AEAEB2", lineHeight: 1.5 }}>
            Gunakan nomor HP yang kamu daftarkan saat memesan
          </div>
        </div>

        {/* Results section */}
        {orders !== null && (
          <div style={{ marginTop: 24, paddingBottom: 48 }}>
            {orders.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "48px 24px",
                background: "#fff", borderRadius: 24,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "#F5F5F7",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  <PackageSearch style={{ width: 32, height: 32, color: "#C7C7CC" }} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#1D1D1F" }}>
                  Pesanan tidak ditemukan
                </div>
                <div style={{ fontSize: 13, color: "#8E8E93", marginTop: 8, lineHeight: 1.6 }}>
                  Tidak ada pesanan untuk nomor<br />
                  <strong style={{ color: "#1D1D1F" }}>{submittedPhone}</strong>
                </div>
              </div>
            ) : (
              <>
                {/* Active orders */}
                {activeOrders.length > 0 && (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: "#FF9500",
                        boxShadow: "0 0 0 3px rgba(255,149,0,0.2)",
                        animation: "pulse 1.5s ease-in-out infinite",
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#FF9500", letterSpacing: 0.2 }}>
                        PESANAN AKTIF ({activeOrders.length})
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {activeOrders.map(o => <OrderCard key={o.id} order={o} />)}
                    </div>
                  </div>
                )}

                {/* Done orders */}
                {doneOrders.length > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", background: "#C7C7CC",
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#8E8E93" }}>
                        RIWAYAT ({doneOrders.length})
                      </span>
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
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(255,149,0,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(255,149,0,0.1); }
        }
        input:focus {
          border-color: #FF9500 !important;
          box-shadow: 0 0 0 3px rgba(255,149,0,0.12);
        }
      `}</style>
    </div>
  );
}
