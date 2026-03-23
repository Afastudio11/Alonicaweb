import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Minus, Plus, Trash2, Utensils, Package, Clock, Calendar, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

type OrderType = "dine_in" | "take_away";

export default function CartPage() {
  const [, setLocation] = useLocation();
  const { cartItems, updateQuantity, removeFromCart, subtotal, total } = useCart();
  const { toast } = useToast();

  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [scheduleNow, setScheduleNow] = useState(true);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("alonica-customer");
    if (saved) {
      try {
        const d = JSON.parse(saved);
        setCustomerName(d.name || "");
        setCustomerPhone(d.phone || "");
        setTableNumber(d.table || "");
        setOrderType(d.orderType || "dine_in");
      } catch {}
    }
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const timeOptions: string[] = [];
  for (let h = 8; h <= 23; h++) {
    for (const m of [0, 30]) {
      timeOptions.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  const handleProceed = () => {
    if (!customerName.trim()) {
      toast({ title: "Nama wajib diisi", variant: "destructive" }); return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      toast({ title: "Nomor HP tidak valid", variant: "destructive" }); return;
    }
    if (orderType === "dine_in" && !tableNumber.trim()) {
      toast({ title: "Nomor meja wajib diisi", variant: "destructive" }); return;
    }
    if (!scheduleNow && (!scheduledDate || !scheduledTime)) {
      toast({ title: "Pilih tanggal & waktu pesanan", variant: "destructive" }); return;
    }
    if (cartItems.length === 0) {
      toast({ title: "Keranjang masih kosong", variant: "destructive" }); return;
    }
    localStorage.setItem("alonica-customer", JSON.stringify({
      name: customerName.trim(),
      phone: customerPhone.trim(),
      table: orderType === "dine_in" ? tableNumber.trim() : "TAKEAWAY",
      orderType,
      scheduledTime: scheduleNow ? null : `${scheduledDate}T${scheduledTime}`,
    }));
    setLocation("/payment");
  };

  const inputClass = "w-full px-4 h-11 rounded-2xl text-sm outline-none transition-all";
  const inputStyle = { background: "#F5F5F7", color: "#1D1D1F", fontFamily: "var(--font-sans)" };

  return (
    <div className="min-h-screen pb-36" style={{ background: "#F5F5F7", fontFamily: "var(--font-sans)" }}>
      {/* ─── NAVBAR ─── */}
      <header
        className="ng-navbar sticky top-0 z-40"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setLocation("/")}
            className="ng-tap w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: "#F5F5F7" }}
            data-testid="button-back"
          >
            <ArrowLeft size={18} style={{ color: "#1D1D1F" }} />
          </button>
          <h1
            className="flex-1 font-bold text-base"
            style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}
          >
            Checkout
          </h1>
          {cartItems.length > 0 && (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: "#FF9500", color: "#fff" }}
            >
              {cartItems.reduce((s, i) => s + i.quantity, 0)} item
            </span>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">

        {/* ─── ORDER TYPE ─── */}
        <section className="ng-card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#AEAEB2" }}>
            Tipe Pesanan
          </p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { val: "dine_in" as OrderType, icon: Utensils, label: "Makan di Sini", sub: "Dine In" },
              { val: "take_away" as OrderType, icon: Package, label: "Bawa Pulang", sub: "Take Away" },
            ] as const).map(({ val, icon: Icon, label, sub }) => (
              <button
                key={val}
                onClick={() => setOrderType(val)}
                className="ng-tap flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all"
                style={
                  orderType === val
                    ? { borderColor: "#FF9500", background: "rgba(255,149,0,0.06)" }
                    : { borderColor: "#E5E5EA", background: "#FAFAFA" }
                }
                data-testid={`button-${val}`}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: orderType === val ? "rgba(255,149,0,0.12)" : "#F0F0F3" }}
                >
                  <Icon size={20} style={{ color: orderType === val ? "#FF9500" : "#AEAEB2" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: orderType === val ? "#1D1D1F" : "#6E6E73" }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: "#AEAEB2" }}>{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ─── CUSTOMER INFO ─── */}
        <section className="ng-card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#AEAEB2" }}>
            Informasi Pemesan
          </p>
          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6E6E73" }}>
                Nama Lengkap *
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className={inputClass}
                style={inputStyle}
                data-testid="input-customer-name"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6E6E73" }}>
                Nomor HP *
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="08xxxxxxxxxx"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                className={inputClass}
                style={inputStyle}
                data-testid="input-customer-phone"
              />
            </div>
            {orderType === "dine_in" && (
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6E6E73" }}>
                  Nomor Meja *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 5"
                  value={tableNumber}
                  onChange={e => setTableNumber(e.target.value.replace(/\D/g, ""))}
                  className={inputClass}
                  style={inputStyle}
                  data-testid="input-table-number"
                />
              </div>
            )}
          </div>
        </section>

        {/* ─── SCHEDULE ─── */}
        <section className="ng-card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#AEAEB2" }}>
            Waktu Pesanan
          </p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: true, icon: Clock, label: "Sekarang", sub: "Segera diproses" },
              { key: false, icon: Calendar, label: "Jadwalkan", sub: "Pilih waktu" },
            ] as const).map(({ key, icon: Icon, label, sub }) => (
              <button
                key={String(key)}
                onClick={() => setScheduleNow(key)}
                className="ng-tap flex items-center gap-3 px-3 py-3.5 rounded-2xl border-2 transition-all text-left"
                style={
                  scheduleNow === key
                    ? { borderColor: "#FF9500", background: "rgba(255,149,0,0.06)" }
                    : { borderColor: "#E5E5EA", background: "#FAFAFA" }
                }
                data-testid={`button-schedule-${key ? "now" : "later"}`}
              >
                <Icon size={18} style={{ color: scheduleNow === key ? "#FF9500" : "#AEAEB2", flexShrink: 0 }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: scheduleNow === key ? "#1D1D1F" : "#6E6E73" }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: "#AEAEB2" }}>{sub}</p>
                </div>
              </button>
            ))}
          </div>

          {!scheduleNow && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6E6E73" }}>Tanggal</label>
                <input
                  type="date"
                  min={today}
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  data-testid="input-scheduled-date"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6E6E73" }}>Jam</label>
                <select
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  data-testid="select-scheduled-time"
                >
                  <option value="">Pilih jam</option>
                  {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}
        </section>

        {/* ─── CART ITEMS ─── */}
        <section className="ng-card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#AEAEB2" }}>
            Item Pesanan
          </p>
          {cartItems.length === 0 ? (
            <div className="py-10 text-center">
              <div className="flex justify-center mb-2">
                <ShoppingCart size={40} style={{ color: "#AEAEB2" }} />
              </div>
              <p className="font-semibold text-sm" style={{ color: "#6E6E73" }}>Keranjang masih kosong</p>
              <button
                onClick={() => setLocation("/")}
                className="mt-3 text-xs font-bold"
                style={{ color: "#FF9500" }}
              >
                Lihat Menu →
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ gap: 0 }}>
              {cartItems.map((item, i) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-3"
                  style={{ borderTop: i > 0 ? "1px solid #F5F5F7" : "none" }}
                  data-testid={`cart-item-${item.id}`}
                >
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop"}
                    alt={item.name}
                    className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold leading-tight mb-0.5 line-clamp-2"
                      style={{ color: "#1D1D1F", letterSpacing: "-0.01em" }}
                      data-testid={`text-cart-name-${item.id}`}
                    >
                      {item.name}
                    </p>
                    <p className="text-sm font-bold" style={{ color: "#FF9500" }} data-testid={`text-cart-price-${item.id}`}>
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="ng-tap w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "#F5F5F7", border: "1px solid #E5E5EA" }}
                      data-testid={`button-decrease-${item.id}`}
                    >
                      <Minus size={12} style={{ color: "#1D1D1F" }} />
                    </button>
                    <span className="text-sm font-bold w-4 text-center" style={{ color: "#1D1D1F" }} data-testid={`text-quantity-${item.id}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="ng-tap w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "#FF9500" }}
                      data-testid={`button-increase-${item.id}`}
                    >
                      <Plus size={12} color="#fff" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ng-tap w-7 h-7 rounded-full flex items-center justify-center ml-1"
                      style={{ background: "rgba(255,45,85,0.08)" }}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 size={12} style={{ color: "#FF2D55" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── ORDER SUMMARY ─── */}
        {cartItems.length > 0 && (
          <section className="ng-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#AEAEB2" }}>
              Ringkasan
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm" style={{ color: "#6E6E73" }}>
                <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} item)</span>
                <span data-testid="text-subtotal">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "#6E6E73" }}>
                <span>Diskon</span>
                <span style={{ color: "#30D158", fontWeight: 600 }}>Rp 0</span>
              </div>
              <div
                className="flex justify-between pt-3 mt-1"
                style={{ borderTop: "1px solid #F5F5F7" }}
              >
                <span className="font-bold" style={{ color: "#1D1D1F" }}>Total</span>
                <span className="font-extrabold text-lg" style={{ color: "#FF9500", letterSpacing: "-0.02em" }} data-testid="text-total">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ─── FIXED BOTTOM BUTTON ─── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-4"
        style={{ background: "linear-gradient(to top, #F5F5F7 60%, transparent)" }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleProceed}
            disabled={cartItems.length === 0}
            className="ng-tap w-full h-14 rounded-2xl font-bold text-white text-base shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: cartItems.length > 0
                ? "linear-gradient(135deg, #FF9500, #FF6B35)"
                : "#E5E5EA",
              color: cartItems.length > 0 ? "#fff" : "#AEAEB2",
              letterSpacing: "-0.02em",
            }}
            data-testid="button-proceed-payment"
          >
            {cartItems.length > 0 ? `Bayar ${formatCurrency(total)} →` : "Keranjang Kosong"}
          </button>
        </div>
      </div>
    </div>
  );
}
