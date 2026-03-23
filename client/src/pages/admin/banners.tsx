import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Banner, InsertBanner } from "@shared/schema";

async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 500,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

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
  imageUrl: "",
  isActive: true,
  sortOrder: 0,
};

export default function BannersSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<Partial<InsertBanner>>(emptyForm);
  const [customGradient, setCustomGradient] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(GRADIENT_PRESETS[0].value);
  const [isUploading, setIsUploading] = useState(false);
  const [imageMode, setImageMode] = useState<"gradient" | "image">("gradient");

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
    setImageMode("gradient");
  };

  const handleEdit = (banner: Banner) => {
    setEditing(banner);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      tag: banner.tag ?? "",
      ctaText: banner.ctaText,
      gradient: banner.gradient,
      imageUrl: banner.imageUrl ?? "",
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
    setImageMode(banner.imageUrl ? "image" : "gradient");
    setShowForm(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "File tidak valid", description: "Hanya file gambar yang diperbolehkan", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File terlalu besar", description: "Ukuran maksimal file adalah 20MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const originalKB = Math.round(file.size / 1024);
      const compressed = await compressImage(file, 1200, 500, 0.82);
      const compressedKB = Math.round(compressed.size / 1024);

      const formData = new FormData();
      formData.append("file", compressed);

      const response = await fetch("/api/objects/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("alonica-token")}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      const imageUrl = data.path || data.uploadURL;
      if (!imageUrl) throw new Error("Server tidak mengembalikan URL gambar");

      setForm(f => ({ ...f, imageUrl }));
      setImageMode("image");
      toast({
        title: "Gambar berhasil diupload",
        description: `${originalKB}KB → ${compressedKB}KB (hemat ${Math.round((1 - compressedKB / originalKB) * 100)}%)`,
      });
    } catch (error) {
      toast({
        title: "Upload gagal",
        description: error instanceof Error ? error.message : "Silakan coba lagi",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = () => {
    if (!form.title?.trim()) {
      toast({ title: "Judul banner wajib diisi", variant: "destructive" }); return;
    }
    const gradient = selectedPreset === "custom" ? customGradient : selectedPreset;
    const payload = {
      ...form,
      gradient,
      imageUrl: imageMode === "image" ? (form.imageUrl || "") : "",
    };
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
          <ImageIcon size={48} className="mx-auto mb-3 text-muted-foreground" />
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
              {/* Preview thumbnail */}
              <div
                className="w-24 flex-shrink-0 flex items-center justify-center p-3 text-center relative overflow-hidden"
                style={{ background: banner.imageUrl ? undefined : banner.gradient }}
              >
                {banner.imageUrl ? (
                  <img src={banner.imageUrl} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <p className="text-white text-[10px] font-bold leading-tight line-clamp-2 relative z-10">{banner.title}</p>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 px-4 py-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-foreground truncate">{banner.title}</p>
                      {banner.imageUrl && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{ background: "rgba(0,122,255,0.1)", color: "#007AFF" }}>
                          Gambar
                        </span>
                      )}
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
            className="w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl overflow-y-auto max-h-[92vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Live Preview */}
            <div
              className="h-36 flex items-center px-6 relative overflow-hidden"
              style={{
                background: imageMode === "image" && form.imageUrl ? undefined : (activeGradient || "#FF9500"),
              }}
            >
              {imageMode === "image" && form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="relative z-10">
                {imageMode !== "image" && form.tag && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1"
                    style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}>
                    {form.tag}
                  </span>
                )}
                {imageMode !== "image" && (
                  <p className="text-white font-extrabold text-xl leading-tight drop-shadow">
                    {form.title || "Judul Banner"}
                  </p>
                )}
                {imageMode !== "image" && form.subtitle && (
                  <p className="text-white/80 text-xs mt-0.5">{form.subtitle}</p>
                )}
              </div>
              {/* Decorative blob */}
              {imageMode !== "image" && (
                <div
                  style={{
                    position: "absolute", top: -30, right: -30,
                    width: 120, height: 120, borderRadius: "50%",
                    background: "rgba(255,255,255,0.12)"
                  }}
                />
              )}
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

              {/* Latar Banner — toggle mode */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Latar Banner</label>

                {/* Mode toggle */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setImageMode("gradient")}
                    className="flex-1 h-9 rounded-full text-sm font-medium transition-all"
                    style={imageMode === "gradient"
                      ? { background: "#FF9500", color: "#fff", border: "none" }
                      : { background: "#fff", color: "#1D1D1F", border: "1.5px solid #E5E5EA" }}
                  >
                    Warna Gradien
                  </button>
                  <button
                    onClick={() => setImageMode("image")}
                    className="flex-1 h-9 rounded-full text-sm font-medium transition-all"
                    style={imageMode === "image"
                      ? { background: "#FF9500", color: "#fff", border: "none" }
                      : { background: "#fff", color: "#1D1D1F", border: "1.5px solid #E5E5EA" }}
                  >
                    Upload Gambar
                  </button>
                </div>

                {imageMode === "gradient" ? (
                  <>
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
                  </>
                ) : (
                  <div>
                    {/* Image info */}
                    <div className="mb-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(0,122,255,0.06)" }}>
                      <p className="text-xs font-semibold" style={{ color: "#007AFF" }}>Rekomendasi ukuran gambar</p>
                      <p className="text-xs mt-0.5" style={{ color: "#3A3A3C" }}>
                        <strong>1200 × 500 px</strong> (rasio 2.4:1) · Format JPG atau PNG
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#6E6E73" }}>
                        Otomatis dikompres · Maks. 20 MB · Gambar menyesuaikan area banner
                      </p>
                    </div>

                    {/* Upload area */}
                    {form.imageUrl ? (
                      <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: "2.4/1" }}>
                        <img
                          src={form.imageUrl}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => { setForm(f => ({ ...f, imageUrl: "" })); setImageMode("gradient"); }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow"
                          style={{ background: "rgba(0,0,0,0.5)" }}
                        >
                          <X size={14} className="text-white" />
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold text-white shadow"
                          style={{ background: "rgba(0,0,0,0.5)" }}
                        >
                          <Upload size={12} />
                          Ganti Gambar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 transition-all"
                        style={{
                          aspectRatio: "2.4/1",
                          background: "#F5F5F7",
                          border: "2px dashed #D1D1D6",
                        }}
                        data-testid="button-upload-banner-image"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium" style={{ color: "#6E6E73" }}>Mengupload…</span>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,149,0,0.1)" }}>
                              <Upload size={22} style={{ color: "#FF9500" }} />
                            </div>
                            <span className="text-sm font-semibold" style={{ color: "#1D1D1F" }}>Pilih Gambar</span>
                            <span className="text-xs" style={{ color: "#6E6E73" }}>JPG, PNG · dikompres otomatis</span>
                          </>
                        )}
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      data-testid="input-banner-image-file"
                    />
                  </div>
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
