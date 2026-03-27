import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GlassWater, ChefHat, LayoutGrid, Clock, Trash2, RefreshCw, ChevronDown, ChevronUp, CheckCircle2, Circle, Loader2 } from "lucide-react";
import type { DrinkQueue } from "@shared/schema";

// ──────────────────────────────────────────────
// Config per-status item
// ──────────────────────────────────────────────
const ITEM_STATUS: Record<string, { label: string; color: string; bg: string; nextLabel: string; nextStatus: string; nextBg: string }> = {
  waiting: { label: "Antri", color: "#8E8E93", bg: "#F2F2F7", nextLabel: "Mulai Buat", nextStatus: "making", nextBg: "#FF9500" },
  making:  { label: "Dibuat", color: "#FF9500", bg: "#FFF3E0", nextLabel: "Tandai Siap", nextStatus: "ready",  nextBg: "#34C759" },
  ready:   { label: "Siap",   color: "#34C759", bg: "#F0FFF4", nextLabel: "Diambil",     nextStatus: "taken",  nextBg: "#007AFF" },
  taken:   { label: "Selesai", color: "#007AFF", bg: "#EEF4FF", nextLabel: "",            nextStatus: "",       nextBg: "" },
};

// ──────────────────────────────────────────────
// Helper — group items by orderId
// ──────────────────────────────────────────────
type QueueItem = DrinkQueue & { itemType?: string };
type OrderGroup = {
  orderId: string;
  customerName: string;
  tableNumber: string;
  orderType: string;
  createdAt: Date;
  items: QueueItem[];
};

function groupByOrder(queue: QueueItem[]): OrderGroup[] {
  const map = new Map<string, OrderGroup>();
  for (const item of queue) {
    const key = item.orderId || item.id;
    if (!map.has(key)) {
      map.set(key, {
        orderId: key,
        customerName: item.customerName,
        tableNumber: item.tableNumber || "",
        orderType: item.orderType || "dine_in",
        createdAt: new Date(item.createdAt),
        items: [],
      });
    }
    map.get(key)!.items.push(item);
  }
  // Sort by oldest first
  return Array.from(map.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

// ──────────────────────────────────────────────
// Order-level status summary
// ──────────────────────────────────────────────
function getOrderStatus(items: QueueItem[]) {
  const all = items.length;
  const taken  = items.filter(i => i.status === "taken").length;
  const ready  = items.filter(i => i.status === "ready").length;
  const making = items.filter(i => i.status === "making").length;
  const done = taken + ready;

  if (taken === all) return { label: "Selesai", color: "#007AFF", bg: "#EEF4FF" };
  if (making > 0)    return { label: "Diproses", color: "#FF9500", bg: "#FFF3E0" };
  if (done > 0)      return { label: "Sebagian Siap", color: "#34C759", bg: "#F0FFF4" };
  return               { label: "Antrian", color: "#8E8E93", bg: "#F2F2F7" };
}

// ──────────────────────────────────────────────
// ItemRow inside expanded order card
// ──────────────────────────────────────────────
function ItemRow({ item, onStatusChange, pendingId }: {
  item: QueueItem;
  onStatusChange: (id: string, status: string) => void;
  pendingId: string | null;
}) {
  const cfg = ITEM_STATUS[item.status] ?? ITEM_STATUS.waiting;
  const isDone = item.status === "taken";
  const isPending = pendingId === item.id;
  const isFood = (item as any).itemType === "food";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px", borderRadius: 12,
      background: isDone ? "#F9F9F9" : "#fff",
      border: "1.5px solid #F2F2F7",
      opacity: isDone ? 0.7 : 1,
    }}>
      {/* Done icon */}
      {isDone
        ? <CheckCircle2 size={18} color="#007AFF" />
        : <Circle size={18} color="#D1D1D6" />}

      {/* Type chip */}
      <span style={{
        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 999,
        background: isFood ? "#FFF3E0" : "#E3F2FD",
        color: isFood ? "#E65100" : "#1565C0",
        flexShrink: 0,
      }}>
        {isFood ? <ChefHat size={9} style={{ display: "inline", marginRight: 2 }} /> : <GlassWater size={9} style={{ display: "inline", marginRight: 2 }} />}
        {isFood ? "Makanan" : "Minuman"}
      </span>

      {/* Name + notes */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: isDone ? "#8E8E93" : "#1D1D1F", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.drinkName}
        </p>
        {item.notes && (
          <p style={{ fontSize: 11, color: "#FF9500", fontStyle: "italic", margin: "1px 0 0" }}>
            {item.notes}
          </p>
        )}
      </div>

      {/* Status chip */}
      <span style={{
        fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
        background: cfg.bg, color: cfg.color, flexShrink: 0,
      }}>
        {cfg.label}
      </span>

      {/* Action button */}
      {cfg.nextLabel && (
        <button
          onClick={() => onStatusChange(item.id, cfg.nextStatus)}
          disabled={isPending}
          data-testid={`button-item-${item.id}-next`}
          style={{
            height: 34, paddingInline: 12, borderRadius: 8, border: "none",
            background: cfg.nextBg, color: "#fff",
            fontSize: 12, fontWeight: 700, cursor: isPending ? "wait" : "pointer",
            display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : null}
          {cfg.nextLabel}
        </button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Order Card (collapsed / expanded)
// ──────────────────────────────────────────────
function OrderCard({ group, onStatusChange, pendingId }: {
  group: OrderGroup;
  onStatusChange: (id: string, status: string) => void;
  pendingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const elapsed = Math.floor((Date.now() - group.createdAt.getTime()) / 60000);
  const status = getOrderStatus(group.items);

  const totalItems = group.items.length;
  const doneItems = group.items.filter(i => i.status === "taken" || i.status === "ready").length;
  const progressPct = totalItems > 0 ? (doneItems / totalItems) * 100 : 0;

  const foodCount = group.items.filter(i => (i as any).itemType === "food").length;
  const drinkCount = group.items.filter(i => (i as any).itemType !== "food").length;
  const shortId = group.orderId.slice(-6).toUpperCase();

  // Sort items: waiting → making → ready → taken
  const sortOrder = { waiting: 0, making: 1, ready: 2, taken: 3 };
  const sortedItems = [...group.items].sort((a, b) =>
    (sortOrder[a.status as keyof typeof sortOrder] ?? 0) - (sortOrder[b.status as keyof typeof sortOrder] ?? 0)
  );

  const isAllDone = group.items.every(i => i.status === "taken");

  return (
    <div
      data-testid={`order-card-${group.orderId}`}
      style={{
        background: "#fff",
        borderRadius: 18,
        border: `2px solid ${isAllDone ? "#BDD0FF" : status.color + "33"}`,
        overflow: "hidden",
        boxShadow: isAllDone
          ? "0 2px 8px rgba(0,122,255,0.08)"
          : status.label === "Diproses"
          ? "0 4px 16px rgba(255,149,0,0.15)"
          : "0 2px 8px rgba(0,0,0,0.05)",
        opacity: isAllDone ? 0.75 : 1,
        transition: "all 0.2s",
      }}
    >
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-${group.orderId}`}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          padding: "16px 18px", textAlign: "left",
        }}
      >
        {/* Row 1: ID + status + time */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#AEAEB2", letterSpacing: "0.05em" }}>
            #{shortId}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
            background: status.bg, color: status.color,
          }}>
            {status.label}
          </span>
          <span style={{ fontSize: 11, color: "#AEAEB2", marginLeft: "auto" }}>
            <Clock size={11} style={{ display: "inline", marginRight: 3 }} />
            {elapsed < 1 ? "baru" : `${elapsed}m lalu`}
          </span>
        </div>

        {/* Row 2: Customer + table */}
        <p style={{ fontSize: 16, fontWeight: 800, color: "#1D1D1F", margin: "0 0 2px" }}>
          {group.customerName}
        </p>
        <p style={{ fontSize: 13, color: "#6E6E73", margin: "0 0 10px" }}>
          {group.orderType === "take_away" ? "Take Away" : `Meja ${group.tableNumber}`}
        </p>

        {/* Row 3: Type chips + progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          {foodCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              background: "#FFF3E0", color: "#E65100",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <ChefHat size={10} /> {foodCount} Makanan
            </span>
          )}
          {drinkCount > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
              background: "#E3F2FD", color: "#1565C0",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <GlassWater size={10} /> {drinkCount} Minuman
            </span>
          )}
          <span style={{ fontSize: 11, color: "#8E8E93", marginLeft: "auto" }}>
            {doneItems}/{totalItems} selesai
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 999, background: "#F2F2F7", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 999,
            width: `${progressPct}%`,
            background: progressPct === 100
              ? "#34C759"
              : "#FF9500",
            transition: "width 0.4s ease",
          }} />
        </div>

        {/* Expand toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 10, color: "#AEAEB2" }}>
          {expanded
            ? <ChevronUp size={18} />
            : <ChevronDown size={18} />}
          <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 4 }}>
            {expanded ? "Tutup" : "Lihat Detail Item"}
          </span>
        </div>
      </button>

      {/* Expanded items list */}
      {expanded && (
        <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 1, background: "#F2F2F7", marginBottom: 4 }} />
          {sortedItems.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onStatusChange={onStatusChange}
              pendingId={pendingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────
type TabType = "all" | "active" | "done";

export default function DrinkQueueSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data: queue = [], isLoading, refetch } = useQuery<QueueItem[]>({
    queryKey: ["/api/drink-queue"],
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/drink-queue/${id}`, { status });
      return res.json();
    },
    onMutate: async ({ id, status }) => {
      setPendingId(id);
      // Batalkan refetch yang sedang berjalan
      await queryClient.cancelQueries({ queryKey: ["/api/drink-queue"] });
      // Simpan snapshot sebelum optimistic update
      const previous = queryClient.getQueryData<QueueItem[]>(["/api/drink-queue"]);
      // Update cache secara langsung — respons instan
      queryClient.setQueryData<QueueItem[]>(["/api/drink-queue"], (old = []) =>
        old.map(item => item.id === id ? { ...item, status } : item)
      );
      return { previous };
    },
    onError: (error: any, _vars, context) => {
      // Rollback kalau gagal
      if (context?.previous) {
        queryClient.setQueryData(["/api/drink-queue"], context.previous);
      }
      const msg = error?.message || "";
      toast({
        title: msg.includes("429") ? "Terlalu banyak request" : "Gagal update status",
        description: msg.includes("429") ? "Tunggu sebentar lalu coba lagi" : msg,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Sinkronisasi dengan server setelah sukses
      queryClient.invalidateQueries({ queryKey: ["/api/drink-queue"] });
    },
    onSettled: () => setPendingId(null),
    retry: (failureCount, error: any) => error?.message?.includes("429") && failureCount < 2,
    retryDelay: 1500,
  });

  const clearTakenMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/drink-queue/clear-taken", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/drink-queue"] });
      toast({ title: `${data.cleared} item diarsipkan` });
    },
  });

  // Group by order
  const allGroups = groupByOrder(queue);
  const activeGroups = allGroups.filter(g => !g.items.every(i => i.status === "taken"));
  const doneGroups   = allGroups.filter(g => g.items.every(i => i.status === "taken"));

  const displayGroups = activeTab === "active" ? activeGroups
    : activeTab === "done" ? doneGroups
    : allGroups;

  // Stats
  const totalOrders  = allGroups.length;
  const antriOrders  = allGroups.filter(g => g.items.every(i => i.status === "waiting")).length;
  const prosesOrders = allGroups.filter(g => g.items.some(i => i.status === "making" || i.status === "ready") && !g.items.every(i => i.status === "taken")).length;
  const doneCount    = doneGroups.length;

  const TABS: { key: TabType; label: string; count: number }[] = [
    { key: "active", label: "Aktif",   count: activeGroups.length },
    { key: "done",   label: "Selesai", count: doneGroups.length },
    { key: "all",    label: "Semua",   count: allGroups.length },
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
              background: "#FF9500",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LayoutGrid size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", margin: 0 }}>Antrian Pesanan</h1>
              <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>
                {totalOrders} pesanan · auto-refresh 5 detik
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => refetch()}
              data-testid="button-refresh-queue"
              style={{
                height: 44, paddingInline: 16, borderRadius: 10,
                border: "1.5px solid #E5E5EA", background: "#fff",
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 600, color: "#1D1D1F", cursor: "pointer",
              }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              onClick={() => clearTakenMutation.mutate()}
              disabled={clearTakenMutation.isPending}
              data-testid="button-clear-taken"
              style={{
                height: 44, paddingInline: 16, borderRadius: 10,
                border: "1.5px solid #E5E5EA", background: "#F2F2F7",
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 600, color: "#6E6E73", cursor: "pointer",
              }}
            >
              <Trash2 size={16} /> Bersihkan
            </button>
          </div>
        </div>

        {/* Status summary pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { label: "Antri",    count: antriOrders,  color: "#8E8E93", bg: "#F2F2F7" },
            { label: "Diproses", count: prosesOrders, color: "#FF9500", bg: "#FFF3E0" },
            { label: "Selesai",  count: doneCount,    color: "#007AFF", bg: "#EEF4FF" },
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

        {/* Tabs */}
        <div style={{ display: "flex", borderTop: "1px solid #E5E5EA" }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                data-testid={`tab-queue-${tab.key}`}
                style={{
                  flex: 1, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 6, border: "none", background: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#FF9500" : "#6E6E73",
                  borderBottom: isActive ? "2.5px solid #FF9500" : "2.5px solid transparent",
                }}
              >
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
                background: "#fff", borderRadius: 18, padding: 20, height: 180,
                border: "2px solid #E5E5EA", animation: "pulse 1.5s infinite",
              }} />
            ))}
          </div>
        ) : displayGroups.length === 0 ? (
          <div style={{ textAlign: "center", paddingBlock: 80, color: "#8E8E93" }}>
            <LayoutGrid size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
              {activeTab === "active" ? "Tidak ada antrian aktif" : activeTab === "done" ? "Belum ada yang selesai" : "Tidak ada antrian"}
            </p>
            <p style={{ fontSize: 13, color: "#AEAEB2" }}>
              {activeTab === "active" ? "Antrian akan muncul otomatis saat pesanan masuk" : "Pesanan selesai akan muncul di sini"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {displayGroups.map(group => (
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
