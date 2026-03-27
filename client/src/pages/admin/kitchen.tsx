import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GlassWater, ChefHat, Clock, RefreshCw, ChevronRight, Loader2 } from "lucide-react";
import type { DrinkQueue } from "@shared/schema";

// ──────────────────────────────────────────────
// Config per-status
// ──────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; nextLabel: string; nextStatus: string; nextBg: string }> = {
  waiting: {
    label: "Antri", color: "#3C3C43", bg: "#F2F2F7", border: "#E5E5EA", dot: "#8E8E93",
    nextLabel: "Mulai Buat", nextStatus: "making", nextBg: "#FF9500",
  },
  making: {
    label: "Dibuat", color: "#FF9500", bg: "#FFF3E0", border: "#FFCC80", dot: "#FF9500",
    nextLabel: "Tandai Siap", nextStatus: "ready", nextBg: "#34C759",
  },
  ready: {
    label: "Siap", color: "#34C759", bg: "#F0FFF4", border: "#A3D9A5", dot: "#34C759",
    nextLabel: "Diambil", nextStatus: "taken", nextBg: "#007AFF",
  },
  taken: {
    label: "Selesai", color: "#007AFF", bg: "#EEF4FF", border: "#BDD0FF", dot: "#007AFF",
    nextLabel: "", nextStatus: "", nextBg: "",
  },
};

type QueueItem = DrinkQueue & { itemType?: string };
type TabType = "food" | "drink";

// ──────────────────────────────────────────────
// ItemCard — satu item satu kartu
// ──────────────────────────────────────────────
function ItemCard({ item, onStatusChange, pendingId }: {
  item: QueueItem;
  onStatusChange: (id: string, status: string) => void;
  pendingId: string | null;
}) {
  const cfg = STATUS_CFG[item.status] ?? STATUS_CFG.waiting;
  const elapsed = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 60000);
  const isFood = (item as any).itemType === "food";
  const isPending = pendingId === item.id;
  const isDone = item.status === "taken";

  return (
    <div
      data-testid={`kitchen-card-${item.id}`}
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: "18px 18px 14px",
        border: `2px solid ${cfg.border}`,
        position: "relative",
        boxShadow: item.status === "making"
          ? "0 4px 20px rgba(255,149,0,0.18)"
          : item.status === "ready"
          ? "0 4px 20px rgba(52,199,89,0.18)"
          : "0 2px 8px rgba(0,0,0,0.05)",
        opacity: isDone ? 0.65 : 1,
        transition: "all 0.2s",
      }}
    >
      {/* Queue number badge */}
      <div style={{
        position: "absolute", top: 14, right: 14,
        width: 40, height: 40, borderRadius: "50%",
        background: cfg.bg, border: `2px solid ${cfg.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 800, color: cfg.color,
      }}>
        {item.queueNumber}
      </div>

      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: cfg.dot,
          boxShadow: item.status === "making" ? `0 0 0 3px ${cfg.bg}` : "none",
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {cfg.label}
        </span>
        {/* Type chip */}
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
          background: isFood ? "#FFF3E0" : "#E3F2FD",
          color: isFood ? "#E65100" : "#1565C0",
          display: "flex", alignItems: "center", gap: 3,
        }}>
          {isFood
            ? <ChefHat size={9} style={{ display: "inline" }} />
            : <GlassWater size={9} style={{ display: "inline" }} />}
          {isFood ? "Makanan" : "Minuman"}
        </span>
        <span style={{ fontSize: 11, color: "#8E8E93", marginLeft: "auto", marginRight: 48 }}>
          <Clock size={10} style={{ display: "inline", marginRight: 2 }} />
          {elapsed < 1 ? "baru" : `${elapsed}m lalu`}
        </span>
      </div>

      {/* Item name */}
      <p style={{ fontSize: 17, fontWeight: 800, color: "#1D1D1F", margin: "4px 0 2px", lineHeight: 1.3, paddingRight: 48 }}>
        {item.drinkName}
      </p>

      {/* Customer + table */}
      <p style={{ fontSize: 13, color: "#6E6E73", margin: 0 }}>
        {item.customerName} •{" "}
        <span style={{ fontWeight: 600 }}>
          {item.orderType === "take_away" ? "Take Away" : `Meja ${item.tableNumber}`}
        </span>
      </p>
      {item.notes && (
        <p style={{ fontSize: 12, color: "#FF9500", fontStyle: "italic", margin: "4px 0 0" }}>
          Catatan: {item.notes}
        </p>
      )}

      {/* Action button */}
      {cfg.nextLabel && (
        <button
          onClick={() => onStatusChange(item.id, cfg.nextStatus)}
          disabled={isPending}
          data-testid={`button-kitchen-${item.id}-next`}
          style={{
            marginTop: 14, width: "100%", height: 48, borderRadius: 12,
            border: "none", cursor: isPending ? "wait" : "pointer",
            fontSize: 14, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: cfg.nextBg, color: "#fff",
            opacity: isPending ? 0.7 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {isPending
            ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            : <ChevronRight size={16} />}
          {cfg.nextLabel}
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Dapur/Bar page
// ──────────────────────────────────────────────
export default function KitchenSection({ mode = "all" }: { mode?: "food" | "drink" | "all" }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>(mode === "food" ? "food" : "drink");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: queue = [], isLoading, refetch } = useQuery<QueueItem[]>({
    queryKey: ["/api/drink-queue"],
    refetchInterval: 4000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      setPendingId(id);
      const res = await apiRequest("PUT", `/api/drink-queue/${id}`, { status });
      return res.json();
    },
    onMutate: async ({ id, status }) => {
      // Optimistic update: langsung ubah status di cache tanpa tunggu server
      await queryClient.cancelQueries({ queryKey: ["/api/drink-queue"] });
      const prev = queryClient.getQueryData<QueueItem[]>(["/api/drink-queue"]);
      queryClient.setQueryData(["/api/drink-queue"], (old: QueueItem[] | undefined) =>
        old ? old.map((item) => item.id === id ? { ...item, status } : item) : old
      );
      return { prev };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drink-queue"] });
    },
    onError: (error: any, _vars, context) => {
      // Kembalikan ke state sebelumnya jika error
      if (context?.prev) queryClient.setQueryData(["/api/drink-queue"], context.prev);
      const msg = error?.message || "";
      toast({
        title: msg.includes("429") ? "Terlalu banyak request" : "Gagal update status",
        description: msg.includes("429") ? "Tunggu sebentar lalu coba lagi" : msg,
        variant: "destructive",
      });
    },
    onSettled: () => setPendingId(null),
    retry: (failureCount, error: any) => error?.message?.includes("429") && failureCount < 2,
    retryDelay: 1500,
  });

  // Filter per tab / mode
  const activeQueue = queue.filter(q => q.status !== "taken");
  const foodItems  = activeQueue.filter(q => (q as any).itemType === "food");
  const drinkItems = activeQueue.filter(q => (q as any).itemType !== "food");
  const displayQueue = mode === "food"
    ? foodItems
    : mode === "drink"
    ? drinkItems
    : activeTab === "food" ? foodItems : drinkItems;

  // Sort: waiting → making → ready (taken hidden from default view)
  const sortOrder = { waiting: 0, making: 1, ready: 2, taken: 3 };
  const sortedQueue = [...displayQueue].sort((a, b) =>
    (sortOrder[a.status as keyof typeof sortOrder] ?? 0) - (sortOrder[b.status as keyof typeof sortOrder] ?? 0)
  );

  const waiting = activeQueue.filter(q => q.status === "waiting").length;
  const making  = activeQueue.filter(q => q.status === "making").length;
  const ready   = activeQueue.filter(q => q.status === "ready").length;

  const TABS: { key: TabType; label: string; icon: any; count: number }[] = [
    { key: "food",  label: "Makanan", icon: ChefHat,    count: foodItems.length },
    { key: "drink", label: "Minuman", icon: GlassWater, count: drinkItems.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7" }}>
      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #E5E5EA",
        padding: "20px 24px 0", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: mode === "drink"
                ? "linear-gradient(135deg, #007AFF, #5AC8FA)"
                : "linear-gradient(135deg, #FF9500, #FF2D55)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {mode === "drink" ? <GlassWater size={20} color="#fff" /> : <ChefHat size={20} color="#fff" />}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", margin: 0 }}>
                {mode === "food" ? "Dapur" : mode === "drink" ? "Bar" : "Dapur & Bar"}
              </h1>
              <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>
                {displayQueue.length} item aktif · auto-refresh 4 detik
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            data-testid="button-refresh-kitchen"
            style={{
              height: 44, paddingInline: 16, borderRadius: 10,
              border: "1.5px solid #E5E5EA", background: "#fff",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 600, color: "#1D1D1F", cursor: "pointer",
            }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Status pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { label: "Antri",  count: waiting, color: "#8E8E93", bg: "#F2F2F7" },
            { label: "Dibuat", count: making,  color: "#FF9500", bg: "#FFF3E0" },
            { label: "Siap",   count: ready,   color: "#34C759", bg: "#F0FFF4" },
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

        {/* Tabs — only shown in "all" mode */}
        <div style={{ display: mode !== "all" ? "none" : "flex", borderTop: "1px solid #E5E5EA" }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                data-testid={`tab-kitchen-${tab.key}`}
                style={{
                  flex: 1, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, border: "none", background: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#FF9500" : "#6E6E73",
                  borderBottom: isActive ? "2.5px solid #FF9500" : "2.5px solid transparent",
                }}
              >
                <Icon size={14} />
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    minWidth: 18, height: 18, borderRadius: 9, padding: "0 5px",
                    background: isActive ? "#FF9500" : "#E5E5EA",
                    color: isActive ? "#fff" : "#6E6E73",
                    fontSize: 10, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 20 }}>
        {isLoading ? (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                background: "#fff", borderRadius: 20, padding: 20, height: 170,
                border: "2px solid #E5E5EA", animation: "pulse 1.5s infinite",
              }} />
            ))}
          </div>
        ) : sortedQueue.length === 0 ? (
          <div style={{ textAlign: "center", paddingBlock: 80, color: "#8E8E93" }}>
            <ChefHat size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
              {(mode === "food" || (mode === "all" && activeTab === "food"))
                ? "Tidak ada antrian makanan"
                : "Tidak ada antrian minuman"}
            </p>
            <p style={{ fontSize: 13, color: "#AEAEB2" }}>
              Item akan muncul otomatis saat pesanan masuk
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {sortedQueue.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
                pendingId={pendingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
