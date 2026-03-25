import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Copy, Trash2, Upload, Package, FlaskConical, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem, InsertMenuItem, Category, InventoryItem, MenuItemIngredient } from "@shared/schema";

export default function MenuSection() {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const isLoading = menuLoading || categoriesLoading;

  // Create dynamic filter options
  const MENU_CATEGORY_FILTERS = [
    { value: 'all', label: 'Semua' },
    ...categories.map(category => ({
      value: category.id,
      label: category.name
    }))
  ];

  const createItemMutation = useMutation({
    mutationFn: async (item: InsertMenuItem) => {
      const response = await apiRequest('POST', '/api/menu', item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu'] });
      setShowAddDialog(false);
      toast({
        title: "Item berhasil ditambahkan",
        description: "Menu item baru telah dibuat",
      });
    },
    onError: () => {
      toast({
        title: "Gagal menambahkan item",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, item }: { id: string; item: Partial<InsertMenuItem> }) => {
      const response = await apiRequest('PUT', `/api/menu/${id}`, item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu'] });
      setEditingItem(null);
      toast({
        title: "Item berhasil diupdate",
        description: "Menu item telah diperbarui",
      });
    },
    onError: () => {
      toast({
        title: "Gagal update item",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/menu/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu'] });
      toast({
        title: "Item berhasil dihapus",
        description: "Menu item telah dihapus",
      });
    },
    onError: () => {
      toast({
        title: "Gagal menghapus item",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    }
  });

  const filteredItems = menuItems.filter(item => 
    categoryFilter === 'all' || item.categoryId === categoryFilter
  );

  // Helper function to get category name from categoryId
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Kategori Tidak Diketahui';
  };

  const handleToggleAvailability = (item: MenuItem) => {
    updateItemMutation.mutate({
      id: item.id,
      item: { isAvailable: !item.isAvailable }
    });
  };

  const handleDuplicate = (item: MenuItem) => {
    const duplicateItem: InsertMenuItem = {
      name: `${item.name} (Salinan)`,
      price: item.price,
      categoryId: item.categoryId,
      description: item.description,
      image: item.image,
      isAvailable: item.isAvailable,
      stock: item.stock ?? null,
    };
    createItemMutation.mutate(duplicateItem);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="alonica-card p-4 animate-pulse">
              <div className="h-32 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="page-title">Manajemen Menu</h2>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" data-testid="button-add-menu-item">
              <Plus className="h-4 w-4" />
              Tambah Item Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Item Menu Baru</DialogTitle>
              <DialogDescription>
                Tambah menu item baru dengan detail dan kategori.
              </DialogDescription>
            </DialogHeader>
            <MenuItemForm
              onSubmit={(item) => createItemMutation.mutate(item)}
              isLoading={createItemMutation.isPending}
              categories={categories}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {MENU_CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setCategoryFilter(filter.value)}
            className="h-11 px-4 rounded-full text-sm font-medium transition-all"
            style={categoryFilter === filter.value
              ? { background: "#FF9500", color: "#fff", border: "none" }
              : { background: "#fff", color: "#1D1D1F", border: "1.5px solid #E5E5EA" }
            }
            data-testid={`button-filter-${filter.value}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="alonica-card overflow-hidden" data-testid={`card-menu-item-${item.id}`}>
            <div className="flex">
              <img
                src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
                alt={item.name}
                className="w-32 h-32 object-cover"
                data-testid={`img-menu-item-${item.id}`}
              />
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2" data-testid={`text-menu-name-${item.id}`}>
                      {item.name.length > 50 ? `${item.name.substring(0, 50)}...` : item.name}
                    </h3>
                    <Badge 
                      variant="secondary" 
                      className="mt-1"
                      data-testid={`badge-category-${item.id}`}
                    >
                      {getCategoryName(item.categoryId)}
                    </Badge>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2" data-testid={`text-description-${item.id}`}>
                        {item.description.length > 80 ? `${item.description.substring(0, 80)}...` : item.description}
                      </p>
                    )}
                    <p className="text-lg font-bold text-primary mt-2" data-testid={`text-menu-price-${item.id}`}>
                      {formatCurrency(item.price)}
                    </p>
                    {item.stock !== null && item.stock !== undefined && (
                      <div className="flex items-center gap-1 mt-1">
                        <Package size={11} style={{ color: item.stock === 0 ? "#FF2D55" : item.stock <= 5 ? "#FFAB00" : "#34C759" }} />
                        <span className="text-xs font-medium" style={{ color: item.stock === 0 ? "#FF2D55" : item.stock <= 5 ? "#FFAB00" : "#34C759" }} data-testid={`text-stock-${item.id}`}>
                          {item.stock === 0 ? "Habis" : `Stok: ${item.stock}`}
                        </span>
                      </div>
                    )}
                  </div>
                  <Switch
                    checked={item.isAvailable}
                    onCheckedChange={() => handleToggleAvailability(item)}
                    data-testid={`switch-availability-${item.id}`}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditingItem(item)}
                    className="flex items-center gap-1 h-10 text-xs px-3"
                    data-testid={`button-edit-${item.id}`}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <IngredientsDialog menuItem={item} />
                  <Button
                    variant="outline"
                    onClick={() => handleDuplicate(item)}
                    className="flex items-center gap-1 h-10 text-xs px-3"
                    data-testid={`button-duplicate-${item.id}`}
                  >
                    <Copy className="h-4 w-4" />
                    Duplikat
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => deleteItemMutation.mutate(item.id)}
                    className="flex items-center gap-1 h-10 text-xs px-3 text-destructive hover:text-destructive"
                    data-testid={`button-delete-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground" data-testid="text-no-menu-items">
            Belum ada menu item
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <MenuItemForm
              initialData={editingItem}
              onSubmit={(item) => updateItemMutation.mutate({ id: editingItem.id, item })}
              isLoading={updateItemMutation.isPending}
              categories={categories}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Dialog untuk kelola bahan baku / resep per menu item
function IngredientsDialog({ menuItem }: { menuItem: MenuItem }) {
  const [open, setOpen] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [quantity, setQuantity] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ingredients = [], isLoading: ingLoading } = useQuery<(MenuItemIngredient & { inventoryName?: string; inventoryUnit?: string })[]>({
    queryKey: ['/api/menu', menuItem.id, 'ingredients'],
    queryFn: async () => {
      const res = await fetch(`/api/menu/${menuItem.id}/ingredients`);
      return res.json();
    },
    enabled: open,
  });

  const { data: inventoryData } = useQuery<{ items: InventoryItem[] } | InventoryItem[]>({
    queryKey: ['/api/inventory?limit=500'],
    enabled: open,
  });
  const inventoryItems: InventoryItem[] = Array.isArray(inventoryData)
    ? inventoryData
    : (inventoryData as any)?.items || [];

  const getInventoryItem = (id: string) => inventoryItems.find(i => i.id === id);

  const addMutation = useMutation({
    mutationFn: async ({ inventoryItemId, quantityNeeded, unit }: { inventoryItemId: string; quantityNeeded: number; unit: string }) => {
      const res = await apiRequest('POST', `/api/menu/${menuItem.id}/ingredients`, { inventoryItemId, quantityNeeded, unit });
      if (!res.ok) throw new Error('Gagal menambahkan bahan');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu', menuItem.id, 'ingredients'] });
      setSelectedInventoryId('');
      setQuantity('');
      toast({ title: 'Bahan baku ditambahkan' });
    },
    onError: () => toast({ title: 'Gagal menambahkan bahan', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ingredientId: string) => {
      const res = await apiRequest('DELETE', `/api/menu/ingredients/${ingredientId}`);
      if (!res.ok) throw new Error('Gagal menghapus');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu', menuItem.id, 'ingredients'] });
      toast({ title: 'Bahan baku dihapus' });
    },
    onError: () => toast({ title: 'Gagal menghapus bahan', variant: 'destructive' }),
  });

  const handleAdd = () => {
    if (!selectedInventoryId || !quantity || Number(quantity) <= 0) {
      toast({ title: 'Pilih bahan dan masukkan jumlah', variant: 'destructive' });
      return;
    }
    const inv = getInventoryItem(selectedInventoryId);
    if (!inv) return;
    addMutation.mutate({ inventoryItemId: selectedInventoryId, quantityNeeded: Number(quantity), unit: inv.unit });
  };

  // Already added inventory IDs
  const addedIds = new Set(ingredients.map(i => i.inventoryItemId));
  const availableInventory = inventoryItems.filter(i => !addedIds.has(i.id));
  const selectedInv = getInventoryItem(selectedInventoryId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1 h-10 text-xs px-3" data-testid={`button-ingredients-${menuItem.id}`}>
          <FlaskConical className="h-4 w-4" />
          Bahan Baku
          {ingredients.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 text-[10px] px-1">{ingredients.length}</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bahan Baku — {menuItem.name}</DialogTitle>
          <DialogDescription>
            Stok bahan baku akan berkurang otomatis saat ada pesanan masuk.
          </DialogDescription>
        </DialogHeader>

        {/* Daftar bahan saat ini */}
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {ingLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : ingredients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada bahan baku. Tambahkan di bawah.</p>
          ) : (
            ingredients.map(ing => {
              const inv = getInventoryItem(ing.inventoryItemId);
              return (
                <div key={ing.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{inv?.name ?? ing.inventoryItemId}</p>
                    <p className="text-xs text-muted-foreground">{ing.quantityNeeded} {ing.unit}</p>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(ing.id)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive hover:text-destructive/80 p-1"
                    data-testid={`button-delete-ingredient-${ing.id}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Form tambah bahan baru */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-semibold">Tambah Bahan Baku</p>
          <div>
            <Label className="text-xs mb-1 block">Pilih dari Stok</Label>
            <Select value={selectedInventoryId} onValueChange={setSelectedInventoryId}>
              <SelectTrigger data-testid="select-ingredient-item">
                <SelectValue placeholder="Pilih bahan baku..." />
              </SelectTrigger>
              <SelectContent>
                {availableInventory.length === 0 ? (
                  <SelectItem value="_none" disabled>Semua stok sudah ditambahkan</SelectItem>
                ) : (
                  availableInventory.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.name} ({inv.unit}) — sisa {inv.quantity} {inv.unit}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">
                Jumlah per Porsi {selectedInv ? `(${selectedInv.unit})` : ''}
              </Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder="Contoh: 200"
                data-testid="input-ingredient-quantity"
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={addMutation.isPending || !selectedInventoryId || !quantity}
              className="h-10"
              data-testid="button-add-ingredient"
            >
              {addMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Tambah'}
            </Button>
          </div>
          {selectedInv && (
            <p className="text-xs text-muted-foreground">
              Stok tersedia: {selectedInv.quantity} {selectedInv.unit}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MenuItemForm({ 
  initialData, 
  onSubmit, 
  isLoading,
  categories 
}: { 
  initialData?: MenuItem; 
  onSubmit: (item: InsertMenuItem) => void; 
  isLoading: boolean;
  categories: Category[];
}) {
  const [formData, setFormData] = useState<InsertMenuItem>({
    name: initialData?.name || '',
    price: initialData?.price || 0,
    categoryId: initialData?.categoryId || categories[0]?.id || '',
    description: initialData?.description || '',
    image: initialData?.image || '',
    isAvailable: initialData?.isAvailable ?? true,
    stock: initialData?.stock ?? null,
  });
  const [trackStock, setTrackStock] = useState<boolean>(initialData?.stock !== null && initialData?.stock !== undefined);

  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Backup form data to localStorage to prevent data loss
  useEffect(() => {
    if (!initialData) { // Only backup for new items, not edits
      const backupKey = 'menu-form-backup';
      const backupData = localStorage.getItem(backupKey);
      
      if (backupData && formData.name === '' && formData.description === '' && formData.price === 0) {
        try {
          const parsed = JSON.parse(backupData);
          setFormData(parsed);
        } catch (error) {
          console.error('Failed to restore form backup:', error);
        }
      }
    }
  }, []);

  // Save form data to localStorage on changes
  useEffect(() => {
    if (!initialData) { // Only backup for new items
      const backupKey = 'menu-form-backup';
      localStorage.setItem(backupKey, JSON.stringify(formData));
    }
  }, [formData, initialData]);

  // Simple file upload handler for VPS
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "File tidak valid",
        description: "Hanya file gambar yang diperbolehkan",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran maksimal file adalah 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload directly to /api/objects/upload
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('alonica-token')}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload response:', data);
      const imageUrl = data.path || data.uploadURL;
      console.log('Image URL:', imageUrl);

      if (!imageUrl) {
        throw new Error('Server tidak mengembalikan URL gambar');
      }

      // Update form data with new image URL
      setFormData(prev => ({ ...prev, image: imageUrl }));
      
      toast({
        title: "Upload berhasil",
        description: `Foto tersimpan: ${imageUrl}`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload gagal",
        description: error instanceof Error ? error.message : "Silakan coba lagi",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    
    // Clear backup after successful submit
    if (!initialData) {
      localStorage.removeItem('menu-form-backup');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nama Menu</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          data-testid="input-menu-name"
        />
      </div>

      <div>
        <Label htmlFor="price">Harga (Rp)</Label>
        <CurrencyInput
          id="price"
          value={formData.price}
          onValueChange={(value) => setFormData(prev => ({ ...prev, price: value }))}
          required
          data-testid="input-menu-price"
        />
      </div>

      <div>
        <Label htmlFor="category">Kategori</Label>
        <Select 
          value={formData.categoryId} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
        >
          <SelectTrigger data-testid="select-menu-category">
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          data-testid="textarea-menu-description"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Lacak Stok</Label>
          <Switch
            checked={trackStock}
            onCheckedChange={(checked) => {
              setTrackStock(checked);
              setFormData(prev => ({ ...prev, stock: checked ? (prev.stock ?? 0) : null }));
            }}
            data-testid="switch-track-stock"
          />
        </div>
        {trackStock && (
          <div>
            <Label htmlFor="stock">Jumlah Stok</Label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock ?? 0}
              onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
              placeholder="Masukkan jumlah stok"
              data-testid="input-menu-stock"
            />
            <p className="text-xs text-muted-foreground mt-1">Stok akan berkurang otomatis setiap ada pesanan masuk.</p>
          </div>
        )}
      </div>

      <div>
        <Label>Menu Image</Label>
        <div className="space-y-3">
          {/* Current image preview */}
          {formData.image && (
            <div className="relative">
              <img 
                src={formData.image} 
                alt="Current menu image"
                className="w-32 h-32 object-cover rounded-lg border"
              />
            </div>
          )}
          
          {/* Simple file upload */}
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="menu-image-upload"
              data-testid="input-menu-image"
            />
            <Label htmlFor="menu-image-upload">
              <Button 
                type="button"
                variant="outline"
                className="w-full"
                disabled={isUploading}
                onClick={() => document.getElementById('menu-image-upload')?.click()}
                data-testid="button-upload-image"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Uploading...' : (formData.image ? 'Ganti Foto' : 'Upload Foto')}
              </Button>
            </Label>
          </div>
          
          {isUploading && (
            <p className="text-sm text-muted-foreground text-center">
              Sedang mengupload foto... Form data akan tetap tersimpan.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isAvailable"
          checked={formData.isAvailable}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAvailable: checked }))}
          data-testid="switch-menu-available"
        />
        <Label htmlFor="isAvailable">Tersedia</Label>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full h-11" data-testid="button-save-menu">
        {isLoading ? "Menyimpan..." : "Simpan Item"}
      </Button>
    </form>
  );
}
