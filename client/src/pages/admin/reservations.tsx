import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar, Phone, Users, Clock, ChevronLeft, ChevronRight,
  Search, User, CheckCircle2, Circle, XCircle, CalendarDays, List, Plus,
  Home, TreePine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  format, addMonths, eachDayOfInterval, startOfMonth, endOfMonth,
  isSameDay, isSameMonth, isAfter, startOfDay,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Reservation } from "@shared/schema";

const STATUS_CONFIG: Record<string, { label: string; border: string; bg: string; text: string; dot: string }> = {
  pending:   { label: "Menunggu",     border: "#3B82F6", bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  confirmed: { label: "Dikonfirmasi", border: "#22C55E", bg: "#F0FFF4", text: "#15803D", dot: "#22C55E" },
  completed: { label: "Selesai",      border: "#A855F7", bg: "#FAF5FF", text: "#7E22CE", dot: "#A855F7" },
  cancelled: { label: "Dibatalkan",   border: "#EF4444", bg: "#FEF2F2", text: "#B91C1C", dot: "#EF4444" },
};

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function ReservationsSection() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarDayFilter, setCalendarDayFilter] = useState<Date | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    customerName: "", phoneNumber: "", guestCount: "2",
    reservationDate: format(new Date(), "yyyy-MM-dd"),
    reservationTime: "19:00", notes: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    select: (data) => data.map(r => ({
      ...r,
      reservationDate: new Date(r.reservationDate),
      createdAt: new Date(r.createdAt),
    })),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const r = await apiRequest("PATCH", `/api/reservations/${id}`, { status });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({ title: "Status reservasi diperbarui" });
    },
    onError: () => toast({ title: "Gagal memperbarui status", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof addForm) => {
      const r = await apiRequest("POST", "/api/reservations", {
        ...data,
        guestCount: parseInt(data.guestCount, 10),
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({ title: "Reservasi berhasil ditambahkan" });
      setAddOpen(false);
      setAddForm({ customerName: "", phoneNumber: "", guestCount: "2", reservationDate: format(new Date(), "yyyy-MM-dd"), reservationTime: "19:00", notes: "" });
    },
    onError: () => toast({ title: "Gagal menambahkan reservasi", variant: "destructive" }),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.customerName.trim() || !addForm.phoneNumber.trim()) {
      toast({ title: "Nama dan nomor telepon wajib diisi", variant: "destructive" });
      return;
    }
    createMutation.mutate(addForm);
  };

  const handleUpdate = (id: string, status: string) => {
    updateMutation.mutate({ id, status });
    if (selectedReservation?.id === id) {
      setSelectedReservation(prev => prev ? { ...prev, status: status as any } : null);
    }
  };

  // Filter
  const filteredList = useMemo(() => {
    return reservations
      .filter(r => {
        if (calendarDayFilter && viewMode === "calendar") {
          if (!isSameDay(r.reservationDate, calendarDayFilter)) return false;
        }
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return r.customerName.toLowerCase().includes(q) || r.phoneNumber.includes(q);
        }
        return true;
      })
      .sort((a, b) => a.reservationDate.getTime() - b.reservationDate.getTime());
  }, [reservations, statusFilter, searchQuery, calendarDayFilter, viewMode]);

  // Kalender bulan
  const monthDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const reservationsByDay = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    reservations.forEach(r => {
      const key = format(r.reservationDate, "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [reservations]);

  // Grid padding at start of month
  const startPad = useMemo(() => {
    const dow = monthDays[0]?.getDay() ?? 1;
    return dow === 0 ? 6 : dow - 1;
  }, [monthDays]);

  // Stats summary
  const stats = useMemo(() => {
    const today = reservations.filter(r => isSameDay(r.reservationDate, new Date()));
    return {
      total: reservations.length,
      pending: reservations.filter(r => r.status === "pending").length,
      confirmed: reservations.filter(r => r.status === "confirmed").length,
      todayCount: today.length,
    };
  }, [reservations]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "3px solid #8B1538", borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
          }} />
          <p style={{ color: "#6E6E73", fontSize: 14 }}>Memuat reservasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="space-y-5 pb-10">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1D1D1F" }}>Reservasi</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { label: "Hari Ini", value: stats.todayCount, color: "#8B1538" },
            { label: "Menunggu", value: stats.pending, color: "#3B82F6" },
            { label: "Dikonfirmasi", value: stats.confirmed, color: "#22C55E" },
          ].map(s => (
            <div key={s.label} style={{
              padding: "6px 14px", borderRadius: 20,
              background: "#F5F5F7", display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block" }} />
              <span style={{ fontSize: 13, color: "#6E6E73" }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>{s.value}</span>
            </div>
          ))}
          <Button
            onClick={() => setAddOpen(true)}
            style={{ background: "#8B1538", color: "#fff", height: 38, gap: 6, borderRadius: 10 }}
            data-testid="button-add-reservation"
          >
            <Plus size={16} />
            Tambah Reservasi
          </Button>
        </div>
      </div>

      {/* ── View Tabs ── */}
      <div style={{ display: "flex", gap: 4, background: "#F5F5F7", borderRadius: 14, padding: 4, width: "fit-content" }}>
        {[
          { key: "list", label: "Daftar", icon: List },
          { key: "calendar", label: "Kalender Bulan", icon: CalendarDays },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setViewMode(key as any); setCalendarDayFilter(null); }}
            data-testid={`tab-${key}`}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 18px", borderRadius: 10, border: "none",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s",
              background: viewMode === key ? "#fff" : "transparent",
              color: viewMode === key ? "#1D1D1F" : "#6E6E73",
              boxShadow: viewMode === key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#8E8E93" }} />
          <Input
            placeholder="Cari nama / telepon..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 32, height: 40 }}
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger style={{ width: 160, height: 40 }} data-testid="select-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="cancelled">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ══════════ CALENDAR VIEW ══════════ */}
      {viewMode === "calendar" && (
        <div className="space-y-4">
          {/* Month Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => { setCalendarMonth(m => addMonths(m, -1)); setCalendarDayFilter(null); }}
              style={{ padding: 6, borderRadius: 8, border: "1.5px solid #E5E5EA", background: "#fff", cursor: "pointer", display: "flex" }}
              data-testid="button-prev-month"
            >
              <ChevronLeft size={18} color="#1D1D1F" />
            </button>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", minWidth: 130, textAlign: "center" }}>
              {format(calendarMonth, "MMMM yyyy", { locale: idLocale })}
            </span>
            <button
              onClick={() => { setCalendarMonth(m => addMonths(m, 1)); setCalendarDayFilter(null); }}
              style={{ padding: 6, borderRadius: 8, border: "1.5px solid #E5E5EA", background: "#fff", cursor: "pointer", display: "flex" }}
              data-testid="button-next-month"
            >
              <ChevronRight size={18} color="#1D1D1F" />
            </button>
            <button
              onClick={() => { setCalendarMonth(new Date()); setCalendarDayFilter(null); }}
              style={{
                padding: "6px 14px", borderRadius: 8, border: "1.5px solid #E5E5EA",
                background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1D1D1F",
              }}
              data-testid="button-today-calendar"
            >
              Hari Ini
            </button>
            {calendarDayFilter && (
              <button
                onClick={() => setCalendarDayFilter(null)}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "1.5px solid #8B1538",
                  background: "#FFF5E6", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#8B1538",
                }}
              >
                {format(calendarDayFilter, "d MMM", { locale: idLocale })} ✕
              </button>
            )}
          </div>

          {/* Calendar Grid */}
          <div style={{
            background: "#fff", borderRadius: 16,
            border: "1px solid #E5E5EA", overflow: "hidden",
          }}>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#F5F5F7" }}>
              {DAY_LABELS.map(d => (
                <div key={d} style={{
                  textAlign: "center", padding: "10px 0",
                  fontSize: 12, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase",
                }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
              {/* Padding cells */}
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} style={{ minHeight: 72, borderTop: "1px solid #F0F0F0" }} />
              ))}
              {monthDays.map(day => {
                const key = format(day, "yyyy-MM-dd");
                const dayRes = reservationsByDay[key] ?? [];
                const isToday = isSameDay(day, new Date());
                const isSelected = calendarDayFilter && isSameDay(day, calendarDayFilter);
                const pendingCount = dayRes.filter(r => r.status === "pending").length;
                const confirmedCount = dayRes.filter(r => r.status === "confirmed").length;

                return (
                  <button
                    key={key}
                    onClick={() => setCalendarDayFilter(isSelected ? null : day)}
                    data-testid={`cal-day-${key}`}
                    style={{
                      minHeight: 72, borderTop: "1px solid #F0F0F0",
                      padding: "8px 6px", textAlign: "left",
                      cursor: dayRes.length > 0 || true ? "pointer" : "default",
                      background: isSelected ? "#FFF5E6" : isToday ? "#FFFBF5" : "#fff",
                      border: "none",
                      outline: isSelected ? "2px solid #8B1538" : "none",
                      transition: "background 0.1s",
                    }}
                  >
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 26, height: 26, borderRadius: "50%", fontSize: 13, fontWeight: 600,
                      background: isToday ? "#8B1538" : "transparent",
                      color: isToday ? "#fff" : "#1D1D1F",
                      marginBottom: 4,
                    }}>
                      {format(day, "d")}
                    </span>
                    {dayRes.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {pendingCount > 0 && (
                          <div style={{
                            fontSize: 10, fontWeight: 600, padding: "1px 5px",
                            borderRadius: 4, background: "#EFF6FF", color: "#1D4ED8",
                          }}>
                            {pendingCount} menunggu
                          </div>
                        )}
                        {confirmedCount > 0 && (
                          <div style={{
                            fontSize: 10, fontWeight: 600, padding: "1px 5px",
                            borderRadius: 4, background: "#F0FFF4", color: "#15803D",
                          }}>
                            {confirmedCount} konfirmasi
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reservasi untuk hari yang dipilih */}
          {calendarDayFilter && (
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", marginBottom: 10 }}>
                Reservasi {format(calendarDayFilter, "EEEE, d MMMM yyyy", { locale: idLocale })}
              </p>
              <ReservationList
                reservations={filteredList}
                onSelect={setSelectedReservation}
              />
            </div>
          )}
        </div>
      )}

      {/* ══════════ LIST VIEW ══════════ */}
      {viewMode === "list" && (
        <ReservationList reservations={filteredList} onSelect={setSelectedReservation} />
      )}

      {/* ── Detail Dialog ── */}
      <Dialog open={!!selectedReservation} onOpenChange={open => !open && setSelectedReservation(null)}>
        <DialogContent style={{ maxWidth: 420 }}>
          <DialogHeader>
            <DialogTitle>Detail Reservasi</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              {/* Customer */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: "1px solid #E5E5EA" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "#FFF5E6", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <User size={22} color="#8B1538" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#1D1D1F" }}>{selectedReservation.customerName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#6E6E73", marginTop: 2 }}>
                    <Phone size={12} />
                    {selectedReservation.phoneNumber}
                  </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
                    background: STATUS_CONFIG[selectedReservation.status]?.bg,
                    color: STATUS_CONFIG[selectedReservation.status]?.text,
                  }}>
                    {STATUS_CONFIG[selectedReservation.status]?.label ?? selectedReservation.status}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3">
                {[
                  {
                    label: "Tanggal",
                    value: format(selectedReservation.reservationDate, "EEEE, d MMMM yyyy", { locale: idLocale }),
                    icon: Calendar,
                  },
                  {
                    label: "Jam",
                    value: selectedReservation.reservationTime,
                    icon: Clock,
                  },
                  {
                    label: "Jumlah Tamu",
                    value: `${selectedReservation.guestCount} orang`,
                    icon: Users,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                    <span style={{ color: "#6E6E73", display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon size={14} />
                      {label}
                    </span>
                    <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{value}</span>
                  </div>
                ))}
                {(selectedReservation as any).roomPreference && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                    <span style={{ color: "#6E6E73", display: "flex", alignItems: "center", gap: 6 }}>
                      {(selectedReservation as any).roomPreference === "indoor" ? <Home size={14} /> : <TreePine size={14} />}
                      Preferensi Ruangan
                    </span>
                    <span style={{
                      fontWeight: 700, fontSize: 12, paddingInline: 10, paddingBlock: 4, borderRadius: 20,
                      background: (selectedReservation as any).roomPreference === "indoor" ? "#FFF5E6" : "#F0FFF4",
                      color: (selectedReservation as any).roomPreference === "indoor" ? "#8B1538" : "#34C759",
                    }}>
                      {(selectedReservation as any).roomPreference === "indoor" ? "Indoor" : "Outdoor"}
                    </span>
                  </div>
                )}
                {selectedReservation.notes && (
                  <div style={{ background: "#F5F5F7", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "#6E6E73" }}>
                    <span style={{ fontWeight: 600, color: "#1D1D1F" }}>Catatan: </span>
                    {selectedReservation.notes}
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div style={{ paddingTop: 12, borderTop: "1px solid #E5E5EA" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", marginBottom: 12 }}>Progress</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative", paddingLeft: 20 }}>
                  <div style={{ position: "absolute", left: 11, top: 12, bottom: 12, width: 2, background: "#E5E5EA" }} />
                  {[
                    { key: "pending", label: "Menunggu", desc: "Reservasi diterima" },
                    { key: "confirmed", label: "Dikonfirmasi", desc: "Reservasi dikonfirmasi" },
                    { key: "completed", label: "Selesai", desc: "Layanan selesai" },
                  ].map((step, i) => {
                    const statuses = ["pending", "confirmed", "completed", "cancelled"];
                    const currentIdx = statuses.indexOf(selectedReservation.status);
                    const stepIdx = statuses.indexOf(step.key);
                    const isCancelled = selectedReservation.status === "cancelled";
                    const isDone = !isCancelled && currentIdx >= stepIdx;
                    const isCurrent = selectedReservation.status === step.key;
                    return (
                      <div key={step.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingBottom: i < 2 ? 16 : 0 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: isCancelled ? "#F5F5F7" : isDone ? "#22C55E" : "#F5F5F7",
                          zIndex: 1,
                        }}>
                          {isDone && !isCancelled
                            ? <CheckCircle2 size={14} color="#fff" />
                            : <Circle size={14} color={isCancelled ? "#C7C7CC" : "#C7C7CC"} />
                          }
                        </div>
                        <div style={{ paddingTop: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isDone && !isCancelled ? "#1D1D1F" : "#8E8E93" }}>
                            {step.label}
                          </div>
                          <div style={{ fontSize: 11, color: "#8E8E93" }}>{step.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                  {selectedReservation.status === "cancelled" && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "#FEF2F2", zIndex: 1,
                      }}>
                        <XCircle size={14} color="#EF4444" />
                      </div>
                      <div style={{ paddingTop: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>Dibatalkan</div>
                        <div style={{ fontSize: 11, color: "#8E8E93" }}>Reservasi dibatalkan</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, paddingTop: 4, borderTop: "1px solid #E5E5EA" }}>
                {selectedReservation.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleUpdate(selectedReservation.id, "confirmed")}
                      disabled={updateMutation.isPending}
                      data-testid="button-confirm"
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                        background: "#22C55E", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                      }}
                    >
                      Konfirmasi
                    </button>
                    <button
                      onClick={() => handleUpdate(selectedReservation.id, "cancelled")}
                      disabled={updateMutation.isPending}
                      data-testid="button-cancel"
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #EF4444",
                        background: "#fff", color: "#EF4444", fontWeight: 600, fontSize: 14, cursor: "pointer",
                      }}
                    >
                      Batalkan
                    </button>
                  </>
                )}
                {selectedReservation.status === "confirmed" && (
                  <>
                    <button
                      onClick={() => handleUpdate(selectedReservation.id, "completed")}
                      disabled={updateMutation.isPending}
                      data-testid="button-complete"
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                        background: "#8B1538", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
                      }}
                    >
                      Selesaikan
                    </button>
                    <button
                      onClick={() => handleUpdate(selectedReservation.id, "cancelled")}
                      disabled={updateMutation.isPending}
                      data-testid="button-cancel-confirmed"
                      style={{
                        flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #EF4444",
                        background: "#fff", color: "#EF4444", fontWeight: 600, fontSize: 14, cursor: "pointer",
                      }}
                    >
                      Batalkan
                    </button>
                  </>
                )}
                {(selectedReservation.status === "completed" || selectedReservation.status === "cancelled") && (
                  <button
                    onClick={() => setSelectedReservation(null)}
                    data-testid="button-close"
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid #E5E5EA",
                      background: "#fff", color: "#1D1D1F", fontWeight: 600, fontSize: 14, cursor: "pointer",
                    }}
                  >
                    Tutup
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog Tambah Reservasi ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent style={{ maxWidth: 460 }}>
          <DialogHeader>
            <DialogTitle>Tambah Reservasi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="res-name">Nama Pelanggan *</Label>
              <Input
                id="res-name"
                placeholder="Contoh: Budi Santoso"
                value={addForm.customerName}
                onChange={e => setAddForm(f => ({ ...f, customerName: e.target.value }))}
                data-testid="input-res-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-phone">Nomor Telepon *</Label>
              <Input
                id="res-phone"
                placeholder="Contoh: 08123456789"
                value={addForm.phoneNumber}
                onChange={e => setAddForm(f => ({ ...f, phoneNumber: e.target.value }))}
                data-testid="input-res-phone"
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="space-y-1.5">
                <Label htmlFor="res-date">Tanggal *</Label>
                <Input
                  id="res-date"
                  type="date"
                  value={addForm.reservationDate}
                  onChange={e => setAddForm(f => ({ ...f, reservationDate: e.target.value }))}
                  data-testid="input-res-date"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="res-time">Jam *</Label>
                <Input
                  id="res-time"
                  type="time"
                  value={addForm.reservationTime}
                  onChange={e => setAddForm(f => ({ ...f, reservationTime: e.target.value }))}
                  data-testid="input-res-time"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-guests">Jumlah Tamu *</Label>
              <Input
                id="res-guests"
                type="number"
                min="1"
                max="50"
                value={addForm.guestCount}
                onChange={e => setAddForm(f => ({ ...f, guestCount: e.target.value }))}
                data-testid="input-res-guests"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-notes">Catatan (opsional)</Label>
              <Textarea
                id="res-notes"
                placeholder="Permintaan khusus, dekorasi, dll..."
                rows={3}
                value={addForm.notes}
                onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                data-testid="input-res-notes"
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4 }}>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} data-testid="button-cancel-reservation">
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                style={{ background: "#8B1538", color: "#fff" }}
                data-testid="button-save-reservation"
              >
                {createMutation.isPending ? "Menyimpan..." : "Simpan Reservasi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Komponen List Reservasi ──
function ReservationList({
  reservations,
  onSelect,
}: {
  reservations: Reservation[];
  onSelect: (r: Reservation) => void;
}) {
  if (reservations.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "48px 24px",
        background: "#F5F5F7", borderRadius: 16,
      }}>
        <Calendar size={36} color="#C7C7CC" style={{ margin: "0 auto 12px" }} />
        <p style={{ color: "#8E8E93", fontSize: 14 }}>Tidak ada reservasi ditemukan</p>
      </div>
    );
  }

  // Group by date
  const groups: Record<string, Reservation[]> = {};
  reservations.forEach(r => {
    const key = format(r.reservationDate, "yyyy-MM-dd");
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  return (
    <div className="space-y-4">
      {Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([dateKey, dayRes]) => {
          const date = new Date(dateKey + "T00:00:00");
          const isToday = isSameDay(date, new Date());
          return (
            <div key={dateKey}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: isToday ? "#8B1538" : "#F5F5F7",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: isToday ? "#fff" : "#1D1D1F", lineHeight: 1 }}>
                    {format(date, "d")}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F" }}>
                    {format(date, "EEEE", { locale: idLocale })}
                    {isToday && <span style={{ marginLeft: 6, fontSize: 11, color: "#8B1538", fontWeight: 600 }}>Hari ini</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#8E8E93" }}>
                    {format(date, "d MMMM yyyy", { locale: idLocale })}
                  </div>
                </div>
              </div>
              <div className="space-y-2 ml-1">
                {dayRes.map(r => {
                  const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
                  return (
                    <div
                      key={r.id}
                      onClick={() => onSelect(r)}
                      data-testid={`card-reservation-${r.id}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 12,
                        background: "#fff", border: "1px solid #E5E5EA",
                        borderLeft: `4px solid ${cfg.border}`,
                        cursor: "pointer",
                        transition: "box-shadow 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                    >
                      {/* Time */}
                      <div style={{
                        minWidth: 44, textAlign: "center",
                        fontSize: 14, fontWeight: 700, color: "#1D1D1F",
                      }}>
                        {r.reservationTime?.substring(0, 5) ?? "--"}
                      </div>

                      {/* Divider */}
                      <div style={{ width: 1, height: 36, background: "#E5E5EA" }} />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", marginBottom: 2 }}>
                          {r.customerName}
                        </div>
                        <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#6E6E73", flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Users size={11} /> {r.guestCount} tamu
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <Phone size={11} /> {r.phoneNumber}
                          </span>
                          {(r as any).roomPreference && (
                            <span style={{
                              display: "flex", alignItems: "center", gap: 3,
                              fontWeight: 600,
                              color: (r as any).roomPreference === "indoor" ? "#8B1538" : "#34C759",
                            }}>
                              {(r as any).roomPreference === "indoor" ? <Home size={11} /> : <TreePine size={11} />}
                              {(r as any).roomPreference === "indoor" ? "Indoor" : "Outdoor"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        background: cfg.bg, color: cfg.text, whiteSpace: "nowrap",
                      }}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}
