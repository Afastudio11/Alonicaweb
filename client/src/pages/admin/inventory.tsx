import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, ArrowUpCircle, ArrowDownCircle, SlidersHorizontal, Package, AlertTriangle, TrendingUp, History, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getStockStatus } from "@/lib/utils";
import { INVENTORY_CATEGORIES, INVENTORY_UNITS_BY_CATEGORY } from "@/lib/constants";
import type { InventoryItem, InsertInventoryItem, StockMovement } from "@shared/schema";

function todayLocal() {
  return new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD in local tz
}

function movementLocalDate(iso: string) {
  return new Date(iso).toLocaleDateString("sv-SE");
}

function getDateLabel(dateStr: string) {
  const t = todayLocal();
  const yest = new Date(Date.now() - 86400000).toLocaleDateString("sv-SE");
  if (dateStr === t) return "Hari Ini";
  if (dateStr === yest) return "Kemarin";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

const MOVEMENT_TYPE_CONFIG = {
  in: { label: "Masuk", icon: ArrowUpCircle, color: "#34C759", bg: "#F0FFF4" },
  out: { label: "Keluar", icon: ArrowDownCircle, color: "#FF3B30", bg: "#FFF0EF" },
  adjustment: { label: "Penyesuaian", icon: SlidersHorizontal, color: "#007AFF", bg: "#F0F5FF" },
  order_deduction: { label: "Pemakaian Pesanan", icon: ArrowDownCircle, color: "#FF9500", bg: "#FFF3E0" },
};

function StockBar({ current, min, max }: { current: number; min: number; max: number }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const status = getStockStatus(current, min, max);
  const color = status === "critical" ? "#FF3B30" : status === "low" ? "#FF9500" : "#34C759";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: "#F2F2F7", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: color, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 30, textAlign: "right" }}>{Math.round(pct)}%</span>
    </div>
  );
}

function AdjustStockDialog({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [type, setType] = useState<"in" | "out" | "adjustment">("in");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [purchasePrice, setPurchasePrice] = useState(item.pricePerUnit || 0);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/inventory/adjust", {
        inventoryItemId: item.id,
        quantity,
        reason,
        type,
        ...(type === "in" && purchasePrice > 0 ? { purchasePrice } : {}),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/movements"] });
      toast({ title: "Stok berhasil diupdate" });
      onClose();
    },
    onError: () => toast({ title: "Gagal update stok", variant: "destructive" }),
  });

  const preview = type === "out"
    ? Math.max(0, item.currentStock - quantity)
    : type === "in"
    ? item.currentStock + quantity
    : Math.max(0, quantity);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        background: "#F5F5F7", borderRadius: 12, padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ fontSize: 13, color: "#6E6E73", margin: 0 }}>Stok Saat Ini</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: "#1D1D1F", margin: 0 }}>
            {item.currentStock} {item.unit}
          </p>
        </div>
        {quantity > 0 && (
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 13, color: "#6E6E73", margin: 0 }}>Setelah</p>
            <p style={{
              fontSize: 22, fontWeight: 800, margin: 0,
              color: preview < item.minStock ? "#FF3B30" : "#34C759",
            }}>
              {preview} {item.unit}
            </p>
          </div>
        )}
      </div>

      <div>
        <Label style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>Jenis Perubahan</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
          {(["in", "out", "adjustment"] as const).map(t => {
            const cfg = MOVEMENT_TYPE_CONFIG[t];
            const Icon = cfg.icon;
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  padding: "10px 8px", borderRadius: 10, border: `2px solid`,
                  borderColor: type === t ? cfg.color : "#E5E5EA",
                  background: type === t ? cfg.bg : "#fff",
                  cursor: "pointer", textAlign: "center",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={16} color={type === t ? cfg.color : "#8E8E93"} style={{ display: "block", margin: "0 auto 4px" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: type === t ? cfg.color : "#8E8E93" }}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>
          {type === "adjustment" ? "Stok Baru" : "Jumlah"} ({item.unit})
        </Label>
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={e => setQuantity(Math.abs(parseInt(e.target.value) || 0))}
          style={{ marginTop: 6 }}
          data-testid="input-adjust-quantity"
        />
      </div>

      {/* Harga Beli — hanya muncul saat Masuk (restock) */}
      {type === "in" && (
        <div>
          <Label style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>
            Harga Beli per {item.unit} (Rp)
            {item.pricePerUnit > 0 && (
              <span style={{ fontSize: 11, color: "#8E8E93", fontWeight: 400, marginLeft: 6 }}>
                terakhir: {formatRp(item.pricePerUnit)}
              </span>
            )}
          </Label>
          <Input
            type="number"
            min={0}
            value={purchasePrice || ""}
            placeholder="Kosongkan jika tidak tahu"
            onChange={e => setPurchasePrice(parseInt(e.target.value) || 0)}
            style={{ marginTop: 6 }}
            data-testid="input-purchase-price"
          />
          <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 4 }}>
            Harga ini akan jadi referensi harga terakhir bahan baku ini.
          </p>
        </div>
      )}

      <div>
        <Label style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F" }}>Keterangan (opsional)</Label>
        <Input
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={type === "in" ? "Nama supplier / keterangan..." : type === "out" ? "Terbuang / rusak..." : "Koreksi stok..."}
          style={{ marginTop: 6 }}
          data-testid="input-adjust-reason"
        />
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || quantity === 0}
        data-testid="button-confirm-adjust"
        style={{
          width: "100%", height: 48, borderRadius: 12, border: "none",
          cursor: mutation.isPending || quantity === 0 ? "not-allowed" : "pointer",
          fontSize: 15, fontWeight: 700,
          background: quantity === 0 ? "#E5E5EA" : "linear-gradient(135deg, #FF9500, #FF2D55)",
          color: quantity === 0 ? "#8E8E93" : "#fff",
          boxShadow: quantity === 0 ? "none" : "0 4px 16px rgba(255,149,0,0.35)",
        }}
      >
        {mutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );
}

export default function InventorySection() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tab, setTab] = useState<"items" | "movements">("items");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState("");
  const [movementDate, setMovementDate] = useState(todayLocal());
  const [movementTypeFilter, setMovementTypeFilter] = useState<"all" | "in" | "out">("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<{ items: InventoryItem[]; total: number }>({
    queryKey: ["/api/inventory"],
  });

  const { data: movements = [], isLoading: loadingMovements } = useQuery<StockMovement[]>({
    queryKey: ["/api/inventory/movements"],
    enabled: tab === "movements",
  });

  const inventoryItems = data?.items || [];

  const createItemMutation = useMutation({
    mutationFn: async (item: InsertInventoryItem) => {
      const response = await apiRequest("POST", "/api/inventory", item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setShowAddDialog(false);
      toast({ title: "Item berhasil ditambahkan" });
    },
    onError: () => toast({ title: "Gagal menambahkan item", variant: "destructive" }),
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, item }: { id: string; item: Partial<InsertInventoryItem> }) => {
      const response = await apiRequest("PUT", `/api/inventory/${id}`, item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setEditingItem(null);
      toast({ title: "Item berhasil diupdate" });
    },
    onError: () => toast({ title: "Gagal update item", variant: "destructive" }),
  });

  const filtered = inventoryItems
    .filter(item => categoryFilter === "all" || item.category === categoryFilter)
    .filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()));

  const criticalCount = inventoryItems.filter(i => getStockStatus(i.currentStock, i.minStock, i.maxStock) === "critical").length;
  const lowCount = inventoryItems.filter(i => getStockStatus(i.currentStock, i.minStock, i.maxStock) === "low").length;
  const okCount = inventoryItems.filter(i => getStockStatus(i.currentStock, i.minStock, i.maxStock) === "sufficient").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Item", value: inventoryItems.length, icon: Package, color: "#007AFF", bg: "#EEF4FF" },
          { label: "Kritis", value: criticalCount, icon: AlertTriangle, color: "#FF3B30", bg: "#FFF0EF" },
          { label: "Hampir Habis", value: lowCount, icon: AlertTriangle, color: "#FF9500", bg: "#FFF3E0" },
          { label: "Aman", value: okCount, icon: TrendingUp, color: "#34C759", bg: "#F0FFF4" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{
              background: "#fff", borderRadius: 16, padding: "16px 18px",
              border: "1px solid #E5E5EA",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#6E6E73", fontWeight: 500 }}>{s.label}</span>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: s.bg, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={16} color={s.color} />
                </div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 800, color: s.color, margin: 0 }}>
                {s.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tab + header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 4, background: "#F2F2F7", borderRadius: 10, padding: 3 }}>
          {([["items", "Bahan Baku", Package], ["movements", "Riwayat Stok", History]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              data-testid={`tab-${key}`}
              style={{
                height: 44, paddingInline: 18, borderRadius: 10, border: "none",
                background: tab === key ? "#fff" : "transparent",
                color: tab === key ? "#1D1D1F" : "#6E6E73",
                fontWeight: tab === key ? 700 : 500,
                fontSize: 14, cursor: "pointer",
                boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                display: "flex", alignItems: "center", gap: 6,
                transition: "all 0.15s",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="h-11"
            data-testid="button-refresh-inventory"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="h-11" data-testid="button-add-inventory-item">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Item Baru</DialogTitle>
                <DialogDescription>Tambah bahan baku ke sistem inventori.</DialogDescription>
              </DialogHeader>
              <InventoryItemForm
                onSubmit={item => createItemMutation.mutate(item)}
                isLoading={createItemMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Items tab */}
      {tab === "items" && (
        <>
          {/* Search + category filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Input
              placeholder="Cari bahan baku..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              data-testid="input-search-inventory"
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["all", ...INVENTORY_CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    height: 44, paddingInline: 16, borderRadius: 999,
                    border: "1.5px solid",
                    borderColor: categoryFilter === cat ? "#FF9500" : "#E5E5EA",
                    background: categoryFilter === cat ? "#FFF3E0" : "#fff",
                    color: categoryFilter === cat ? "#FF9500" : "#6E6E73",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  data-testid={`filter-${cat}`}
                >
                  {cat === "all" ? "Semua" : cat}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: "grid", gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 80, background: "#F5F5F7", borderRadius: 14, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#8E8E93" }}>
              <Package size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>Tidak ada item ditemukan</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map(item => {
                const status = getStockStatus(item.currentStock, item.minStock, item.maxStock);
                const statusColor = status === "critical" ? "#FF3B30" : status === "low" ? "#FF9500" : "#34C759";
                const statusLabel = status === "critical" ? "Kritis" : status === "low" ? "Hampir Habis" : "Aman";
                return (
                  <div
                    key={item.id}
                    data-testid={`row-inventory-${item.id}`}
                    style={{
                      background: "#fff", borderRadius: 16, padding: "14px 16px",
                      border: `1.5px solid`,
                      borderColor: status === "critical" ? "#FF3B30" : status === "low" ? "#FFCC80" : "#E5E5EA",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 12, alignItems: "start",
                      boxShadow: status === "critical" ? "0 2px 12px rgba(255,59,48,0.1)" : "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>{item.name}</p>
                        <span style={{
                          fontSize: 10, fontWeight: 800, color: statusColor,
                          background: `${statusColor}15`, borderRadius: 999,
                          padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.05em",
                          flexShrink: 0,
                        }}>
                          {statusLabel}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "#6E6E73", margin: "0 0 8px" }}>
                        {item.category}
                        {item.supplier && ` · ${item.supplier}`}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "#1D1D1F" }}>
                          {item.currentStock}
                        </span>
                        <span style={{ fontSize: 13, color: "#6E6E73" }}>{item.unit}</span>
                        <span style={{ fontSize: 12, color: "#AEAEB2" }}>
                          · min {item.minStock} / max {item.maxStock}
                        </span>
                      </div>
                      <StockBar current={item.currentStock} min={item.minStock} max={item.maxStock} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => setAdjustingItem(item)}
                        data-testid={`button-adjust-${item.id}`}
                        style={{
                          height: 44, paddingInline: 16, borderRadius: 10, border: "none",
                          background: "linear-gradient(135deg, #FF9500, #FFAB00)",
                          color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        <SlidersHorizontal size={14} />
                        Ubah Stok
                      </button>
                      <button
                        onClick={() => setEditingItem(item)}
                        data-testid={`button-edit-inventory-${item.id}`}
                        style={{
                          height: 44, paddingInline: 16, borderRadius: 10,
                          border: "1.5px solid #E5E5EA", background: "#fff",
                          color: "#1D1D1F", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Movements tab */}
      {tab === "movements" && (() => {
        const today = todayLocal();
        // Filter movements by selected date (client-side, local timezone)
        const dayMovements = movements.filter(m => movementLocalDate(m.createdAt as unknown as string) === movementDate);
        const outMovements = dayMovements.filter(m => m.type === "out" || m.type === "order_deduction");
        const inMovements  = dayMovements.filter(m => m.type === "in");

        const filtered = dayMovements.filter(m => {
          if (movementTypeFilter === "out") return m.type === "out" || m.type === "order_deduction";
          if (movementTypeFilter === "in")  return m.type === "in";
          return true;
        });

        function goDay(delta: number) {
          const d = new Date(movementDate);
          d.setDate(d.getDate() + delta);
          setMovementDate(d.toLocaleDateString("sv-SE"));
        }

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Date navigator */}
            <div style={{
              background: "#fff", borderRadius: 16, border: "1px solid #E5E5EA",
              padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
            }}>
              <button
                onClick={() => goDay(-1)}
                style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E5E5EA", background: "#F5F5F7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                data-testid="button-prev-day"
              >
                <ChevronLeft size={18} color="#1D1D1F" />
              </button>

              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Calendar size={15} color="#FF9500" />
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F" }}>
                    {getDateLabel(movementDate)}
                  </span>
                </div>
                {movementDate !== today && (
                  <p style={{ fontSize: 11, color: "#8E8E93", margin: "2px 0 0" }}>
                    {new Date(movementDate).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>

              <button
                onClick={() => goDay(1)}
                disabled={movementDate >= today}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: "1.5px solid #E5E5EA",
                  background: movementDate >= today ? "#F5F5F7" : "#F5F5F7",
                  cursor: movementDate >= today ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: movementDate >= today ? 0.35 : 1,
                }}
                data-testid="button-next-day"
              >
                <ChevronRight size={18} color="#1D1D1F" />
              </button>

              {movementDate !== today && (
                <button
                  onClick={() => setMovementDate(today)}
                  style={{
                    height: 36, paddingInline: 14, borderRadius: 10, border: "none",
                    background: "#FF9500", color: "#fff", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", flexShrink: 0,
                  }}
                  data-testid="button-go-today"
                >
                  Hari Ini
                </button>
              )}
            </div>

            {/* Daily summary */}
            {dayMovements.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "#F0FFF4", borderRadius: 14, padding: "12px 16px", border: "1.5px solid #D4F7E0" }}>
                  <p style={{ fontSize: 11, color: "#34C759", fontWeight: 700, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Masuk</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", margin: 0 }}>{inMovements.length} item</p>
                  <p style={{ fontSize: 11, color: "#34C759", margin: "2px 0 0" }}>{inMovements.length} transaksi restok</p>
                </div>
                <div style={{ background: "#FFF0EF", borderRadius: 14, padding: "12px 16px", border: "1.5px solid #FFDBD9" }}>
                  <p style={{ fontSize: 11, color: "#FF3B30", fontWeight: 700, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Keluar</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: "#1D1D1F", margin: 0 }}>{outMovements.length} item</p>
                  <p style={{ fontSize: 11, color: "#FF3B30", margin: "2px 0 0" }}>{outMovements.length} catatan pemakaian</p>
                </div>
              </div>
            )}

            {/* Type filter pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {([
                ["all", "Semua", "#1D1D1F", "#F2F2F7"],
                ["in", "Masuk / Restok", "#34C759", "#F0FFF4"],
                ["out", "Keluar / Pemakaian", "#FF3B30", "#FFF0EF"],
              ] as const).map(([key, label, activeColor, activeBg]) => (
                <button
                  key={key}
                  onClick={() => setMovementTypeFilter(key)}
                  style={{
                    height: 36, paddingInline: 14, borderRadius: 999, border: "1.5px solid",
                    borderColor: movementTypeFilter === key ? activeColor : "#E5E5EA",
                    background: movementTypeFilter === key ? activeBg : "#fff",
                    color: movementTypeFilter === key ? activeColor : "#6E6E73",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Movement list */}
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E5EA", overflow: "hidden" }}>
              {loadingMovements ? (
                <div style={{ padding: 32, textAlign: "center", color: "#8E8E93" }}>Memuat riwayat...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#8E8E93" }}>
                  <History size={36} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>
                    {dayMovements.length === 0
                      ? `Tidak ada pergerakan stok pada ${getDateLabel(movementDate).toLowerCase()}`
                      : "Tidak ada data untuk filter ini"}
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #F2F2F7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", margin: 0 }}>
                      {filtered.length} catatan
                    </p>
                    <p style={{ fontSize: 11, color: "#8E8E93", margin: 0 }}>
                      {getDateLabel(movementDate)}
                    </p>
                  </div>
                  {filtered.map(m => {
                    const cfg = MOVEMENT_TYPE_CONFIG[m.type as keyof typeof MOVEMENT_TYPE_CONFIG] ?? MOVEMENT_TYPE_CONFIG.adjustment;
                    const Icon = cfg.icon;
                    const isOut = m.type === "out" || m.type === "order_deduction";
                    return (
                      <div
                        key={m.id}
                        data-testid={`movement-${m.id}`}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #F5F5F7",
                          display: "flex", alignItems: "center", gap: 12,
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: cfg.bg, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon size={16} color={cfg.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>
                              {m.inventoryItemName}
                            </p>
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: cfg.color,
                              background: cfg.bg, borderRadius: 999, padding: "2px 8px",
                            }}>
                              {cfg.label}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: "#6E6E73", margin: "2px 0 0" }}>
                            {m.reason || "-"} · {formatDate(m.createdAt as unknown as string)}
                          </p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{
                            fontSize: 15, fontWeight: 800, margin: 0,
                            color: isOut ? "#FF3B30" : "#34C759",
                          }}>
                            {isOut ? "-" : "+"}{Math.abs(m.quantity)}
                          </p>
                          <p style={{ fontSize: 11, color: "#AEAEB2", margin: 0 }}>
                            {m.stockBefore} → {m.stockAfter}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Adjust Stock Dialog */}
      <Dialog open={!!adjustingItem} onOpenChange={() => setAdjustingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Stok — {adjustingItem?.name}</DialogTitle>
            <DialogDescription>Catat perubahan stok bahan baku.</DialogDescription>
          </DialogHeader>
          {adjustingItem && (
            <AdjustStockDialog item={adjustingItem} onClose={() => setAdjustingItem(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit — {editingItem?.name}</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <InventoryItemForm
              initialData={editingItem}
              onSubmit={item => updateItemMutation.mutate({ id: editingItem.id, item })}
              isLoading={updateItemMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Item Baru</DialogTitle>
            <DialogDescription>Tambah bahan baku ke sistem inventori.</DialogDescription>
          </DialogHeader>
          <InventoryItemForm
            onSubmit={item => createItemMutation.mutate(item)}
            isLoading={createItemMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper: number input that clears on focus if value is 0
function NumInput({ value, onChange, testId, ...props }: {
  value: number; onChange: (v: number) => void; testId: string; [k: string]: any
}) {
  const [raw, setRaw] = useState(value === 0 ? "" : String(value));
  useEffect(() => { setRaw(value === 0 ? "" : String(value)); }, [value]);
  return (
    <Input
      type="number"
      value={raw}
      placeholder="0"
      onFocus={e => e.target.select()}
      onChange={e => { setRaw(e.target.value); onChange(parseInt(e.target.value) || 0); }}
      onBlur={() => { if (raw === "") setRaw(""); }}
      data-testid={testId}
      {...props}
    />
  );
}

function InventoryItemForm({
  initialData,
  onSubmit,
  isLoading,
}: {
  initialData?: InventoryItem;
  onSubmit: (item: InsertInventoryItem) => void;
  isLoading: boolean;
}) {
  const defaultCategory = initialData?.category || "Bahan Pokok";
  const defaultUnit = initialData?.unit || INVENTORY_UNITS_BY_CATEGORY[defaultCategory]?.default || "gram";

  const [formData, setFormData] = useState<InsertInventoryItem>({
    name: initialData?.name || "",
    category: defaultCategory,
    currentStock: initialData?.currentStock || 0,
    minStock: initialData?.minStock || 0,
    maxStock: initialData?.maxStock || 100,
    unit: defaultUnit,
    pricePerUnit: initialData?.pricePerUnit || 0,
    supplier: initialData?.supplier || "",
  });

  // Auto-update unit when category changes (only if not editing existing)
  const handleCategoryChange = (cat: string) => {
    const newDefault = INVENTORY_UNITS_BY_CATEGORY[cat]?.default || "pcs";
    setFormData(p => ({ ...p, category: cat, unit: newDefault }));
  };

  const availableUnits = INVENTORY_UNITS_BY_CATEGORY[formData.category]?.units || ['pcs', 'gram', 'ml', 'kg', 'liter'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nama Bahan</Label>
        <Input
          value={formData.name}
          onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
          required
          data-testid="input-inventory-name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Kategori</Label>
          <Select value={formData.category} onValueChange={handleCategoryChange}>
            <SelectTrigger data-testid="select-inventory-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVENTORY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Satuan</Label>
          <Select value={formData.unit} onValueChange={v => setFormData(p => ({ ...p, unit: v }))}>
            <SelectTrigger data-testid="select-inventory-unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Stok Awal ({formData.unit})</Label>
        <NumInput value={formData.currentStock} onChange={v => setFormData(p => ({ ...p, currentStock: v }))} testId="input-current-stock" required />
        {initialData?.pricePerUnit ? (
          <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 4 }}>
            Harga terakhir: <strong>{formatRp(initialData.pricePerUnit)}</strong> per {formData.unit} — diperbarui otomatis saat restok
          </p>
        ) : (
          <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 4 }}>
            Harga beli bisa diisi saat melakukan restok stok pertama kali.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Stok Minimum</Label>
          <NumInput value={formData.minStock} onChange={v => setFormData(p => ({ ...p, minStock: v }))} testId="input-min-stock" required />
        </div>
        <div>
          <Label>Stok Maksimum</Label>
          <NumInput value={formData.maxStock} onChange={v => setFormData(p => ({ ...p, maxStock: v }))} testId="input-max-stock" required />
        </div>
      </div>

      <div>
        <Label>Supplier</Label>
        <Input value={formData.supplier || ""}
          onChange={e => setFormData(p => ({ ...p, supplier: e.target.value }))}
          placeholder="Nama supplier..." data-testid="input-supplier" />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full h-11" data-testid="button-save-inventory">
        {isLoading ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
