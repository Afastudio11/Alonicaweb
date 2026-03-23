import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, MapPin, Phone, Clock, ToggleLeft, ToggleRight, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Branch } from "@shared/schema";

type BranchFormData = {
  name: string;
  address: string;
  city: string;
  phone: string;
  openingHours: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_FORM: BranchFormData = {
  name: "",
  address: "",
  city: "",
  phone: "",
  openingHours: "08.30 – 23.00",
  isActive: true,
  sortOrder: 0,
};

function BranchModal({
  branch,
  onClose,
  onSave,
  isSaving,
}: {
  branch: Branch | null;
  onClose: () => void;
  onSave: (data: BranchFormData) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<BranchFormData>(
    branch
      ? {
          name: branch.name,
          address: branch.address ?? "",
          city: branch.city ?? "",
          phone: branch.phone ?? "",
          openingHours: branch.openingHours ?? "08.30 – 23.00",
          isActive: branch.isActive,
          sortOrder: branch.sortOrder ?? 0,
        }
      : EMPTY_FORM
  );

  const set = (field: keyof BranchFormData, value: string | boolean | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480,
        padding: "28px 24px", boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", marginBottom: 20 }}>
          {branch ? "Edit Cabang" : "Tambah Cabang Baru"}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Label htmlFor="name">Nama Cabang *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="Contoh: ngehnoom Pusat"
              data-testid="input-branch-name"
              style={{ marginTop: 6 }}
            />
          </div>
          <div>
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={form.address}
              onChange={e => set("address", e.target.value)}
              placeholder="Jl. Contoh No. 1"
              data-testid="input-branch-address"
              style={{ marginTop: 6 }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label htmlFor="city">Kota</Label>
              <Input
                id="city"
                value={form.city}
                onChange={e => set("city", e.target.value)}
                placeholder="Bantaeng"
                data-testid="input-branch-city"
                style={{ marginTop: 6 }}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="0811-xxxx-xxxx"
                data-testid="input-branch-phone"
                style={{ marginTop: 6 }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label htmlFor="openingHours">Jam Buka</Label>
              <Input
                id="openingHours"
                value={form.openingHours}
                onChange={e => set("openingHours", e.target.value)}
                placeholder="08.30 – 23.00"
                data-testid="input-branch-hours"
                style={{ marginTop: 6 }}
              />
            </div>
            <div>
              <Label htmlFor="sortOrder">Urutan Tampil</Label>
              <Input
                id="sortOrder"
                type="number"
                value={form.sortOrder}
                onChange={e => set("sortOrder", parseInt(e.target.value) || 0)}
                data-testid="input-branch-sort"
                style={{ marginTop: 6 }}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>Status Aktif</p>
              <p style={{ fontSize: 12, color: "#6E6E73" }}>Cabang yang tidak aktif tidak tampil ke pelanggan</p>
            </div>
            <button
              type="button"
              onClick={() => set("isActive", !form.isActive)}
              data-testid="toggle-branch-active"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
            >
              {form.isActive
                ? <ToggleRight size={36} style={{ color: "#FF9500" }} />
                : <ToggleLeft size={36} style={{ color: "#C7C7CC" }} />}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <Button
            variant="outline"
            onClick={onClose}
            style={{ flex: 1 }}
            data-testid="button-cancel-branch"
          >
            Batal
          </Button>
          <Button
            onClick={() => {
              if (!form.name.trim()) return;
              onSave(form);
            }}
            disabled={isSaving || !form.name.trim()}
            style={{ flex: 1, background: "#FF9500", borderColor: "#FF9500" }}
            data-testid="button-save-branch"
          >
            {isSaving ? "Menyimpan..." : branch ? "Simpan Perubahan" : "Tambah Cabang"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BranchesSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ["/api/admin/branches"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: BranchFormData) => {
      const res = await apiRequest("POST", "/api/admin/branches", data);
      if (!res.ok) throw new Error((await res.json()).message || "Gagal membuat cabang");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: "Cabang berhasil ditambahkan" });
      setShowModal(false);
      setEditingBranch(null);
    },
    onError: (e: Error) => toast({ title: "Gagal menambahkan cabang", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BranchFormData> }) => {
      const res = await apiRequest("PATCH", `/api/admin/branches/${id}`, data);
      if (!res.ok) throw new Error((await res.json()).message || "Gagal update cabang");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: "Cabang berhasil diperbarui" });
      setShowModal(false);
      setEditingBranch(null);
    },
    onError: (e: Error) => toast({ title: "Gagal memperbarui cabang", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/branches/${id}`, undefined);
      if (!res.ok) throw new Error((await res.json()).message || "Gagal hapus cabang");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/branches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/branches"] });
      toast({ title: "Cabang dihapus" });
    },
    onError: (e: Error) => toast({ title: "Gagal menghapus cabang", description: e.message, variant: "destructive" }),
  });

  const handleSave = (data: BranchFormData) => {
    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleActive = (branch: Branch) => {
    updateMutation.mutate({ id: branch.id, data: { isActive: !branch.isActive } });
  };

  const handleDelete = (branch: Branch) => {
    if (!confirm(`Hapus cabang "${branch.name}"? Semua data terkait akan terpengaruh.`)) return;
    deleteMutation.mutate(branch.id);
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ background: "#F5F5F7", borderRadius: 16, height: 100, animation: "pulse 1.5s infinite" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#fff", borderRadius: 16, padding: "16px 20px",
        border: "1px solid #F0F0F0",
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F" }} data-testid="text-branches-title">
            Manajemen Cabang
          </h1>
          <p style={{ fontSize: 13, color: "#6E6E73", marginTop: 2 }}>
            {branches.length} cabang terdaftar
          </p>
        </div>
        <Button
          onClick={() => { setEditingBranch(null); setShowModal(true); }}
          data-testid="button-add-branch"
          style={{ background: "#FF9500", borderColor: "#FF9500", gap: 6 }}
        >
          <Plus size={16} />
          Tambah Cabang
        </Button>
      </div>

      {/* Branches list */}
      {branches.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: 16, padding: 40,
          border: "1px solid #F0F0F0", textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "rgba(255,149,0,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <MapPin size={24} style={{ color: "#FF9500" }} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#1D1D1F", marginBottom: 6 }}>
            Belum ada cabang
          </p>
          <p style={{ fontSize: 13, color: "#6E6E73", marginBottom: 20 }}>
            Tambahkan cabang pertama untuk mengaktifkan sistem multi-lokasi
          </p>
          <Button
            onClick={() => { setEditingBranch(null); setShowModal(true); }}
            data-testid="button-add-first-branch"
            style={{ background: "#FF9500", borderColor: "#FF9500" }}
          >
            <Plus size={16} />
            Tambah Cabang Pertama
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {branches.map(branch => (
            <div
              key={branch.id}
              data-testid={`card-branch-${branch.id}`}
              style={{
                background: "#fff", borderRadius: 16, padding: "16px 20px",
                border: `1.5px solid ${branch.isActive ? "#F0F0F0" : "#E5E5EA"}`,
                opacity: branch.isActive ? 1 : 0.7,
                display: "flex", alignItems: "flex-start", gap: 14,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: branch.isActive
                  ? "linear-gradient(135deg, #FFAB00, #FF9500)"
                  : "#E5E5EA",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MapPin size={20} style={{ color: branch.isActive ? "#fff" : "#8E8E93" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#1D1D1F" }} data-testid={`text-branch-name-${branch.id}`}>
                    {branch.name}
                  </p>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                    background: branch.isActive ? "rgba(52,199,89,0.12)" : "rgba(142,142,147,0.15)",
                    color: branch.isActive ? "#34C759" : "#8E8E93",
                  }}>
                    {branch.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", marginTop: 6 }}>
                  {branch.address && (
                    <span style={{ fontSize: 12, color: "#6E6E73", display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={11} />
                      {branch.address}{branch.city ? `, ${branch.city}` : ""}
                    </span>
                  )}
                  {branch.phone && (
                    <span style={{ fontSize: 12, color: "#6E6E73", display: "flex", alignItems: "center", gap: 4 }}>
                      <Phone size={11} />
                      {branch.phone}
                    </span>
                  )}
                  {branch.openingHours && (
                    <span style={{ fontSize: 12, color: "#6E6E73", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} />
                      {branch.openingHours}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "#AEAEB2", display: "flex", alignItems: "center", gap: 4 }}>
                    <ArrowUpDown size={11} />
                    Urutan #{branch.sortOrder ?? 0}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => handleToggleActive(branch)}
                  data-testid={`button-toggle-branch-${branch.id}`}
                  title={branch.isActive ? "Nonaktifkan" : "Aktifkan"}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: "1px solid #E5E5EA",
                    background: "#F5F5F7", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {branch.isActive
                    ? <ToggleRight size={16} style={{ color: "#34C759" }} />
                    : <ToggleLeft size={16} style={{ color: "#8E8E93" }} />}
                </button>
                <button
                  onClick={() => { setEditingBranch(branch); setShowModal(true); }}
                  data-testid={`button-edit-branch-${branch.id}`}
                  title="Edit"
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: "1px solid #E5E5EA",
                    background: "#F5F5F7", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Pencil size={14} style={{ color: "#FF9500" }} />
                </button>
                <button
                  onClick={() => handleDelete(branch)}
                  data-testid={`button-delete-branch-${branch.id}`}
                  title="Hapus"
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: "1px solid #FFE5E5",
                    background: "#FFF5F5", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Trash2 size={14} style={{ color: "#FF3B30" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <BranchModal
          branch={editingBranch}
          onClose={() => { setShowModal(false); setEditingBranch(null); }}
          onSave={handleSave}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
