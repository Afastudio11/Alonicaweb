import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save, Building, Mail, Phone, MapPin, Clock, Star, AlignLeft,
  ToggleLeft, ToggleRight, GitBranch, Wifi, Receipt, User, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { StoreProfile, InsertStoreProfile } from "@shared/schema";

export default function SettingsSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<InsertStoreProfile>>({
    restaurantName: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    city: "",
    openingHours: "",
    rating: "",
    reviewCount: "",
    tagline: "",
    multiBranchEnabled: false,
    wifiName: "",
    wifiPassword: "",
    customReceiptHeader: "",
    customReceiptFooter: "",
    showCashierName: true,
  });

  const { data: storeProfile, isLoading } = useQuery<StoreProfile>({
    queryKey: ["/api/store-profile"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<InsertStoreProfile>) => {
      if (!data.restaurantName?.trim()) {
        throw new Error("Nama restaurant harus diisi");
      }
      if (storeProfile?.id) {
        const response = await apiRequest("PUT", `/api/store-profile/${storeProfile.id}`, data);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        return await response.json();
      } else {
        const response = await apiRequest("POST", "/api/store-profile", data);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        return await response.json();
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-profile"] });
      setFormData({
        restaurantName: saved.restaurantName || "",
        address: saved.address || "",
        phone: saved.phone || "",
        email: saved.email || "",
        description: saved.description || "",
        city: saved.city || "",
        openingHours: saved.openingHours || "",
        rating: saved.rating || "",
        reviewCount: saved.reviewCount || "",
        tagline: saved.tagline || "",
        multiBranchEnabled: saved.multiBranchEnabled ?? false,
        wifiName: saved.wifiName || "",
        wifiPassword: saved.wifiPassword || "",
        customReceiptHeader: saved.customReceiptHeader || "",
        customReceiptFooter: saved.customReceiptFooter || "",
        showCashierName: saved.showCashierName ?? true,
      });
      toast({ title: "Pengaturan berhasil disimpan", description: "Semua perubahan sudah tersinkron." });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal menyimpan", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (storeProfile) {
      setFormData({
        restaurantName: storeProfile.restaurantName || "",
        address: storeProfile.address || "",
        phone: storeProfile.phone || "",
        email: storeProfile.email || "",
        description: storeProfile.description || "",
        city: storeProfile.city || "",
        openingHours: storeProfile.openingHours || "",
        rating: storeProfile.rating || "",
        reviewCount: storeProfile.reviewCount || "",
        tagline: storeProfile.tagline || "",
        multiBranchEnabled: storeProfile.multiBranchEnabled ?? false,
        wifiName: (storeProfile as any).wifiName || "",
        wifiPassword: (storeProfile as any).wifiPassword || "",
        customReceiptHeader: (storeProfile as any).customReceiptHeader || "",
        customReceiptFooter: (storeProfile as any).customReceiptFooter || "",
        showCashierName: (storeProfile as any).showCashierName ?? true,
      });
    }
  }, [storeProfile]);

  const handleInput = (field: keyof InsertStoreProfile, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.restaurantName?.trim()) {
      toast({ title: "Validasi gagal", description: "Nama restaurant harus diisi", variant: "destructive" });
      return;
    }
    updateProfileMutation.mutate({
      restaurantName: formData.restaurantName.trim(),
      address: formData.address?.trim() || "",
      phone: formData.phone?.trim() || "",
      email: formData.email?.trim() || "",
      description: formData.description?.trim() || "",
      city: formData.city?.trim() || "",
      openingHours: formData.openingHours?.trim() || "",
      rating: formData.rating?.trim() || "",
      reviewCount: formData.reviewCount?.trim() || "",
      tagline: formData.tagline?.trim() || "",
      multiBranchEnabled: formData.multiBranchEnabled ?? false,
      wifiName: (formData as any).wifiName?.trim() || "",
      wifiPassword: (formData as any).wifiPassword?.trim() || "",
      customReceiptHeader: (formData as any).customReceiptHeader?.trim() || "",
      customReceiptFooter: (formData as any).customReceiptFooter?.trim() || "",
      showCashierName: (formData as any).showCashierName ?? true,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="alonica-card p-4 animate-pulse">
          <div className="h-8 bg-muted rounded mb-6" />
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const SectionDivider = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
    <div className="border-t pt-5 mt-2">
      <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
        <span style={{ background: "#8B1538", borderRadius: 4, width: 4, height: 16, display: "inline-block" }} />
        <Icon size={15} className="text-primary" />
        {title}
      </p>
      <p className="text-xs text-muted-foreground mb-4">{desc}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="alonica-card p-4">
        <div className="flex items-center space-x-3">
          <Building className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-settings-title">Pengaturan Toko</h1>
            <p className="text-muted-foreground text-sm">Semua perubahan langsung tersinkron ke struk, halaman pelanggan, dan dapur</p>
          </div>
        </div>
      </div>

      <div className="alonica-card p-4">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── INFORMASI DASAR ── */}
          <SectionDivider icon={Building} title="Informasi Toko" desc="Ditampilkan di header struk dan profil toko" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="restaurantName" className="flex items-center gap-2"><Building size={14} /><span>Nama Toko / Cafe</span></Label>
              <Input id="restaurantName" value={formData.restaurantName || ""} onChange={(e) => handleInput("restaurantName", e.target.value)} placeholder="Alonica Cafe" required data-testid="input-restaurant-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2"><Phone size={14} /><span>Telepon</span></Label>
              <Input id="phone" value={formData.phone || ""} onChange={(e) => handleInput("phone", e.target.value)} placeholder="0515-0000" data-testid="input-phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2"><Mail size={14} /><span>Email</span></Label>
              <Input id="email" type="email" value={formData.email || ""} onChange={(e) => handleInput("email", e.target.value)} placeholder="info@alonica.com" data-testid="input-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-2"><MapPin size={14} /><span>Kota / Lokasi</span></Label>
              <Input id="city" value={formData.city || ""} onChange={(e) => handleInput("city", e.target.value)} placeholder="Bantaeng" data-testid="input-city" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2"><MapPin size={14} /><span>Alamat Lengkap</span></Label>
            <Input id="address" value={formData.address || ""} onChange={(e) => handleInput("address", e.target.value)} placeholder="Jl. Kuliner Rasa No. 123, Bantaeng" data-testid="input-address" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" value={formData.description || ""} onChange={(e) => handleInput("description", e.target.value)} placeholder="Yang Nyaman Jadi Sayang" rows={2} data-testid="input-description" />
          </div>

          {/* ── HALAMAN PELANGGAN ── */}
          <SectionDivider icon={Star} title="Tampilan Halaman Pelanggan" desc="Ditampilkan di chip bar halaman menu pelanggan" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="openingHours" className="flex items-center gap-2"><Clock size={14} /><span>Jam Operasional</span></Label>
              <Input id="openingHours" value={formData.openingHours || ""} onChange={(e) => handleInput("openingHours", e.target.value)} placeholder="08.30 – 23.00" data-testid="input-opening-hours" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating" className="flex items-center gap-2"><Star size={14} /><span>Rating</span></Label>
              <Input id="rating" value={formData.rating || ""} onChange={(e) => handleInput("rating", e.target.value)} placeholder="4.9" data-testid="input-rating" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewCount">Jumlah Ulasan</Label>
              <Input id="reviewCount" value={formData.reviewCount || ""} onChange={(e) => handleInput("reviewCount", e.target.value)} placeholder="1.4rb ulasan" data-testid="input-review-count" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagline" className="flex items-center gap-2"><AlignLeft size={14} /><span>Tagline</span></Label>
            <Input id="tagline" value={formData.tagline || ""} onChange={(e) => handleInput("tagline", e.target.value)} placeholder="Yang Nyaman Jadi Sayang" data-testid="input-tagline" />
            <p className="text-xs text-muted-foreground">Ditampilkan di banner pertama halaman pelanggan</p>
          </div>

          {/* ── STRUK / RECEIPT ── */}
          <SectionDivider icon={Receipt} title="Pengaturan Struk" desc="Informasi tambahan yang muncul di struk pembayaran" />

          {/* Tampilkan Nama Kasir Toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#F9F9F9", borderRadius: 10, border: "1.5px solid #E5E5EA" }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 9, background: (formData as any).showCashierName ? "rgba(139,21,56,0.12)" : "#EFEFEF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={17} style={{ color: (formData as any).showCashierName ? "#8B1538" : "#8E8E93" }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>Tampilkan Nama Kasir di Struk</p>
                <p style={{ fontSize: 12, color: "#6E6E73" }}>Nama kasir yang sedang bertugas akan tercantum di struk</p>
              </div>
            </div>
            <button type="button" onClick={() => setFormData(p => ({ ...p, showCashierName: !(p as any).showCashierName }))} data-testid="toggle-show-cashier" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {(formData as any).showCashierName ? <ToggleRight size={36} style={{ color: "#8B1538" }} /> : <ToggleLeft size={36} style={{ color: "#C7C7CC" }} />}
            </button>
          </div>

          {/* WiFi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="wifiName" className="flex items-center gap-2"><Wifi size={14} /><span>Nama WiFi (SSID)</span></Label>
              <Input id="wifiName" value={(formData as any).wifiName || ""} onChange={(e) => setFormData(p => ({ ...p, wifiName: e.target.value }))} placeholder="Alonica_WiFi" data-testid="input-wifi-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifiPassword" className="flex items-center gap-2"><Wifi size={14} /><span>Password WiFi</span></Label>
              <Input id="wifiPassword" value={(formData as any).wifiPassword || ""} onChange={(e) => setFormData(p => ({ ...p, wifiPassword: e.target.value }))} placeholder="password123" data-testid="input-wifi-password" />
            </div>
          </div>

          {/* Custom receipt text */}
          <div className="space-y-2">
            <Label htmlFor="customReceiptHeader" className="flex items-center gap-2"><FileText size={14} /><span>Teks Pembuka Struk</span></Label>
            <Input id="customReceiptHeader" value={(formData as any).customReceiptHeader || ""} onChange={(e) => setFormData(p => ({ ...p, customReceiptHeader: e.target.value }))} placeholder='Contoh: "Selamat menikmati pesanan Anda!"' data-testid="input-receipt-header" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customReceiptFooter" className="flex items-center gap-2"><FileText size={14} /><span>Pesan Penutup Struk</span></Label>
            <Textarea id="customReceiptFooter" value={(formData as any).customReceiptFooter || ""} onChange={(e) => setFormData(p => ({ ...p, customReceiptFooter: e.target.value }))} placeholder='Contoh: "Terima kasih telah berkunjung! Sampai jumpa lagi."' rows={2} data-testid="input-receipt-footer" />
          </div>

          {/* ── MULTI-CABANG ── */}
          <SectionDivider icon={GitBranch} title="Sistem Multi-Cabang" desc="Aktifkan untuk menampilkan pilihan cabang kepada pelanggan" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#F9F9F9", borderRadius: 12, border: "1.5px solid #E5E5EA" }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 38, height: 38, borderRadius: 10, background: formData.multiBranchEnabled ? "rgba(139,21,56,0.12)" : "#EFEFEF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GitBranch size={18} style={{ color: formData.multiBranchEnabled ? "#8B1538" : "#8E8E93" }} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1D1D1F" }}>Mode Multi-Cabang</p>
                <p style={{ fontSize: 12, color: "#6E6E73" }}>{formData.multiBranchEnabled ? "Pelanggan akan memilih cabang sebelum memesan" : "Semua pesanan masuk ke satu lokasi"}</p>
              </div>
            </div>
            <button type="button" onClick={() => setFormData(p => ({ ...p, multiBranchEnabled: !p.multiBranchEnabled }))} data-testid="toggle-multi-branch" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              {formData.multiBranchEnabled ? <ToggleRight size={38} style={{ color: "#8B1538" }} /> : <ToggleLeft size={38} style={{ color: "#C7C7CC" }} />}
            </button>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={updateProfileMutation.isPending} className="flex items-center gap-2" data-testid="button-save-profile">
              <Save className="h-4 w-4" />
              <span>{updateProfileMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Preview Struk */}
      <div className="alonica-card p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Receipt size={18} className="text-primary" />Preview Struk</h2>
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-5 max-w-xs mx-auto font-mono text-xs text-center space-y-1">
          {(formData as any).customReceiptHeader && <p className="text-gray-600 italic">{(formData as any).customReceiptHeader}</p>}
          <p className="font-bold text-base">{formData.restaurantName || "Nama Toko"}</p>
          <p className="text-gray-500">{formData.address || "Alamat"}</p>
          <p className="text-gray-500">{formData.phone ? `Telp: ${formData.phone}` : ""}</p>
          <div className="border-t border-dashed my-2" />
          <div className="text-left space-y-0.5">
            <div className="flex justify-between"><span>Tanggal:</span><span>24/03/2026 21:00</span></div>
            <div className="flex justify-between"><span>Pelanggan:</span><span>Budi</span></div>
            <div className="flex justify-between"><span>Meja:</span><span>T-01</span></div>
            {(formData as any).showCashierName && <div className="flex justify-between"><span>Kasir:</span><span>Admin</span></div>}
          </div>
          <div className="border-t border-dashed my-2" />
          <div className="text-left space-y-0.5">
            <div className="flex justify-between"><span>Es Kopi Susu x1</span><span>Rp25.000</span></div>
            <div className="flex justify-between"><span>Pisang Goreng x2</span><span>Rp18.000</span></div>
          </div>
          <div className="border-t border-dashed my-2" />
          <div className="flex justify-between font-bold"><span>TOTAL</span><span>Rp43.000</span></div>
          {((formData as any).wifiName || (formData as any).wifiPassword) && (
            <>
              <div className="border-t border-dashed my-2" />
              <p className="text-gray-600 flex items-center gap-1"><Wifi size={12} /> WiFi: {(formData as any).wifiName || "—"}</p>
              <p className="text-gray-600">Password: {(formData as any).wifiPassword || "—"}</p>
            </>
          )}
          {(formData as any).customReceiptFooter && (
            <>
              <div className="border-t border-dashed my-2" />
              <p className="text-gray-500 italic">{(formData as any).customReceiptFooter}</p>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">Preview struk berdasarkan pengaturan saat ini</p>
      </div>
    </div>
  );
}
