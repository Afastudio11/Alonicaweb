import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassWater, Clock, CheckCircle2, Trash2, RefreshCw, ChevronRight } from "lucide-react";
import type { DrinkQueue } from "@shared/schema";

const STATUS_CONFIG = {
  waiting: {
    label: "Antri",
    bg: "#F2F2F7",
    color: "#3C3C43",
    border: "#E5E5EA",
    dot: "#8E8E93",
    nextLabel: "Mulai Buat",
    nextStatus: "making",
    nextStyle: { background: "#FF9500", color: "#fff" },
  },
  making: {
    label: "Dibuat",
    bg: "#FFF3E0",
    color: "#FF9500",
    border: "#FFCC80",
    dot: "#FF9500",
    nextLabel: "Tandai Siap",
    nextStatus: "ready",
    nextStyle: { background: "linear-gradient(135deg, #34C759, #30B950)", color: "#fff" },
  },
  ready: {
    label: "Siap",
    bg: "#F0FFF4",
    color: "#34C759",
    border: "#A3D9A5",
    dot: "#34C759",
    nextLabel: "Diambil",
    nextStatus: "taken",
    nextStyle: { background: "#007AFF", color: "#fff" },
  },
  taken: {
    label: "Diambil",
    bg: "#F0F5FF",
    color: "#007AFF",
    border: "#BDD0FF",
    dot: "#007AFF",
    nextLabel: "",
    nextStatus: "",
    nextStyle: {},
  },
};

function DrinkCard({ item, onStatusChange, isPending }: {
  item: DrinkQueue;
  onStatusChange: (id: string, status: string) => void;
  isPending: boolean;
}) {
  const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.waiting;
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - new Date(item.createdAt).getTime()) / 60000);

  return (
    <div
      data-testid={`drink-card-${item.id}`}
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: 20,
        border: `2px solid ${cfg.border}`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s",
        boxShadow: item.status === "ready"
          ? "0 4px 20px rgba(52,199,89,0.2)"
          : item.status === "making"
          ? "0 4px 20px rgba(255,149,0,0.15)"
          : "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {/* Queue number badge */}
      <div style={{
        position: "absolute", top: 16, right: 16,
        width: 44, height: 44, borderRadius: "50%",
        background: cfg.bg, border: `2px solid ${cfg.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, fontWeight: 800, color: cfg.color,
      }}>
        {item.queueNumber}
      </div>

      {/* Status dot */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: cfg.dot,
          boxShadow: item.status === "making" ? `0 0 0 3px ${cfg.bg}` : "none",
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {cfg.label}
        </span>
        <span style={{ fontSize: 11, color: "#8E8E93", marginLeft: "auto", marginRight: 48 }}>
          {elapsed < 1 ? "baru" : `${elapsed}m lalu`}
        </span>
      </div>

      {/* Drink name */}
      <p style={{ fontSize: 17, fontWeight: 700, color: "#1D1D1F", margin: "4px 0 2px", lineHeight: 1.3 }}>
        {item.drinkName}
      </p>

      {/* Customer info */}
      <p style={{ fontSize: 13, color: "#6E6E73", margin: 0 }}>
        {item.customerName} •{" "}
        <span style={{ fontWeight: 600 }}>
          {item.orderType === "take_away" ? "Take Away" : `Meja ${item.tableNumber}`}
        </span>
        {item.notes && (
          <span style={{ display: "block", marginTop: 4, color: "#FF9500", fontStyle: "italic", fontSize: 12 }}>
            📝 {item.notes}
          </span>
        )}
      </p>

      {/* Action button */}
      {cfg.nextLabel && (
        <button
          onClick={() => onStatusChange(item.id, cfg.nextStatus)}
          disabled={isPending}
          data-testid={`button-queue-${item.id}-next`}
          style={{
            marginTop: 14, width: "100%", height: 40,
            borderRadius: 10, border: "none", cursor: isPending ? "wait" : "pointer",
            fontSize: 13, fontWeight: 700, display: "flex",
            alignItems: "center", justifyContent: "center", gap: 6,
            ...cfg.nextStyle,
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {cfg.nextLabel}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

export default function DrinkQueueSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());

  // Tick every 30 seconds to update elapsed times
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const { data: queue = [], isLoading, refetch } = useQuery<DrinkQueue[]>({
    queryKey: ["/api/drink-queue"],
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/drink-queue/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drink-queue"] });
    },
    onError: () => {
      toast({ title: "Gagal update status", variant: "destructive" });
    },
  });

  const clearTakenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/drink-queue/clear-taken", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/drink-queue"] });
      toast({ title: `${data.cleared} pesanan diarsipkan` });
    },
  });

  const waiting = queue.filter(q => q.status === "waiting");
  const making = queue.filter(q => q.status === "making");
  const ready = queue.filter(q => q.status === "ready");

  const isEmpty = queue.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7" }}>
      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #E5E5EA",
        padding: "20px 24px 16px",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #FF9500, #FF2D55)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <GlassWater size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", margin: 0 }}>
                Antrian Minuman
              </h1>
              <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>
                {queue.length} aktif · auto-refresh 5 detik
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => refetch()}
              data-testid="button-refresh-queue"
              style={{
                height: 36, paddingInline: 14, borderRadius: 10,
                border: "1.5px solid #E5E5EA", background: "#fff",
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 600, color: "#1D1D1F", cursor: "pointer",
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={() => clearTakenMutation.mutate()}
              disabled={clearTakenMutation.isPending}
              data-testid="button-clear-taken"
              style={{
                height: 36, paddingInline: 14, borderRadius: 10,
                border: "1.5px solid #E5E5EA", background: "#F2F2F7",
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 600, color: "#6E6E73", cursor: "pointer",
              }}
            >
              <Trash2 size={14} />
              Bersihkan
            </button>
          </div>
        </div>

        {/* Status summary pills */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {[
            { label: "Antri", count: waiting.length, color: "#8E8E93", bg: "#F2F2F7" },
            { label: "Dibuat", count: making.length, color: "#FF9500", bg: "#FFF3E0" },
            { label: "Siap", count: ready.length, color: "#34C759", bg: "#F0FFF4" },
          ].map(s => (
            <div key={s.label} style={{
              height: 30, paddingInline: 12, borderRadius: 999,
              background: s.bg, color: s.color,
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 700,
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%",
                background: s.color + "22",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800,
              }}>{s.count}</span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        {isLoading ? (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                background: "#fff", borderRadius: 20, padding: 20,
                height: 160, animation: "pulse 1.5s infinite",
                border: "2px solid #E5E5EA",
              }} />
            ))}
          </div>
        ) : isEmpty ? (
          <div style={{
            textAlign: "center", paddingBlock: 80,
            color: "#8E8E93",
          }}>
            <GlassWater size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Tidak ada antrian</p>
            <p style={{ fontSize: 13, color: "#AEAEB2" }}>Antrian minuman akan muncul otomatis saat pesanan masuk</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {queue.map(item => (
              <DrinkCard
                key={item.id}
                item={item}
                onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
                isPending={updateStatusMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
