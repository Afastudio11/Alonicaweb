import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Building, Mail, Phone, MapPin, Clock, Star, AlignLeft } from "lucide-react";
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
  });

  const { data: storeProfile, isLoading } = useQuery<StoreProfile | null>({
    queryKey: ["/api/store-profile"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<InsertStoreProfile>) => {
      // Validate required fields
      if (!data.restaurantName?.trim()) {
        throw new Error('Nama restaurant harus diisi');
      }

      try {
        if (storeProfile?.id) {
          // Update existing profile
          const response = await apiRequest('PUT', `/api/store-profile/${storeProfile.id}`, data);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
          }
          return await response.json();
        } else {
          // Create new profile
          const response = await apiRequest('POST', '/api/store-profile', data);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
          }
          return await response.json();
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error('Terjadi kesalahan saat menyimpan profile');
      }
    },
    onSuccess: (savedProfile) => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-profile'] });
      
      // Update form data with saved profile to ensure consistency
      setFormData({
        restaurantName: savedProfile.restaurantName || "",
        address: savedProfile.address || "",
        phone: savedProfile.phone || "",
        email: savedProfile.email || "",
        description: savedProfile.description || "",
        city: savedProfile.city || "",
        openingHours: savedProfile.openingHours || "",
        rating: savedProfile.rating || "",
        reviewCount: savedProfile.reviewCount || "",
        tagline: savedProfile.tagline || "",
      });
      
      toast({
        title: "Profile berhasil disimpan",
        description: "Informasi toko telah diperbarui dan receipt header ter-update otomatis",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal menyimpan profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update form data when store profile loads
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
      });
    }
  }, [storeProfile]);

  const handleInputChange = (field: keyof InsertStoreProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.restaurantName?.trim()) {
      toast({
        title: "Validasi gagal",
        description: "Nama restaurant harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty strings for optional fields  
    const filteredData = {
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
    };

    updateProfileMutation.mutate(filteredData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="alonica-card p-4 animate-pulse">
          <div className="h-8 bg-muted rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="alonica-card p-4">
        <div className="flex items-center space-x-3">
          <Building className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-settings-title">
              Store Settings
            </h1>
            <p className="text-muted-foreground">
              Kelola informasi toko untuk ditampilkan di receipt
            </p>
          </div>
        </div>
      </div>

      {/* Store Profile Form */}
      <div className="alonica-card p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Restaurant Name */}
            <div className="space-y-2">
              <Label htmlFor="restaurantName" className="flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Nama Restaurant</span>
              </Label>
              <Input
                id="restaurantName"
                value={formData.restaurantName || ""}
                onChange={(e) => handleInputChange("restaurantName", e.target.value)}
                placeholder="Masukkan nama restaurant"
                required
                data-testid="input-restaurant-name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="info@restaurant.com"
                data-testid="input-email"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>Telepon</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="(021) 555-0123"
                data-testid="input-phone"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Alamat</span>
            </Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Jl. Kuliner Rasa No. 123"
              data-testid="input-address"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi Restaurant</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Restaurant dengan cita rasa Indonesia yang autentik"
              rows={3}
              data-testid="input-description"
            />
          </div>

          {/* Divider */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <span style={{ background: "#FF9500", borderRadius: 4, width: 4, height: 16, display: "inline-block" }} />
              Tampilan Halaman Pelanggan
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Informasi yang ditampilkan di chip bar halaman menu pelanggan (jam buka, kota, rating)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Kota / Lokasi</span>
              </Label>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Bantaeng"
                data-testid="input-city"
              />
            </div>

            {/* Opening Hours */}
            <div className="space-y-2">
              <Label htmlFor="openingHours" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Jam Operasional</span>
              </Label>
              <Input
                id="openingHours"
                value={formData.openingHours || ""}
                onChange={(e) => handleInputChange("openingHours", e.target.value)}
                placeholder="08.30 – 23.00"
                data-testid="input-opening-hours"
              />
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label htmlFor="rating" className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Rating</span>
              </Label>
              <Input
                id="rating"
                value={formData.rating || ""}
                onChange={(e) => handleInputChange("rating", e.target.value)}
                placeholder="4.9"
                data-testid="input-rating"
              />
            </div>

            {/* Review Count */}
            <div className="space-y-2">
              <Label htmlFor="reviewCount" className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Jumlah Ulasan</span>
              </Label>
              <Input
                id="reviewCount"
                value={formData.reviewCount || ""}
                onChange={(e) => handleInputChange("reviewCount", e.target.value)}
                placeholder="1.4rb ulasan"
                data-testid="input-review-count"
              />
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <Label htmlFor="tagline" className="flex items-center space-x-2">
              <AlignLeft className="h-4 w-4" />
              <span>Tagline / Kalimat Pembuka</span>
            </Label>
            <Input
              id="tagline"
              value={formData.tagline || ""}
              onChange={(e) => handleInputChange("tagline", e.target.value)}
              placeholder="Minuman & makanan khas Bantaeng yang bikin betah"
              data-testid="input-tagline"
            />
            <p className="text-xs text-muted-foreground">Ditampilkan di slide pertama banner halaman pelanggan</p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex items-center space-x-2"
              data-testid="button-save-profile"
            >
              <Save className="h-4 w-4" />
              <span>
                {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan Profile"}
              </span>
            </Button>
          </div>
        </form>
      </div>

      {/* Preview Receipt Info */}
      <div className="alonica-card p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Preview Receipt Header
        </h2>
        <div className="bg-muted p-6 rounded-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary mb-2" data-testid="preview-restaurant-name">
              {formData.restaurantName || "Nama Restaurant"}
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="preview-address">
              {formData.address || "Alamat restaurant"}
            </p>
            <p className="text-sm text-muted-foreground" data-testid="preview-phone">
              {formData.phone ? `Telp: ${formData.phone}` : "Telp: -"}
            </p>
            {formData.email && (
              <p className="text-sm text-muted-foreground" data-testid="preview-email">
                Email: {formData.email}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          * Informasi ini akan ditampilkan di header receipt customer
        </p>
      </div>
    </div>
  );
}