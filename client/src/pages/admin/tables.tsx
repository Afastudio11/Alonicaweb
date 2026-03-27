import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, LayoutGrid, TreePine, Home, Users, Toggle3D, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Table } from "@shared/schema";

const ROOM_LABELS: Record<string, { label: string; icon: typeof Home; color: string; bg: string }> = {
  indoor: { label: "Indoor", icon: Home, color: "#FF9500", bg: "#FFF5E6" },
  outdoor: { label: "Outdoor", icon: TreePine, color: "#34C759", bg: "#F0FFF4" },
};

const DEFAULT_FORM = {
  number: "",
  name: "",
  capacity: 4,
  room: "indoor" as "indoor" | "outdoor",
  isActive: true,
  sortOrder: 0,
  branchId: null as string | null,
};

type FormState = typeof DEFAULT_FORM;

function TableFormModal({
  open,
  onClose,
  editing,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: Table | null;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(
    editing
      ? {
          number: editing.number,
          name: editing.name || "",
          capacity: editing.capacity,
          room: (editing.room as "indoor" | "outdoor"),
          isActive: editing.isActive,
          sortOrder: editing.sortOrder,
          branchId: editing.branchId || null,
        }
      : { ...DEFAULT_FORM }
  );

  const qc = useQueryClient();
  const saveMutation = useMutation({
    mutationFn: async (data: FormState) => {
      const payload = {
        number: data.number.trim(),
        name: data.name.trim() || null,
        capacity: Number(data.capacity),
        room: data.room,
        isActive: data.isActive,
        sortOrder: Number(data.sortOrder),
        branchId: data.branchId || null,
      };
      if (editing) {
        const res = await apiRequest("PUT", `/api/tables/${editing.id}`, payload);
        if (!res.ok) throw new Error("Gagal memperbarui meja");
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/tables", payload);
        if (!res.ok) throw new Error("Gagal menambahkan meja");
        return res.json();
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({ title: editing ? "Meja diperbarui" : "Meja ditambahkan", description: `Meja ${form.number} berhasil disimpan.` });
      onSaved();
    },
    onError: (err: Error) => toast({ title: "Gagal menyimpan", description: err.message, variant: "destructive" }),
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number.trim()) {
      toast({ title: "Nomor meja harus diisi", variant: "destructive" });
      return;
    }
    saveMutation.mutate(form);
  };

  const inputStyle = (filled?: boolean) => ({
    width: "100%", height: 44, borderRadius: 12, border: "1.5px solid",
    borderColor: filled ? "#FF9500" : "#E5E5EA",
    padding: "0 14px", fontSize: 15, outline: "none",
    background: filled ? "#FFFBF5" : "#F9F9F9",
    color: "#1D1D1F", boxSizing: "border-box" as const,
    fontFamily: "inherit",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 520,
        padding: "24px 20px 36px", animation: "slideUp 0.25s ease-out",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1D1D1F", margin: 0 }}>
            {editing ? "Edit Meja" : "Tambah Meja Baru"}
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "#F5F5F7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color="#6E6E73" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#3C3C43", display: "block", marginBottom: 6 }}>
              Nomor Meja <span style={{ color: "#FF2D55" }}>*</span>
            </label>
            <input
              value={form.number}
              onChange={e => setForm(p => ({ ...p, number: e.target.value }))}
              placeholder="Contoh: 1, A1, VIP-01"
              data-testid="input-table-number"
              style={inputStyle(!!form.number)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#3C3C43", display: "block", marginBottom: 6 }}>
              Nama Meja (Opsional)
            </label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Contoh: Meja Sudut, Meja Teras"
              data-testid="input-table-name"
              style={inputStyle(!!form.name)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#3C3C43", display: "block", marginBottom: 6 }}>
                <Users size={13} style={{ display: "inline", marginRight: 4 }} />
                Kapasitas (Orang)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.capacity}
                onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))}
                data-testid="input-table-capacity"
                style={inputStyle(true)}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#3C3C43", display: "block", marginBottom: 6 }}>
                Urutan Tampil
              </label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                data-testid="input-table-sort"
                style={inputStyle(false)}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#3C3C43", display: "block", marginBottom: 10 }}>
              Ruangan
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(["indoor", "outdoor"] as const).map(r => {
                const meta = ROOM_LABELS[r];
                const Icon = meta.icon;
                const selected = form.room === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, room: r }))}
                    data-testid={`button-room-${r}`}
                    style={{
                      height: 64, borderRadius: 14, border: "2px solid",
                      borderColor: selected ? meta.color : "#E5E5EA",
                      background: selected ? meta.bg : "#F9F9F9",
                      cursor: "pointer", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 4,
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon size={20} color={selected ? meta.color : "#AEAEB2"} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: selected ? meta.color : "#8E8E93" }}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#F5F5F7", borderRadius: 12, marginBottom: 22 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F", margin: 0 }}>Status Aktif</p>
              <p style={{ fontSize: 12, color: "#8E8E93", margin: 0 }}>Meja tersedia untuk pemesanan</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              data-testid="toggle-table-active"
              style={{
                width: 48, height: 28, borderRadius: 14, border: "none",
                background: form.isActive ? "#34C759" : "#E5E5EA",
                cursor: "pointer", position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3,
                left: form.isActive ? "calc(100% - 25px)" : 3,
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          <button
            type="submit"
            disabled={saveMutation.isPending}
            data-testid="button-save-table"
            style={{
              width: "100%", height: 50, borderRadius: 14, border: "none",
              background: saveMutation.isPending ? "#E5E5EA" : "#FF9500",
              color: saveMutation.isPending ? "#8E8E93" : "#fff",
              fontSize: 15, fontWeight: 700, cursor: saveMutation.isPending ? "wait" : "pointer",
            }}
          >
            {saveMutation.isPending ? "Menyimpan..." : (editing ? "Simpan Perubahan" : "Tambah Meja")}
          </button>
        </form>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}

export default function TablesSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [roomFilter, setRoomFilter] = useState<"semua" | "indoor" | "outdoor">("semua");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: allTables = [], isLoading } = useQuery<Table[]>({
    queryKey: ["/api/tables"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/tables/${id}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menghapus meja");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tables"] });
      toast({ title: "Meja dihapus" });
      setDeletingId(null);
    },
    onError: (err: Error) => toast({ title: "Gagal menghapus", description: err.message, variant: "destructive" }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/tables/${id}`, { isActive });
      if (!res.ok) throw new Error("Gagal mengubah status");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/tables"] });
    },
    onError: (err: Error) => toast({ title: "Gagal", description: err.message, variant: "destructive" }),
  });

  const filtered = allTables.filter(t => roomFilter === "semua" || t.room === roomFilter);
  const indoorCount = allTables.filter(t => t.room === "indoor").length;
  const outdoorCount = allTables.filter(t => t.room === "outdoor").length;
  const activeCount = allTables.filter(t => t.isActive).length;

  const openAdd = () => { setEditingTable(null); setModalOpen(true); };
  const openEdit = (t: Table) => { setEditingTable(t); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingTable(null); };

  return (
    <div style={{ padding: "24px 16px", maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1D1D1F", margin: 0 }}>Manajemen Meja</h1>
          <p style={{ fontSize: 13, color: "#8E8E93", marginTop: 2 }}>Kelola meja dan ruangan restoran</p>
        </div>
        <button
          onClick={openAdd}
          data-testid="button-add-table"
          style={{
            height: 40, paddingInline: 18, borderRadius: 12, border: "none",
            background: "#FF9500",
            color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <Plus size={16} />
          Tambah Meja
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total Meja", value: allTables.length, color: "#FF9500", bg: "#FFF5E6" },
          { label: "Indoor", value: indoorCount, color: "#FF9500", bg: "#FFF5E6" },
          { label: "Outdoor", value: outdoorCount, color: "#34C759", bg: "#F0FFF4" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#8E8E93", margin: 0, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, background: "#F5F5F7", borderRadius: 12, padding: 4 }}>
        {([
          { key: "semua", label: "Semua" },
          { key: "indoor", label: "Indoor" },
          { key: "outdoor", label: "Outdoor" },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setRoomFilter(tab.key)}
            data-testid={`filter-${tab.key}`}
            style={{
              flex: 1, height: 36, borderRadius: 9, border: "none",
              background: roomFilter === tab.key ? "#fff" : "transparent",
              color: roomFilter === tab.key ? "#FF9500" : "#6E6E73",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: roomFilter === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table list */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#8E8E93", fontSize: 15 }}>Memuat data meja...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#F5F5F7", borderRadius: 18 }}>
          <LayoutGrid size={36} color="#AEAEB2" style={{ marginBottom: 12 }} />
          <p style={{ color: "#6E6E73", fontSize: 15, fontWeight: 600, margin: 0 }}>Belum ada meja</p>
          <p style={{ color: "#AEAEB2", fontSize: 13, marginTop: 4 }}>Klik "Tambah Meja" untuk mulai</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(table => {
            const roomMeta = ROOM_LABELS[table.room] || ROOM_LABELS.indoor;
            const RoomIcon = roomMeta.icon;
            const isDeleting = deletingId === table.id;
            return (
              <div
                key={table.id}
                data-testid={`card-table-${table.id}`}
                style={{
                  background: "#fff", borderRadius: 16, padding: "16px 18px",
                  border: "1.5px solid", borderColor: table.isActive ? "#F0F0F0" : "#FFE0E0",
                  display: "flex", alignItems: "center", gap: 14,
                  opacity: table.isActive ? 1 : 0.7,
                }}
              >
                {/* Room badge */}
                <div style={{
                  width: 48, height: 48, borderRadius: 13, background: roomMeta.bg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <RoomIcon size={22} color={roomMeta.color} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#1D1D1F" }}>
                      Meja {table.number}
                    </span>
                    {table.name && (
                      <span style={{ fontSize: 12, color: "#8E8E93", fontWeight: 500 }}>— {table.name}</span>
                    )}
                    <span style={{
                      fontSize: 11, fontWeight: 700, paddingInline: 8, paddingBlock: 3,
                      borderRadius: 6, background: roomMeta.bg, color: roomMeta.color,
                    }}>
                      {roomMeta.label}
                    </span>
                    {!table.isActive && (
                      <span style={{ fontSize: 11, fontWeight: 700, paddingInline: 8, paddingBlock: 3, borderRadius: 6, background: "#FFE0E0", color: "#FF3B30" }}>
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: "#8E8E93" }}>
                      <Users size={12} style={{ display: "inline", marginRight: 3 }} />
                      {table.capacity} orang
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {/* Toggle active */}
                  <button
                    onClick={() => toggleActiveMutation.mutate({ id: table.id, isActive: !table.isActive })}
                    data-testid={`toggle-active-${table.id}`}
                    title={table.isActive ? "Nonaktifkan" : "Aktifkan"}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: "none",
                      background: table.isActive ? "#F0FFF4" : "#F5F5F7",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {table.isActive ? <Check size={15} color="#34C759" /> : <X size={15} color="#8E8E93" />}
                  </button>
                  <button
                    onClick={() => openEdit(table)}
                    data-testid={`button-edit-${table.id}`}
                    style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "#FFF5E6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Edit2 size={15} color="#FF9500" />
                  </button>
                  {isDeleting ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={() => deleteMutation.mutate(table.id)}
                        data-testid={`button-confirm-delete-${table.id}`}
                        style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "#FF3B30", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <Check size={15} color="#fff" />
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "#F5F5F7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <X size={15} color="#8E8E93" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(table.id)}
                      data-testid={`button-delete-${table.id}`}
                      style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "#FFF0F0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Trash2 size={15} color="#FF3B30" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TableFormModal
        open={modalOpen}
        onClose={closeModal}
        editing={editingTable}
        onSaved={closeModal}
      />
    </div>
  );
}
