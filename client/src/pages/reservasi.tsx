import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { CalendarDays, Clock, Users, User, Phone, MessageSquare, ChevronLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <Icon size={14} className="text-orange-500" />
        {label}
      </Label>
      {children}
    </div>
  );
}

export default function ReservasiPage() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    phoneNumber: "",
    guestCount: 2,
    reservationDate: "",
    reservationTime: "12:00",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      // Build ISO date from date + time
      const [y, m, d] = data.reservationDate.split("-").map(Number);
      const [h, min] = data.reservationTime.split(":").map(Number);
      const dt = new Date(y, m - 1, d, h, min);

      const res = await apiRequest("POST", "/api/reservations", {
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
        guestCount: data.guestCount,
        reservationDate: dt.toISOString(),
        reservationTime: data.reservationTime,
        notes: data.notes || null,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal membuat reservasi");
      }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({ title: "Gagal reservasi", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim()) return toast({ title: "Nama harus diisi", variant: "destructive" });
    if (!form.phoneNumber.trim()) return toast({ title: "Nomor telepon harus diisi", variant: "destructive" });
    if (!form.reservationDate) return toast({ title: "Tanggal harus diisi", variant: "destructive" });
    if (form.guestCount < 1) return toast({ title: "Jumlah tamu minimal 1", variant: "destructive" });
    mutation.mutate(form);
  };

  const today = new Date().toISOString().split("T")[0];

  if (submitted) {
    return (
      <div style={{ minHeight: "100dvh", background: "linear-gradient(135deg, #FFF8F0, #FFF0F3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #FF9500, #FF2D55)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <CheckCircle2 size={40} color="#fff" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1D1D1F", marginBottom: 8 }}>Reservasi Diterima!</h2>
          <p style={{ color: "#6E6E73", fontSize: 15, lineHeight: 1.5, marginBottom: 24 }}>
            Terima kasih, <strong>{form.customerName}</strong>. Tim kami akan menghubungi Anda di <strong>{form.phoneNumber}</strong> untuk konfirmasi.
          </p>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, border: "1.5px solid #E5E5EA", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6E6E73", fontSize: 13 }}>Tanggal</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{new Date(form.reservationDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#6E6E73", fontSize: 13 }}>Jam</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{form.reservationTime} WITA</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6E6E73", fontSize: 13 }}>Tamu</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{form.guestCount} orang</span>
            </div>
          </div>
          <Link href="/">
            <button style={{ width: "100%", height: 48, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #FF9500, #FF2D55)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Kembali ke Menu
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(135deg, #FFF8F0, #FFF0F3)" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E5EA", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/">
          <button style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E5E5EA", background: "#F9F9F9", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={18} style={{ color: "#1D1D1F" }} />
          </button>
        </Link>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>Reservasi Meja</h1>
          <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>Pesan tempat sebelum datang</p>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: 20, maxWidth: 480, margin: "0 auto" }}>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1.5px solid #E5E5EA" }} className="space-y-4">
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 4 }}>Informasi Tamu</p>

            <Field label="Nama Lengkap" icon={User}>
              <Input
                value={form.customerName}
                onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
                placeholder="Masukkan nama Anda"
                data-testid="input-reservasi-name"
              />
            </Field>

            <Field label="Nomor Telepon" icon={Phone}>
              <Input
                type="tel"
                value={form.phoneNumber}
                onChange={e => setForm(p => ({ ...p, phoneNumber: e.target.value }))}
                placeholder="08xxxxxxxxxx"
                data-testid="input-reservasi-phone"
              />
            </Field>

            <Field label="Jumlah Tamu" icon={Users}>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setForm(p => ({ ...p, guestCount: Math.max(1, p.guestCount - 1) }))}
                  style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid #E5E5EA", background: "#F9F9F9", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  −
                </button>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#1D1D1F", minWidth: 32, textAlign: "center" }}>{form.guestCount}</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, guestCount: Math.min(50, p.guestCount + 1) }))}
                  style={{ width: 40, height: 40, borderRadius: 10, border: "1.5px solid #E5E5EA", background: "#F9F9F9", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  +
                </button>
                <span style={{ fontSize: 13, color: "#6E6E73" }}>orang</span>
              </div>
            </Field>
          </div>

          <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1.5px solid #E5E5EA" }} className="space-y-4">
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 4 }}>Waktu Reservasi</p>

            <Field label="Tanggal" icon={CalendarDays}>
              <Input
                type="date"
                min={today}
                value={form.reservationDate}
                onChange={e => setForm(p => ({ ...p, reservationDate: e.target.value }))}
                data-testid="input-reservasi-date"
              />
            </Field>

            <Field label="Jam Kedatangan" icon={Clock}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, reservationTime: t }))}
                    data-testid={`button-time-${t}`}
                    style={{
                      height: 38, borderRadius: 10, border: "1.5px solid",
                      borderColor: form.reservationTime === t ? "#FF9500" : "#E5E5EA",
                      background: form.reservationTime === t ? "#FFF3E0" : "#F9F9F9",
                      color: form.reservationTime === t ? "#FF9500" : "#3C3C43",
                      fontSize: 13, fontWeight: form.reservationTime === t ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1.5px solid #E5E5EA" }}>
            <Field label="Catatan Khusus (opsional)" icon={MessageSquare}>
              <Textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Misal: ada anak kecil, alergi makanan, minta kursi dekat jendela..."
                rows={3}
                data-testid="input-reservasi-notes"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            data-testid="button-submit-reservasi"
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: mutation.isPending ? "#E5E5EA" : "linear-gradient(135deg, #FF9500, #FF2D55)",
              color: mutation.isPending ? "#8E8E93" : "#fff",
              fontSize: 16, fontWeight: 700, cursor: mutation.isPending ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {mutation.isPending ? (
              <><Loader2 size={18} className="animate-spin" />Mengirim...</>
            ) : (
              <><CalendarDays size={18} />Buat Reservasi</>
            )}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "#8E8E93" }}>
            Tim kami akan menghubungi Anda untuk konfirmasi
          </p>
        </form>
      </div>
    </div>
  );
}
