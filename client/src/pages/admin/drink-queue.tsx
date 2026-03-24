import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassWater, ChefHat, LayoutGrid, Clock, Trash2, RefreshCw, ChevronRight } from "lucide-react";
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

const TYPE_ICON: Record<string, any> = {
  drink: GlassWater,
  food: ChefHat,
};

function ItemCard({ item, onStatusChange, isPending }: {
  item: DrinkQueue & { itemType?: string };
  onStatusChange: (id: string, status: string) => void;
  isPending: boolean;
}) {
  const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.waiting;
  const now = new Date();
  const elapsed = Math.floor((now.getTime() - new Date(item.createdAt).getTime()) / 60000);
  const itemType = (item as any).itemType || "drink";
  const TypeIcon = TYPE_ICON[itemType] || GlassWater;

  return (
    <div
      data-testid={`queue-card-${item.id}`}
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

      {/* Status + type */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: cfg.dot,
          boxShadow: item.status === "making" ? `0 0 0 3px ${cfg.bg}` : "none",
        }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {cfg.label}
        </span>
        {/* Item type badge */}
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "1px 7px",
          borderRadius: 999, marginLeft: 4,
          background: itemType === "drink" ? "#E3F2FD" : "#FFF3E0",
          color: itemType === "drink" ? "#1565C0" : "#E65100",
        }}>
          <TypeIcon size={9} style={{ display: "inline", marginRight: 3 }} />
          {itemType === "drink" ? "Minuman" : "Makanan"}
        </span>
        <span style={{ fontSize: 11, color: "#8E8E93", marginLeft: "auto", marginRight: 48 }}>
          {elapsed < 1 ? "baru" : `${elapsed}m lalu`}
        </span>
      </div>

      {/* Item name */}
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
            Catatan: {item.notes}
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
            marginTop: 14, width: "100%", height: 48,
            borderRadius: 12, border: "none", cursor: isPending ? "wait" : "pointer",
            fontSize: 14, fontWeight: 700, display: "flex",
            alignItems: "center", justifyContent: "center", gap: 6,
            ...cfg.nextStyle,
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {cfg.nextLabel}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

type TabType = "all" | "food" | "drink";

export default function DrinkQueueSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const { data: queue = [], isLoading, refetch } = useQuery<(DrinkQueue & { itemType?: string })[]>({
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
    onError: (error: any) => {
      const msg = error?.message || "";
      if (msg.includes("429") || msg.includes("Too many")) {
        toast({ title: "Terlalu banyak request", description: "Tunggu sebentar lalu coba lagi", variant: "destructive" });
      } else {
        toast({ title: "Gagal update status", description: msg, variant: "destructive" });
      }
    },
    retry: (failureCount, error: any) => {
      const msg = error?.message || "";
      return msg.includes("429") && failureCount < 2;
    },
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

  const foodItems = queue.filter(q => (q as any).itemType === "food");
  const drinkItems = queue.filter(q => (q as any).itemType !== "food");

  const displayQueue = activeTab === "food" ? foodItems : activeTab === "drink" ? drinkItems : queue;

  const waiting = displayQueue.filter(q => q.status === "waiting");
  const making = displayQueue.filter(q => q.status === "making");
  const ready = displayQueue.filter(q => q.status === "ready");

  const TABS: { key: TabType; label: string; icon: any; count: number }[] = [
    { key: "all", label: "Semua", icon: LayoutGrid, count: queue.length },
    { key: "food", label: "Makanan", icon: ChefHat, count: foodItems.length },
    { key: "drink", label: "Minuman", icon: GlassWater, count: drinkItems.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7" }}>
      {/* Header */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #E5E5EA",
        padding: "20px 24px 0",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "linear-gradient(135deg, #FF9500, #FF2D55)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LayoutGrid size={20} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", margin: 0 }}>Antrian Pesanan</h1>
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
                height: 44, paddingInline: 16, borderRadius: 10,
                border: "1.5px solid #E5E5EA", background: "#fff",
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 600, color: "#1D1D1F", cursor: "pointer",
              }}
            >
              <RefreshCw size={16} />
              Refresh
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
              <Trash2 size={16} />
              Bersihkan
            </button>
          </div>
        </div>

        {/* Status pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
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

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderTop: "1px solid #E5E5EA" }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
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
                  transition: "all 0.15s",
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
                background: "#fff", borderRadius: 20, padding: 20,
                height: 160, border: "2px solid #E5E5EA",
                animation: "pulse 1.5s infinite",
              }} />
            ))}
          </div>
        ) : displayQueue.length === 0 ? (
          <div style={{ textAlign: "center", paddingBlock: 80, color: "#8E8E93" }}>
            <LayoutGrid size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Tidak ada antrian</p>
            <p style={{ fontSize: 13, color: "#AEAEB2" }}>
              {activeTab === "food" ? "Belum ada antrian makanan" : activeTab === "drink" ? "Belum ada antrian minuman" : "Antrian akan muncul otomatis saat pesanan masuk"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {displayQueue.map(item => (
              <ItemCard
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
