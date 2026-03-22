import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Minus, Plus, ShoppingBag, Utensils, Package, Clock, CalendarDays, Trash2 } from "lucide-react";
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
        const data = JSON.parse(saved);
        setCustomerName(data.name || "");
        setCustomerPhone(data.phone || "");
        setTableNumber(data.table || "");
        setOrderType(data.orderType || "dine_in");
      } catch {}
    }
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const timeOptions: string[] = [];
  for (let h = 10; h <= 21; h++) {
    for (const m of [0, 30]) {
      timeOptions.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  const handleProceed = () => {
    if (!customerName.trim()) {
      toast({ title: "Nama wajib diisi", description: "Masukkan nama kamu untuk melanjutkan", variant: "destructive" });
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      toast({ title: "Nomor HP tidak valid", description: "Masukkan nomor HP yang benar", variant: "destructive" });
      return;
    }
    if (orderType === "dine_in" && !tableNumber.trim()) {
      toast({ title: "Nomor meja wajib diisi", description: "Masukkan nomor meja untuk Dine In", variant: "destructive" });
      return;
    }
    if (!scheduleNow && (!scheduledDate || !scheduledTime)) {
      toast({ title: "Waktu pesanan belum lengkap", description: "Pilih tanggal dan waktu pesanan kamu", variant: "destructive" });
      return;
    }
    if (cartItems.length === 0) {
      toast({ title: "Keranjang kosong", description: "Tambahkan menu terlebih dahulu", variant: "destructive" });
      return;
    }

    const scheduledTimeVal = scheduleNow ? null : `${scheduledDate}T${scheduledTime}`;
    localStorage.setItem(
      "alonica-customer",
      JSON.stringify({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        table: orderType === "dine_in" ? tableNumber.trim() : "TAKEAWAY",
        orderType,
        scheduledTime: scheduledTimeVal,
      })
    );
    setLocation("/payment");
  };

  return (
    <div className="min-h-screen pb-36" style={{ background: "#F5F0E8", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 bg-white flex items-center gap-3 px-4 h-14"
        style={{ borderBottom: "1px solid #EAE0D8" }}
      >
        <button
          onClick={() => setLocation("/")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft size={20} style={{ color: "#5A4A47" }} />
        </button>
        <h1 className="text-base font-semibold flex-1" style={{ color: "#1A0A0A" }}>
          Checkout
        </h1>
        <ShoppingBag size={18} style={{ color: "#800001" }} />
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* ─── ORDER TYPE CARD ─── */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #F0E8E4" }}>
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#9B8B87" }}>
              Tipe Pesanan
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            <button
              onClick={() => setOrderType("dine_in")}
              className="flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all"
              style={
                orderType === "dine_in"
                  ? { borderColor: "#800001", background: "#FFF5F5" }
                  : { borderColor: "#EAE0D8", background: "#FAFAF8" }
              }
              data-testid="button-dine-in"
            >
              <Utensils size={22} style={{ color: orderType === "dine_in" ? "#800001" : "#9B8B87" }} />
              <span className="text-sm font-semibold" style={{ color: orderType === "dine_in" ? "#800001" : "#5A4A47" }}>
                Makan di Sini
              </span>
              <span className="text-[11px] text-center leading-tight" style={{ color: "#9B8B87" }}>
                Dine In
              </span>
            </button>
            <button
              onClick={() => setOrderType("take_away")}
              className="flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all"
              style={
                orderType === "take_away"
                  ? { borderColor: "#800001", background: "#FFF5F5" }
                  : { borderColor: "#EAE0D8", background: "#FAFAF8" }
              }
              data-testid="button-take-away"
            >
              <Package size={22} style={{ color: orderType === "take_away" ? "#800001" : "#9B8B87" }} />
              <span className="text-sm font-semibold" style={{ color: orderType === "take_away" ? "#800001" : "#5A4A47" }}>
                Bawa Pulang
              </span>
              <span className="text-[11px] text-center leading-tight" style={{ color: "#9B8B87" }}>
                Take Away
              </span>
            </button>
          </div>
        </div>

        {/* ─── CUSTOMER INFO CARD ─── */}
        <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #F0E8E4" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#9B8B87" }}>
            Informasi Pemesan
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#5A4A47" }}>
                Nama Lengkap *
              </label>
              <input
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors"
                style={{ borderColor: "#E0D6D0", background: "#FAFAF8" }}
                data-testid="input-customer-name"
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#5A4A47" }}>
                Nomor HP *
              </label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="08xxxxxxxxxx"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors"
                style={{ borderColor: "#E0D6D0", background: "#FAFAF8" }}
                data-testid="input-customer-phone"
              />
            </div>
            {orderType === "dine_in" && (
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#5A4A47" }}>
                  Nomor Meja *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 5"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors"
                  style={{ borderColor: "#E0D6D0", background: "#FAFAF8" }}
                  data-testid="input-table-number"
                />
              </div>
            )}
          </div>
        </div>

        {/* ─── SCHEDULE CARD ─── */}
        <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #F0E8E4" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#9B8B87" }}>
            Waktu Pesanan
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setScheduleNow(true)}
              className="flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all"
              style={
                scheduleNow
                  ? { borderColor: "#800001", background: "#FFF5F5" }
                  : { borderColor: "#EAE0D8", background: "#FAFAF8" }
              }
              data-testid="button-schedule-now"
            >
              <Clock size={16} style={{ color: scheduleNow ? "#800001" : "#9B8B87" }} />
              <div className="text-left">
                <p className="text-xs font-semibold" style={{ color: scheduleNow ? "#800001" : "#5A4A47" }}>
                  Sekarang
                </p>
                <p className="text-[10px]" style={{ color: "#9B8B87" }}>
                  Segera diproses
                </p>
              </div>
            </button>
            <button
              onClick={() => setScheduleNow(false)}
              className="flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all"
              style={
                !scheduleNow
                  ? { borderColor: "#800001", background: "#FFF5F5" }
                  : { borderColor: "#EAE0D8", background: "#FAFAF8" }
              }
              data-testid="button-schedule-later"
            >
              <CalendarDays size={16} style={{ color: !scheduleNow ? "#800001" : "#9B8B87" }} />
              <div className="text-left">
                <p className="text-xs font-semibold" style={{ color: !scheduleNow ? "#800001" : "#5A4A47" }}>
                  Jadwalkan
                </p>
                <p className="text-[10px]" style={{ color: "#9B8B87" }}>
                  Pilih waktu
                </p>
              </div>
            </button>
          </div>

          {!scheduleNow && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#5A4A47" }}>
                  Tanggal
                </label>
                <input
                  type="date"
                  min={today}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                  style={{ borderColor: "#E0D6D0", background: "#FAFAF8" }}
                  data-testid="input-scheduled-date"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#5A4A47" }}>
                  Jam
                </label>
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                  style={{ borderColor: "#E0D6D0", background: "#FAFAF8" }}
                  data-testid="select-scheduled-time"
                >
                  <option value="">Pilih jam</option>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ─── CART ITEMS CARD ─── */}
        <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #F0E8E4" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#9B8B87" }}>
            Item Pesanan
          </p>
          {cartItems.length === 0 ? (
            <div className="py-8 text-center">
              <ShoppingBag size={32} className="mx-auto mb-2" style={{ color: "#C9B8B4" }} />
              <p className="text-sm" style={{ color: "#9B8B87" }}>Keranjang masih kosong</p>
              <button
                onClick={() => setLocation("/")}
                className="mt-3 text-xs font-medium underline"
                style={{ color: "#800001" }}
              >
                Lihat Menu
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3" data-testid={`cart-item-${item.id}`}>
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop"}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium leading-tight line-clamp-2 mb-0.5"
                      style={{ color: "#1A0A0A" }}
                      data-testid={`text-cart-name-${item.id}`}
                    >
                      {item.name}
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "#800001" }} data-testid={`text-cart-price-${item.id}`}>
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full flex items-center justify-center border"
                      style={{ borderColor: "#E0D6D0" }}
                      data-testid={`button-decrease-${item.id}`}
                    >
                      <Minus size={12} style={{ color: "#5A4A47" }} />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center" style={{ color: "#1A0A0A" }} data-testid={`text-quantity-${item.id}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full flex items-center justify-center border"
                      style={{ borderColor: "#E0D6D0" }}
                      data-testid={`button-increase-${item.id}`}
                    >
                      <Plus size={12} style={{ color: "#5A4A47" }} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center ml-1"
                      style={{ background: "#FFF5F5" }}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 size={12} style={{ color: "#CC3333" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── ORDER SUMMARY CARD ─── */}
        {cartItems.length > 0 && (
          <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #F0E8E4" }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#9B8B87" }}>
              Ringkasan
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm" style={{ color: "#5A4A47" }}>
                <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} item)</span>
                <span data-testid="text-subtotal">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ color: "#5A4A47" }}>
                <span>Diskon</span>
                <span className="text-green-600">Rp 0</span>
              </div>
              <div className="pt-2 mt-1 flex justify-between font-semibold text-base" style={{ borderTop: "1px dashed #E0D6D0", color: "#1A0A0A" }}>
                <span>Total</span>
                <span style={{ color: "#800001" }} data-testid="text-total">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── FIXED BOTTOM BUTTON ─── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3"
        style={{ background: "linear-gradient(to top, #F5F0E8 60%, transparent)" }}
      >
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleProceed}
            disabled={cartItems.length === 0}
            className="w-full h-14 rounded-2xl font-semibold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            style={{ background: "#800001" }}
            data-testid="button-proceed-payment"
          >
            Lanjut ke Pembayaran QRIS →
          </button>
        </div>
      </div>
    </div>
  );
}
