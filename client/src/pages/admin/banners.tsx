import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Banner, InsertBanner } from "@shared/schema";

const GRADIENT_PRESETS = [
  { label: "Orange → Pink", value: "linear-gradient(135deg, #FFAB00 0%, #FF9500 55%, #FF2D55 100%)" },
  { label: "Orange → Red", value: "linear-gradient(135deg, #FF9500 0%, #FF6B35 50%, #FF2D55 100%)" },
  { label: "Pink → Orange", value: "linear-gradient(135deg, #FF2D55 0%, #FF6B35 55%, #FFAB00 100%)" },
  { label: "Deep Orange", value: "linear-gradient(135deg, #E8880F 0%, #FF6B00 100%)" },
  { label: "Sunset", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #fd6f3b 100%)" },
  { label: "Custom…", value: "custom" },
];

const emptyForm: Partial<InsertBanner> = {
  title: "",
  subtitle: "",
  tag: "",
  ctaText: "Pesan Sekarang",
  gradient: GRADIENT_PRESETS[0].value,
  isActive: true,
  sortOrder: 0,
};

export default function BannersSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<Partial<InsertBanner>>(emptyForm);
  const [customGradient, setCustomGradient] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(GRADIENT_PRESETS[0].value);

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ["/api/banners/all"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertBanner>) => {
      const res = await apiRequest("POST", "/api/banners", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners/all"] });
      toast({ title: "Banner berhasil ditambahkan" });
      handleClose();
    },
    onError: () => toast({ title: "Gagal menambahkan banner", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertBanner> }) => {
      const res = await apiRequest("PUT", `/api/banners/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners/all"] });
      toast({ title: "Banner berhasil diperbarui" });
      handleClose();
    },
    onError: () => toast({ title: "Gagal memperbarui banner", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/banners/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners/all"] });
      toast({ title: "Banner dihapus" });
    },
    onError: () => toast({ title: "Gagal menghapus banner", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PUT", `/api/banners/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners/all"] });
    },
  });

  const handleClose = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setSelectedPreset(GRADIENT_PRESETS[0].value);
    setCustomGradient("");
  };

  const handleEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      tag: banner.tag ?? "",
      ctaText: banner.ctaText,
      gradient: banner.gradient,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
    });
    const preset = GRADIENT_PRESETS.find(p => p.value === banner.gradient);
    if (preset) {
      setSelectedPreset(banner.gradient);
    } else {
      setSelectedPreset("custom");
      setCustomGradient(banner.gradient);
    }
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title?.trim()) {
      toast({ title: "Judul banner wajib diisi", variant: "destructive" }); return;
    }
    const gradient = selectedPreset === "custom" ? customGradient : selectedPreset;
    const payload = { ...form, gradient };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const activeGradient = selectedPreset === "custom" ? customGradient : selectedPreset;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Banner Halaman Depan</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola banner yang tampil di carousel hero pelanggan
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#FF9500" }}
          data-testid="button-add-banner"
        >
          <Plus size={16} />
          Tambah Banner
        </button>
      </div>

      {/* Banner List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">🖼️</div>
          <p className="font-semibold text-foreground">Belum ada banner</p>
          <p className="text-sm text-muted-foreground mt-1">Tambahkan banner untuk ditampilkan di halaman depan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border flex"
              data-testid={`banner-item-${banner.id}`}
            >
              {/* Gradient Preview */}
              <div
                className="w-24 flex-shrink-0 flex items-center justify-center p-3 text-center"
                style={{ background: banner.gradient }}
              >
                <div>
                  <p className="text-white text-[10px] font-bold leading-tight line-clamp-2">{banner.title}</p>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 px-4 py-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-foreground truncate">{banner.title}</p>
                      {banner.tag && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{ background: "rgba(255,149,0,0.1)", color: "#FF9500" }}>
                          {banner.tag}
                        </span>
                      )}
                    </div>
                    {banner.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{banner.subtitle}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: "#AEAEB2" }}>
                      CTA: "{banner.ctaText}" · Urutan: {banner.sortOrder}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate({ id: banner.id, isActive: !banner.isActive })}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                      style={{ background: banner.isActive ? "rgba(48,209,88,0.1)" : "rgba(0,0,0,0.04)" }}
                      title={banner.isActive ? "Aktif – klik untuk nonaktifkan" : "Nonaktif – klik untuk aktifkan"}
                      data-testid={`button-toggle-${banner.id}`}
                    >
                      {banner.isActive
                        ? <Eye size={15} style={{ color: "#30D158" }} />
                        : <EyeOff size={15} style={{ color: "#AEAEB2" }} />}
                    </button>
                    <button
                      onClick={() => handleEdit(banner)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,149,0,0.08)" }}
                      data-testid={`button-edit-${banner.id}`}
                    >
                      <Edit2 size={14} style={{ color: "#FF9500" }} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus banner "${banner.title}"?`)) deleteMutation.mutate(banner.id);
                      }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,59,48,0.07)" }}
                      data-testid={`button-delete-${banner.id}`}
                    >
                      <Trash2 size={14} style={{ color: "#FF3B30" }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={handleClose}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Preview */}
            <div
              className="h-32 flex items-center px-6 relative overflow-hidden"
              style={{ background: activeGradient || "#FF9500" }}
            >
              <div
                style={{
                  position: "absolute", top: -30, right: -30,
                  width: 120, height: 120, borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)"
                }}
              />
              <div>
                {form.tag && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1"
                    style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>
                    {form.tag}
                  </span>
                )}
                <p className="text-white font-extrabold text-xl leading-tight">{form.title || "Judul Banner"}</p>
                {form.subtitle && <p className="text-white/80 text-xs mt-0.5">{form.subtitle}</p>}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <h3 className="font-bold text-base" style={{ color: "#1D1D1F" }}>
                {editing ? "Edit Banner" : "Tambah Banner Baru"}
              </h3>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Judul *</label>
                <input
                  type="text"
                  placeholder="Contoh: Yang Nyaman Jadi Sayang"
                  value={form.title || ""}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 h-11 rounded-2xl text-sm outline-none"
                  style={{ background: "#F5F5F7" }}
                  data-testid="input-banner-title"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subjudul</label>
                <input
                  type="text"
                  placeholder="Contoh: Minuman segar khas Bantaeng"
                  value={form.subtitle || ""}
                  onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  className="w-full px-4 h-11 rounded-2xl text-sm outline-none"
                  style={{ background: "#F5F5F7" }}
                  data-testid="input-banner-subtitle"
                />
              </div>

              {/* Tag & CTA in a row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Badge Label</label>
                  <input
                    type="text"
                    placeholder="Contoh: Promo Spesial"
                    value={form.tag || ""}
                    onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                    className="w-full px-4 h-11 rounded-2xl text-sm outline-none"
                    style={{ background: "#F5F5F7" }}
                    data-testid="input-banner-tag"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Teks Tombol</label>
                  <input
                    type="text"
                    placeholder="Pesan Sekarang"
                    value={form.ctaText || ""}
                    onChange={e => setForm(f => ({ ...f, ctaText: e.target.value }))}
                    className="w-full px-4 h-11 rounded-2xl text-sm outline-none"
                    style={{ background: "#F5F5F7" }}
                    data-testid="input-banner-cta"
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Urutan Tampil (angka kecil = lebih awal)</label>
                <input
                  type="number"
                  min={0}
                  value={form.sortOrder ?? 0}
                  onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 h-11 rounded-2xl text-sm outline-none"
                  style={{ background: "#F5F5F7" }}
                  data-testid="input-banner-order"
                />
              </div>

              {/* Gradient */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Warna Latar</label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setSelectedPreset(p.value)}
                      className="h-12 rounded-xl border-2 transition-all"
                      style={{
                        background: p.value === "custom" ? "#F5F5F7" : p.value,
                        borderColor: selectedPreset === p.value ? "#1D1D1F" : "transparent",
                      }}
                      title={p.label}
                      data-testid={`button-gradient-${p.value === "custom" ? "custom" : p.label}`}
                    >
                      {p.value === "custom" && (
                        <span className="text-xs font-semibold" style={{ color: "#6E6E73" }}>Custom</span>
                      )}
                    </button>
                  ))}
                </div>
                {selectedPreset === "custom" && (
                  <input
                    type="text"
                    placeholder="linear-gradient(135deg, #FF9500 0%, #FF2D55 100%)"
                    value={customGradient}
                    onChange={e => setCustomGradient(e.target.value)}
                    className="mt-2 w-full px-4 h-11 rounded-2xl text-sm outline-none font-mono"
                    style={{ background: "#F5F5F7" }}
                    data-testid="input-banner-gradient"
                  />
                )}
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#1D1D1F" }}>Tampilkan Banner</p>
                  <p className="text-xs" style={{ color: "#6E6E73" }}>Banner akan muncul di halaman depan</p>
                </div>
                <button
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className="w-12 h-7 rounded-full transition-all relative"
                  style={{ background: form.isActive ? "#FF9500" : "#E5E5EA" }}
                  data-testid="toggle-banner-active"
                >
                  <div
                    className="w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow"
                    style={{ left: form.isActive ? "calc(100% - 24px)" : "4px" }}
                  />
                </button>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2 pb-4">
                <button
                  onClick={handleClose}
                  className="flex-1 h-12 rounded-2xl font-semibold text-sm"
                  style={{ background: "#F5F5F7", color: "#1D1D1F" }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="flex-1 h-12 rounded-2xl font-bold text-sm text-white disabled:opacity-50"
                  style={{ background: "#FF9500" }}
                  data-testid="button-save-banner"
                >
                  {isPending ? "Menyimpan…" : editing ? "Simpan Perubahan" : "Tambah Banner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
