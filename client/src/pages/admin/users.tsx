import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Eye, EyeOff, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";

// Daftar semua menu yang bisa diatur izinnya
const ALL_MENU_GROUPS = [
  {
    group: "POS & Pesanan",
    items: [
      { key: "cashier", label: "Kasir" },
      { key: "orders", label: "Pesanan" },
      { key: "drink-queue", label: "Antrian Pesanan" },
      { key: "kitchen", label: "Dapur & Bar" },
      { key: "reservations", label: "Reservasi" },
      { key: "shift", label: "Manajemen Shift" },
      { key: "expenses", label: "Pengeluaran" },
      { key: "daily-reports", label: "Laporan Penjualan" },
    ],
  },
  {
    group: "Pelanggan",
    items: [
      { key: "members", label: "Data Member" },
      { key: "users", label: "Pengguna Admin" },
    ],
  },
  {
    group: "Promo & Konten",
    items: [
      { key: "discounts", label: "Diskon & Voucher" },
      { key: "banners", label: "Banner Halaman Depan" },
    ],
  },
  {
    group: "Laporan",
    items: [
      { key: "approvals", label: "Persetujuan" },
      { key: "audit-reports", label: "Laporan Keuangan" },
      { key: "analytics", label: "Laporan Penjualan" },
      { key: "inventory", label: "Laporan Item" },
    ],
  },
  {
    group: "Pengaturan",
    items: [
      { key: "settings", label: "Pengaturan Toko" },
      { key: "menu", label: "Manajemen Menu" },
      { key: "categories", label: "Kategori Menu" },
      { key: "printer", label: "Pengaturan Printer" },
    ],
  },
];

const ALL_MENU_KEYS = ALL_MENU_GROUPS.flatMap(g => g.items.map(i => i.key));

// Schema for creating new users
const createUserSchema = insertUserSchema.extend({
  allowedMenus: z.array(z.string()).optional().nullable(),
});

// Schema for editing users (password is optional)
const editUserSchema = insertUserSchema.extend({
  password: z.string().optional(),
  allowedMenus: z.array(z.string()).optional().nullable(),
});

type CreateFormData = z.infer<typeof createUserSchema>;
type EditFormData = z.infer<typeof editUserSchema>;

export default function UsersSection() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { createErrorHandler } = useErrorHandler();
  const { confirm, dialog } = useConfirmDialog();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const isSuperAdmin = currentUser?.role === "admin" && currentUser?.branchId === null;

  // Form for creating new users
  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "kasir",
      allowedMenus: null,
    }
  });

  // Form for editing existing users
  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "kasir",
      allowedMenus: null,
    }
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createUserMutation = useMutation({
    mutationFn: async (user: CreateFormData) => {
      const payload = {
        ...user,
        allowedMenus: user.allowedMenus && user.allowedMenus.length > 0 ? user.allowedMenus : null,
      };
      const response = await apiRequest('POST', '/api/users', payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowAddDialog(false);
      createForm.reset({ username: "", password: "", role: "kasir", allowedMenus: null });
      toast({ title: "User berhasil ditambahkan", description: "User baru telah dibuat" });
    },
    onError: createErrorHandler("Gagal menambahkan user")
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, user }: { id: string; user: Partial<EditFormData> }) => {
      const payload = {
        ...user,
        allowedMenus: user.allowedMenus && user.allowedMenus.length > 0 ? user.allowedMenus : null,
      };
      const response = await apiRequest('PUT', `/api/users/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditingUser(null);
      editForm.reset({ username: "", password: "", role: "kasir", allowedMenus: null });
      toast({ title: "User berhasil diupdate", description: "Data user telah diperbarui" });
    },
    onError: createErrorHandler("Gagal update user")
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: "User berhasil dihapus", description: "User telah dihapus" });
    },
    onError: createErrorHandler("Gagal menghapus user")
  });

  const handleCreateSubmit = (data: CreateFormData) => {
    createUserMutation.mutate(data);
  };

  const handleEditSubmit = (data: EditFormData) => {
    if (!editingUser) return;
    const updateData: Partial<EditFormData> = {
      username: data.username,
      role: data.role,
      allowedMenus: data.allowedMenus,
    };
    if (data.password && data.password.trim() !== "") {
      updateData.password = data.password;
    }
    updateUserMutation.mutate({ id: editingUser.id, user: updateData });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    editForm.reset({
      username: user.username,
      password: "",
      role: user.role,
      allowedMenus: (user as any).allowedMenus ?? null,
    });
  };

  const handleDelete = (user: User) => {
    confirm({
      title: "Hapus User",
      description: `Apakah Anda yakin ingin menghapus user "${user.username}"?`,
      confirmText: "Hapus",
      variant: "destructive",
      onConfirm: () => deleteUserMutation.mutate(user.id),
    });
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingUser(null);
    createForm.reset({ username: "", password: "", role: "kasir", allowedMenus: null });
    editForm.reset({ username: "", password: "", role: "kasir", allowedMenus: null });
    setShowPassword(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="alonica-card p-4 animate-pulse">
              <div className="h-20 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentForm = editingUser ? editForm : createForm;
  const isDialogOpen = showAddDialog || !!editingUser;

  // Komponen checkbox menu akses (hanya super admin yang bisa set ini)
  const MenuAccessSelector = ({ form }: { form: any }) => {
    const selectedMenus: string[] = form.watch("allowedMenus") ?? [];
    const allSelected = ALL_MENU_KEYS.every(k => selectedMenus.includes(k));

    const toggleMenu = (key: string) => {
      const current = form.getValues("allowedMenus") ?? [];
      if (current.includes(key)) {
        form.setValue("allowedMenus", current.filter((k: string) => k !== key));
      } else {
        form.setValue("allowedMenus", [...current, key]);
      }
    };

    const toggleAll = () => {
      if (allSelected) {
        form.setValue("allowedMenus", null); // null = semua akses
      } else {
        form.setValue("allowedMenus", [...ALL_MENU_KEYS]);
      }
    };

    return (
      <div style={{ marginTop: 4 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 13, color: "#6E6E73" }}>
            {selectedMenus.length === 0 || selectedMenus === null
              ? "Semua menu diizinkan (default)"
              : `${selectedMenus.length} dari ${ALL_MENU_KEYS.length} menu dipilih`}
          </span>
          <button
            type="button"
            onClick={toggleAll}
            style={{
              fontSize: 12, color: "#FF9500", fontWeight: 600,
              background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
            }}
            data-testid="button-toggle-all-menus"
          >
            {allSelected ? "Hapus Semua" : "Pilih Semua"}
          </button>
        </div>
        {ALL_MENU_GROUPS.map(group => (
          <div key={group.group} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              {group.group}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {group.items.map(item => {
                const isChecked = selectedMenus.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleMenu(item.key)}
                    data-testid={`toggle-menu-${item.key}`}
                    style={{
                      padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                      border: isChecked ? "1.5px solid #FF9500" : "1.5px solid #E5E5EA",
                      background: isChecked ? "#FFF5E6" : "#F5F5F7",
                      color: isChecked ? "#FF9500" : "#6E6E73",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 6 }}>
          Jika tidak ada yang dipilih, user memiliki akses ke semua menu sesuai rolenya.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-users-title">
          Manajemen Pengguna
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-user">
              <Plus className="w-4 h-4 mr-2" />
              Tambah User
            </Button>
          </DialogTrigger>
          <DialogContent
            className="sm:max-w-[500px]"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
            data-testid="dialog-user-form"
          >
            <DialogHeader>
              <DialogTitle data-testid="text-dialog-title">
                {editingUser ? "Edit User" : "Tambah User Baru"}
              </DialogTitle>
            </DialogHeader>
            <Form {...currentForm}>
              <form
                onSubmit={currentForm.handleSubmit(
                  editingUser
                    ? (handleEditSubmit as any)
                    : (handleCreateSubmit as any)
                )}
                className="space-y-4"
              >
                {/* Username */}
                <FormField
                  control={currentForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Masukkan username" data-testid="input-username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={currentForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {editingUser ? "Password Baru (opsional)" : "Password"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder={editingUser ? "Kosongkan jika tidak ingin mengubah" : "Masukkan password"}
                            data-testid="input-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role */}
                <FormField
                  control={currentForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Pilih role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kasir">Kasir</SelectItem>
                          <SelectItem value="dapur">Dapur</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Menu Akses — hanya super admin yang bisa set */}
                {isSuperAdmin && (
                  <div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      marginBottom: 10, paddingBottom: 10,
                      borderBottom: "1px solid #E5E5EA",
                    }}>
                      <ShieldCheck size={16} color="#FF9500" />
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#1D1D1F" }}>
                        Izin Akses Menu
                      </span>
                    </div>
                    <MenuAccessSelector form={currentForm} />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createUserMutation.isPending || updateUserMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingUser ? "Memperbarui..." : "Membuat..."}
                      </div>
                    ) : (
                      editingUser ? "Update User" : "Tambah User"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map((user) => {
          const userAllowedMenus = (user as any).allowedMenus as string[] | null;
          const hasRestriction = userAllowedMenus && userAllowedMenus.length > 0;
          return (
            <div key={user.id} className="alonica-card p-6" data-testid={`card-user-${user.id}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground" data-testid={`text-username-${user.id}`}>
                    {user.username}
                  </h3>
                  <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      data-testid={`badge-role-${user.id}`}
                    >
                      {user.role === 'admin' ? 'Admin' : user.role === 'dapur' ? 'Dapur' : 'Kasir'}
                    </Badge>
                    {hasRestriction && (
                      <Badge variant="outline" style={{ fontSize: 11, color: "#FF9500", borderColor: "#FF9500" }}>
                        <ShieldCheck size={10} style={{ marginRight: 3 }} />
                        {userAllowedMenus!.length} menu
                      </Badge>
                    )}
                    {!hasRestriction && (
                      <Badge variant="outline" style={{ fontSize: 11, color: "#34C759", borderColor: "#34C759" }}>
                        Akses Penuh
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(user)}
                    data-testid={`button-edit-${user.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(user)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-${user.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Tampilkan menu yang diizinkan */}
              {hasRestriction && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 11, color: "#8E8E93", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Menu yang dapat diakses:
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {userAllowedMenus!.map(key => {
                      const label = ALL_MENU_GROUPS.flatMap(g => g.items).find(i => i.key === key)?.label ?? key;
                      return (
                        <span
                          key={key}
                          style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 6,
                            background: "#FFF5E6", color: "#FF9500", fontWeight: 500,
                          }}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground mt-3">
                <p>ID: {user.id.slice(0, 8)}...</p>
              </div>
            </div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12" data-testid="text-no-users">
          <Users size={40} color="#8E8E93" style={{ margin: "0 auto 12px" }} />
          <p className="text-muted-foreground">Belum ada user yang dibuat</p>
        </div>
      )}

      {dialog}
    </div>
  );
}
