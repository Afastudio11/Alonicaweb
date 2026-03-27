import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, CheckCircle2, Loader2, Calendar, Clock, Users, Minus, Plus, Home, TreePine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
];

const SectionLabel = ({ children }: { children: string }) => (
  <p style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
    {children}
  </p>
);

const ROOM_OPTIONS = [
  {
    value: "indoor",
    label: "Indoor",
    desc: "Ruangan dalam, ber-AC",
    icon: Home,
    color: "#8B1538",
    bg: "#FFF5E6",
    border: "#FFDFA0",
  },
  {
    value: "outdoor",
    label: "Outdoor",
    desc: "Area terbuka, segar",
    icon: TreePine,
    color: "#34C759",
    bg: "#F0FFF4",
    border: "#A8EDBD",
  },
];

export default function ReservasiPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    phoneNumber: "",
    guestCount: 2,
    reservationDate: "",
    reservationTime: "19:00",
    notes: "",
    roomPreference: "" as "" | "indoor" | "outdoor",
  });

  const today = new Date().toISOString().split("T")[0];

  // Fetch available rooms from tables API (to know if indoor/outdoor options exist)
  const { data: tables = [] } = useQuery<{ room: string; isActive: boolean }[]>({
    queryKey: ["/api/tables"],
    select: (data) => data.filter(t => t.isActive),
  });

  const hasIndoor = tables.some(t => t.room === "indoor");
  const hasOutdoor = tables.some(t => t.room === "outdoor");
  const showRoomChoice = hasIndoor || hasOutdoor || true; // always show for UX clarity

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/reservations", {
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
        guestCount: data.guestCount,
        reservationDate: data.reservationDate,
        reservationTime: data.reservationTime,
        notes: data.notes || null,
        roomPreference: data.roomPreference || null,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal membuat reservasi");
      }
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
    onError: (error: Error) =>
      toast({ title: "Gagal reservasi", description: error.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) return toast({ title: "Nama harus diisi", variant: "destructive" });
    if (!form.phoneNumber.trim()) return toast({ title: "Nomor telepon harus diisi", variant: "destructive" });
    if (!form.reservationDate) return toast({ title: "Tanggal harus dipilih", variant: "destructive" });
    mutation.mutate(form);
  };

  if (submitted) {
    const roomLabel = ROOM_OPTIONS.find(r => r.value === form.roomPreference)?.label;
    return (
      <div style={{ minHeight: "100dvh", background: "#F5F5F7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #8B1538, #A8294A)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <CheckCircle2 size={36} color="#fff" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1D1D1F", marginBottom: 6, textAlign: "center" }}>
          Reservasi Terkirim!
        </h2>
        <p style={{ color: "#6E6E73", fontSize: 14, lineHeight: 1.6, textAlign: "center", marginBottom: 24, maxWidth: 300 }}>
          Halo <strong>{form.customerName}</strong>, tim kami akan menghubungi <strong>{form.phoneNumber}</strong> untuk konfirmasi.
        </p>

        <div style={{ background: "#fff", borderRadius: 18, padding: "20px 24px", width: "100%", maxWidth: 360, marginBottom: 20, border: "1px solid #E5E5EA" }}>
          {[
            { label: "Tanggal", value: new Date(form.reservationDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
            { label: "Jam", value: form.reservationTime + " WITA" },
            { label: "Jumlah Tamu", value: form.guestCount + " orang" },
            ...(roomLabel ? [{ label: "Ruangan", value: roomLabel }] : []),
          ].map((item, i, arr) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBlock: 10, borderBottom: i < arr.length - 1 ? "1px solid #F0F0F0" : "none" }}>
              <span style={{ fontSize: 13, color: "#8E8E93" }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", textAlign: "right", maxWidth: "60%" }}>{item.value}</span>
            </div>
          ))}
        </div>

        <Link href="/">
          <button style={{ height: 50, paddingInline: 40, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #8B1538, #A8294A)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Kembali ke Menu
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#F5F5F7" }}>

      {/* Header */}
      <div style={{ background: "#fff", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #F0F0F0" }}>
        <Link href="/">
          <button style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E5E5EA", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={18} style={{ color: "#1D1D1F" }} />
          </button>
        </Link>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Reservasi Meja</h1>
          <p style={{ fontSize: 12, color: "#8E8E93", margin: 0 }}>Pesan tempat sebelum datang</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "16px 16px 32px", maxWidth: 480, margin: "0 auto" }}>

        {/* INFORMASI TAMU */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "20px 18px", marginBottom: 12 }}>
          <SectionLabel>Informasi Tamu</SectionLabel>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#3C3C43", display: "block", marginBottom: 6 }}>
              Nama Lengkap <span style={{ color: "#A8294A" }}>*</span>
            </label>
            <input
              value={form.customerName}
              onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
              placeholder="Masukkan nama kamu"
              data-testid="input-reservasi-name"
              style={{
                width: "100%", height: 46, borderRadius: 12, border: "1.5px solid",
                borderColor: form.customerName ? "#8B1538" : "#E5E5EA",
                padding: "0 14px", fontSize: 15, outline: "none",
                background: form.customerName ? "#FFFBF5" : "#F9F9F9",
                color: "#1D1D1F", boxSizing: "border-box",
                transition: "border-color 0.15s, background 0.15s",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#3C3C43", display: "block", marginBottom: 6 }}>
              Nomor HP <span style={{ color: "#A8294A" }}>*</span>
            </label>
            <input
              type="tel"
              value={form.phoneNumber}
              onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
              placeholder="08xxxxxxxxxx"
              data-testid="input-reservasi-phone"
              style={{
                width: "100%", height: 46, borderRadius: 12, border: "1.5px solid",
                borderColor: form.phoneNumber ? "#8B1538" : "#E5E5EA",
                padding: "0 14px", fontSize: 15, outline: "none",
                background: form.phoneNumber ? "#FFFBF5" : "#F9F9F9",
                color: "#1D1D1F", boxSizing: "border-box",
                transition: "border-color 0.15s, background 0.15s",
              }}
            />
          </div>

          {/* Guest stepper */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#3C3C43", display: "block", marginBottom: 10 }}>
              Jumlah Tamu
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#F5F5F7", borderRadius: 14, padding: 4, width: "fit-content" }}>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, guestCount: Math.max(1, p.guestCount - 1) }))}
                data-testid="button-guest-minus"
                style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: form.guestCount > 1 ? "#fff" : "transparent", cursor: form.guestCount > 1 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: form.guestCount > 1 ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}
              >
                <Minus size={16} color={form.guestCount > 1 ? "#1D1D1F" : "#C7C7CC"} />
              </button>
              <div style={{ minWidth: 64, textAlign: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F" }}>{form.guestCount}</span>
                <span style={{ fontSize: 12, color: "#8E8E93", marginLeft: 4 }}>orang</span>
              </div>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, guestCount: Math.min(50, p.guestCount + 1) }))}
                data-testid="button-guest-plus"
                style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", transition: "all 0.15s" }}
              >
                <Plus size={16} color="#8B1538" />
              </button>
            </div>
          </div>
        </div>

        {/* PILIH RUANGAN */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "20px 18px", marginBottom: 12 }}>
          <SectionLabel>Preferensi Ruangan</SectionLabel>
          <p style={{ fontSize: 13, color: "#8E8E93", marginBottom: 14, marginTop: -6, lineHeight: 1.5 }}>
            Pilih ruangan yang kamu inginkan (opsional). Tim kami akan mengusahakan sesuai preferensimu.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* No preference option */}
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, roomPreference: "" }))}
              data-testid="button-room-none"
              style={{
                gridColumn: "1 / -1",
                height: 44, borderRadius: 12, border: "1.5px solid",
                borderColor: form.roomPreference === "" ? "#8B1538" : "#E5E5EA",
                background: form.roomPreference === "" ? "#FFFBF5" : "#F9F9F9",
                color: form.roomPreference === "" ? "#8B1538" : "#6E6E73",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              Tidak ada preferensi
            </button>
            {ROOM_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const selected = form.roomPreference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, roomPreference: opt.value as "indoor" | "outdoor" }))}
                  data-testid={`button-room-${opt.value}`}
                  style={{
                    height: 80, borderRadius: 14, border: "2px solid",
                    borderColor: selected ? opt.color : "#E5E5EA",
                    background: selected ? opt.bg : "#F9F9F9",
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 5,
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={22} color={selected ? opt.color : "#AEAEB2"} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: selected ? opt.color : "#3C3C43" }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: 11, color: selected ? opt.color : "#AEAEB2", fontWeight: 500 }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* WAKTU RESERVASI */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "20px 18px", marginBottom: 12 }}>
          <SectionLabel>Waktu Reservasi</SectionLabel>

          {/* Tanggal */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#3C3C43", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Calendar size={14} color="#8B1538" />
              Tanggal <span style={{ color: "#A8294A" }}>*</span>
            </label>
            <input
              type="date"
              min={today}
              value={form.reservationDate}
              onChange={e => setForm(p => ({ ...p, reservationDate: e.target.value }))}
              data-testid="input-reservasi-date"
              style={{
                width: "100%", height: 46, borderRadius: 12, border: "1.5px solid",
                borderColor: form.reservationDate ? "#8B1538" : "#E5E5EA",
                padding: "0 14px", fontSize: 15, outline: "none",
                background: form.reservationDate ? "#FFFBF5" : "#F9F9F9",
                color: "#1D1D1F", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Jam */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#3C3C43", display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Clock size={14} color="#8B1538" />
              Jam Kedatangan
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
              {TIME_SLOTS.map(t => {
                const selected = form.reservationTime === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, reservationTime: t }))}
                    data-testid={`button-time-${t}`}
                    style={{
                      height: 38, borderRadius: 10, border: "1.5px solid",
                      borderColor: selected ? "#8B1538" : "#EBEBEB",
                      background: selected ? "#8B1538" : "#F9F9F9",
                      color: selected ? "#fff" : "#3C3C43",
                      fontSize: 13, fontWeight: selected ? 700 : 500,
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CATATAN */}
        <div style={{ background: "#fff", borderRadius: 18, padding: "20px 18px", marginBottom: 20 }}>
          <SectionLabel>Catatan (Opsional)</SectionLabel>
          <textarea
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Misal: ada anak kecil, alergi makanan, minta kursi dekat jendela..."
            rows={3}
            data-testid="input-reservasi-notes"
            style={{
              width: "100%", borderRadius: 12, border: "1.5px solid #E5E5EA",
              padding: "12px 14px", fontSize: 14, outline: "none",
              background: "#F9F9F9", color: "#1D1D1F", resize: "none",
              lineHeight: 1.5, boxSizing: "border-box", fontFamily: "inherit",
            }}
            onFocus={e => { e.target.style.borderColor = "#8B1538"; e.target.style.background = "#FFFBF5"; }}
            onBlur={e => { e.target.style.borderColor = "#E5E5EA"; e.target.style.background = "#F9F9F9"; }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          data-testid="button-submit-reservasi"
          style={{
            width: "100%", height: 52, borderRadius: 16, border: "none",
            background: mutation.isPending ? "#E5E5EA" : "linear-gradient(135deg, #8B1538, #A8294A)",
            color: mutation.isPending ? "#8E8E93" : "#fff",
            fontSize: 16, fontWeight: 700, cursor: mutation.isPending ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "opacity 0.15s",
          }}
        >
          {mutation.isPending
            ? <><Loader2 size={18} className="animate-spin" /> Mengirim...</>
            : <><Calendar size={18} /> Buat Reservasi</>
          }
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "#AEAEB2", marginTop: 12 }}>
          Tim kami akan menghubungi kamu untuk konfirmasi
        </p>
      </form>
    </div>
  );
}
