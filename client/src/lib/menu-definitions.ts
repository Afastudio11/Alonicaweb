/**
 * SINGLE SOURCE OF TRUTH for all menu keys, labels, icons, and paths.
 *
 * Adding a new menu item here automatically reflects in:
 *   1. Admin panel → "Izin Akses Menu" permission picker (admin/users.tsx)
 *   2. Kasir sidebar (components/kasir/sidebar.tsx)
 *
 * After adding a new key here you MUST also add a case for it in
 * kasir/dashboard.tsx renderSection() so navigating to it renders
 * the correct page component.
 */

import {
  Calculator,
  ClipboardList,
  LayoutGrid,
  ChefHat,
  Calendar,
  Clock,
  Receipt,
  TrendingUp,
  Users,
  UserCog,
  Tag,
  Image,
  ClipboardCheck,
  FileText,
  BarChart2,
  Package,
  Settings,
  UtensilsCrossed,
  Layers,
  Printer,
  type LucideIcon,
} from "lucide-react";

export interface MenuGroupItem {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export interface MenuGroup {
  group: string;
  items: MenuGroupItem[];
}

/**
 * Master list of all menus, grouped exactly as shown in the admin
 * "Izin Akses Menu" permission picker.
 * Order = order shown in the admin UI and in the kasir sidebar.
 */
export const MENU_GROUPS: MenuGroup[] = [
  {
    group: "POS & Pesanan",
    items: [
      { key: "cashier",       label: "Kasir",               icon: Calculator,    path: "/kasir/cashier" },
      { key: "orders",        label: "Pesanan",              icon: ClipboardList, path: "/kasir/orders" },
      { key: "drink-queue",   label: "Antrian Pesanan",      icon: LayoutGrid,    path: "/kasir/drink-queue" },
      { key: "kitchen",       label: "Dapur & Bar",          icon: ChefHat,       path: "/kasir/kitchen" },
      { key: "reservations",  label: "Reservasi",            icon: Calendar,      path: "/kasir/reservations" },
      { key: "shift",         label: "Manajemen Shift",      icon: Clock,         path: "/kasir/shift" },
      { key: "expenses",      label: "Pengeluaran",          icon: Receipt,       path: "/kasir/expenses" },
      { key: "daily-reports", label: "Laporan Penjualan",    icon: TrendingUp,    path: "/kasir/daily-reports" },
    ],
  },
  {
    group: "Pelanggan",
    items: [
      { key: "members", label: "Data Member",    icon: Users,   path: "/kasir/members" },
      { key: "users",   label: "Pengguna Admin", icon: UserCog, path: "/kasir/users" },
    ],
  },
  {
    group: "Promo & Konten",
    items: [
      { key: "discounts", label: "Diskon & Voucher",     icon: Tag,   path: "/kasir/discounts" },
      { key: "banners",   label: "Banner Halaman Depan", icon: Image, path: "/kasir/banners" },
    ],
  },
  {
    group: "Laporan",
    items: [
      { key: "approvals",     label: "Persetujuan",      icon: ClipboardCheck, path: "/kasir/approvals" },
      { key: "audit-reports", label: "Laporan Keuangan", icon: FileText,       path: "/kasir/audit-reports" },
      { key: "analytics",     label: "Laporan Penjualan",icon: BarChart2,      path: "/kasir/analytics" },
      { key: "inventory",     label: "Laporan Item",     icon: Package,        path: "/kasir/inventory" },
    ],
  },
  {
    group: "Pengaturan",
    items: [
      { key: "settings",    label: "Pengaturan Toko",   icon: Settings,      path: "/kasir/settings" },
      { key: "menu",        label: "Manajemen Menu",    icon: UtensilsCrossed,path: "/kasir/menu" },
      { key: "categories",  label: "Kategori Menu",     icon: Layers,        path: "/kasir/categories" },
      { key: "printer",     label: "Pengaturan Printer",icon: Printer,       path: "/kasir/printer" },
    ],
  },
];

/** Flat list of all menu items — used by the kasir sidebar. */
export const ALL_MENU_ITEMS: MenuGroupItem[] = MENU_GROUPS.flatMap(g => g.items);

/** All valid menu keys — used for validation and the admin ALL_MENU_KEYS array. */
export const ALL_MENU_KEYS: string[] = ALL_MENU_ITEMS.map(i => i.key);
