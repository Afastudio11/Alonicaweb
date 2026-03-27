import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GlassWater, ChefHat, Clock, RefreshCw, ChevronRight, Loader2, Users, Utensils } from "lucide-react";
import type { DrinkQueue } from "@shared/schema";

// ──────────────────────────────────────────────
// Config per-status
// ──────────────────────────────────────────────
const STATUS_CFG: Record<string, {
  label: string; color: string; bg: string; border: string; dot: string;
  nextLabel: string; nextStatus: string; nextBg: string;
}> = {
  waiting: {
    label: "Antri",  color: "#3C3C43", bg: "#F2F2F7", border: "#E5E5EA", dot: "#8E8E93",
    nextLabel: "Mulai Buat", nextStatus: "making", nextBg: "#FF9500",
  },
  making: {
    label: "Dibuat", color: "#FF9500", bg: "#FFF3E0", border: "#FFCC80", dot: "#FF9500",
    nextLabel: "Tandai Siap", nextStatus: "ready", nextBg: "#34C759",
  },
  ready: {
    label: "Siap",   color: "#34C759", bg: "#F0FFF4", border: "#A3D9A5", dot: "#34C759",
    nextLabel: "Diambil",    nextStatus: "taken",  nextBg: "#007AFF",
  },
  taken: {
    label: "Selesai", color: "#007AFF", bg: "#EEF4FF", border: "#BDD0FF", dot: "#007AFF",
    nextLabel: "", nextStatus: "", nextBg: "",
  },
};

const STATUS_ORDER: Record<string, number> = { waiting: 0, making: 1, ready: 2, taken: 3 };

type QueueItem = DrinkQueue & { itemType?: string };
type TabType   = "food" | "drink";

// ──────────────────────────────────────────────
// Group by orderId
// ──────────────────────────────────────────────
type OrderGroup = {
  orderId: string;
  customerName: string;
  tableNumber: string | null;
  orderType: string;
  items: QueueItem[];
  worstStatus: string;
  earliestTime: Date;
};

function groupByOrder(items: QueueItem[]): OrderGroup[] {
  const map = new Map<string, OrderGroup>();
  for (const item of items) {
    const oid = (item as any).orderId ?? item.id;
    if (!map.has(oid)) {
      map.set(oid, {
        orderId: oid,
        customerName: item.customerName,
        tableNumber: (item as any).tableNumber ?? null,
        orderType: item.orderType,
        items: [],
        worstStatus: item.status,
        earliestTime: new Date(item.createdAt),
      });
    }
    const g = map.get(oid)!;
    g.items.push(item);
    if ((STATUS_ORDER[item.status] ?? 0) < (STATUS_ORDER[g.worstStatus] ?? 0)) {
      g.worstStatus = item.status;
    }
    const t = new Date(item.createdAt);
    if (t < g.earliestTime) g.earliestTime = t;
  }
  // Sort items within each group: waiting → making → ready
  for (const g of map.values()) {
    g.items.sort((a, b) => (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0));
  }
  return Array.from(map.values()).sort((a, b) => {
    const sd = (STATUS_ORDER[a.worstStatus] ?? 0) - (STATUS_ORDER[b.worstStatus] ?? 0);
    if (sd !== 0) return sd;
    return a.earliestTime.getTime() - b.earliestTime.getTime();
  });
}

// ──────────────────────────────────────────────
// OrderCard — semua item dari satu pesanan
// ──────────────────────────────────────────────
function OrderCard({ group, onStatusChange, pendingId }: {
  group: OrderGroup;
  onStatusChange: (id: string, status: string) => void;
  pendingId: string | null;
}) {
  const cfg = STATUS_CFG[group.worstStatus] ?? STATUS_CFG.waiting;
  const elapsed = Math.floor((Date.now() - group.earliestTime.getTime()) / 60000);

  // Items that can still be advanced
  const actionableWaiting = group.items.filter(i => i.status === "waiting");
  const actionableMaking  = group.items.filter(i => i.status === "making");

  const bulkLabel  = actionableWaiting.length > 0 ? "Buat Semua" : actionableMaking.length > 0 ? "Semua Siap" : null;
  const bulkStatus = actionableWaiting.length > 0 ? "making"     : actionableMaking.length > 0 ? "ready"      : null;
  const bulkBg     = actionableWaiting.length > 0 ? "#FF9500"    : "#34C759";
  const bulkItems  = actionableWaiting.length > 0 ? actionableWaiting : actionableMaking;

  return (
    <div
      data-testid={`kitchen-order-${group.orderId}`}
      style={{
        background: "#fff",
        borderRadius: 20,
        border: `2px solid ${cfg.border}`,
        overflow: "hidden",
        boxShadow: group.worstStatus === "making"
          ? "0 4px 20px rgba(255,149,0,0.15)"
          : group.worstStatus === "ready"
          ? "0 4px 20px rgba(52,199,89,0.15)"
          : "0 2px 8px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
      }}
    >
      {/* Order header */}
      <div style={{
        padding: "14px 16px 12px",
        background: cfg.bg,
        borderBottom: `1px solid ${cfg.border}`,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      }}>
        <div style={{ flex: 1 }}>
          {/* Status + time */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", background: cfg.dot,
              boxShadow: group.worstStatus === "making" ? `0 0 0 3px ${cfg.bg}` : "none",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {cfg.label}
            </span>
            <span style={{ fontSize: 11, color: "#8E8E93" }}>
              <Clock size={10} style={{ display: "inline", marginRight: 2 }} />
              {elapsed < 1 ? "baru" : `${elapsed}m lalu`}
            </span>
          </div>
          {/* Customer + table */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={13} color="#6E6E73" />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>{group.customerName}</span>
            <span style={{ fontSize: 13, color: "#6E6E73" }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#3C3C43" }}>
              {group.orderType === "take_away" ? "Take Away" : `Meja ${group.tableNumber}`}
            </span>
          </div>
        </div>
        {/* Item count badge */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "#fff", border: `1.5px solid ${cfg.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{group.items.length}</span>
          <span style={{ fontSize: 9, color: "#8E8E93", lineHeight: 1 }}>item</span>
        </div>
      </div>

      {/* Item rows */}
      <div style={{ padding: "8px 0" }}>
        {group.items.map((item, idx) => {
          const ic = STATUS_CFG[item.status] ?? STATUS_CFG.waiting;
          const isFood = (item as any).itemType === "food";
          const isPending = pendingId === item.id;
          return (
            <div
              key={item.id}
              data-testid={`kitchen-item-${item.id}`}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px",
                borderBottom: idx < group.items.length - 1 ? "1px solid #F2F2F7" : "none",
              }}
            >
              {/* Food/drink icon */}
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: isFood ? "#FFF3E0" : "#E3F2FD",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isFood
                  ? <ChefHat size={14} color="#E65100" />
                  : <GlassWater size={14} color="#1565C0" />}
              </div>

              {/* Name + notes */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: 0, lineHeight: 1.3 }}>
                  {item.drinkName}
                </p>
                {item.notes && (
                  <p style={{ fontSize: 11, color: "#FF9500", fontStyle: "italic", margin: "2px 0 0" }}>
                    {item.notes}
                  </p>
                )}
              </div>

              {/* Status chip */}
              <div style={{
                height: 24, paddingInline: 8, borderRadius: 999,
                background: ic.bg, border: `1px solid ${ic.border}`,
                display: "flex", alignItems: "center",
                fontSize: 10, fontWeight: 700, color: ic.color,
                flexShrink: 0,
              }}>
                {ic.label}
              </div>

              {/* Action button */}
              {ic.nextLabel && (
                <button
                  onClick={() => onStatusChange(item.id, ic.nextStatus)}
                  disabled={isPending}
                  data-testid={`button-kitchen-${item.id}-next`}
                  style={{
                    height: 32, paddingInline: 12, borderRadius: 8,
                    border: "none", cursor: isPending ? "wait" : "pointer",
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    display: "flex", alignItems: "center", gap: 4,
                    background: ic.nextBg, color: "#fff",
                    opacity: isPending ? 0.7 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {isPending
                    ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                    : <ChevronRight size={13} />}
                  {ic.nextLabel}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk action footer */}
      {bulkLabel && bulkStatus && bulkItems.length > 1 && (
        <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #F2F2F7" }}>
          <button
            data-testid={`button-kitchen-bulk-${group.orderId}`}
            onClick={() => bulkItems.forEach(i => onStatusChange(i.id, bulkStatus))}
            style={{
              width: "100%", height: 44, borderRadius: 10,
              border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: bulkBg, color: "#fff",
            }}
          >
            <Utensils size={14} />
            {bulkLabel} ({bulkItems.length} item)
          </button>
        </div>
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
      await queryClient.cancelQueries({ queryKey: ["/api/drink-queue"] });
      const prev = queryClient.getQueryData<QueueItem[]>(["/api/drink-queue"]);
      queryClient.setQueryData(["/api/drink-queue"], (old: QueueItem[] | undefined) =>
        old ? old.map(item => item.id === id ? { ...item, status } : item) : old
      );
      return { prev };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drink-queue"] });
    },
    onError: (error: any, _vars, context) => {
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

  // Group by order
  const orderGroups = groupByOrder(displayQueue);

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
                ? "#007AFF"
                : "#FF9500",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {mode === "drink" ? <GlassWater size={20} color="#fff" /> : <ChefHat size={20} color="#fff" />}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", margin: 0 }}>
                {mode === "food" ? "Dapur" : mode === "drink" ? "Bar" : "Dapur & Bar"}
              </h1>
              <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>
                {orderGroups.length} pesanan · {displayQueue.length} item · auto-refresh 4 detik
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

        {/* Status pills — count by items */}
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
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: "#fff", borderRadius: 20, height: 220,
                border: "2px solid #E5E5EA", animation: "pulse 1.5s infinite",
              }} />
            ))}
          </div>
        ) : orderGroups.length === 0 ? (
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {orderGroups.map(group => (
              <OrderCard
                key={group.orderId}
                group={group}
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
