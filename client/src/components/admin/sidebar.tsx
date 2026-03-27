import { useLocation } from "wouter";
import { useState } from "react";
import {
  ScanLine,
  Receipt,
  ListOrdered,
  ChefHat,
  Wine,
  CalendarDays,
  BadgeCheck,
  UsersRound,
  Utensils,
  Layers,
  Boxes,
  BadgePercent,
  Images,
  CircleCheck,
  Landmark,
  BarChart3,
  Settings2,
  Printer,
  Network,
  Grid3X3,
  ClipboardList,
  FileText,
  LogOut,
  X,
  Menu as MenuIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: string;
}

const BASE_NAV_GROUPS = [
  {
    label: "POS & PESANAN",
    superAdminOnly: false,
    items: [
      { key: "cashier", label: "Kasir", icon: ScanLine },
      { key: "orders", label: "Pesanan", icon: Receipt },
      { key: "drink-queue", label: "Antrian Pesanan", icon: ListOrdered },
      { key: "kitchen", label: "Dapur", icon: ChefHat },
      { key: "bar", label: "Bar", icon: Wine },
      { key: "reservations", label: "Reservasi", icon: CalendarDays },
    ],
  },
  {
    label: "PELANGGAN",
    superAdminOnly: false,
    items: [
      { key: "members", label: "Data Member", icon: BadgeCheck },
      { key: "users", label: "Kelola Akun Staff", icon: UsersRound },
    ],
  },
  {
    label: "MENU & INVENTORI",
    superAdminOnly: false,
    items: [
      { key: "menu", label: "Manajemen Menu", icon: Utensils },
      { key: "categories", label: "Kategori Menu", icon: Layers },
      { key: "inventory", label: "Stok Bahan Baku", icon: Boxes },
    ],
  },
  {
    label: "PROMO & KONTEN",
    superAdminOnly: false,
    items: [
      { key: "discounts", label: "Diskon & Voucher", icon: BadgePercent },
      { key: "banners", label: "Banner Halaman Depan", icon: Images },
    ],
  },
  {
    label: "LAPORAN",
    superAdminOnly: false,
    items: [
      { key: "approvals", label: "Persetujuan", icon: CircleCheck },
      { key: "audit-reports", label: "Laporan Keuangan", icon: Landmark },
      { key: "analytics", label: "Laporan Penjualan", icon: BarChart3 },
      { key: "daily-reports", label: "Laporan Harian Kasir", icon: FileText },
    ],
  },
  {
    label: "PENGATURAN",
    superAdminOnly: false,
    items: [
      { key: "settings", label: "Pengaturan Toko", icon: Settings2 },
      { key: "printer", label: "Pengaturan Printer", icon: Printer },
    ],
  },
  {
    label: "MULTI-CABANG",
    superAdminOnly: true,
    items: [
      { key: "branches", label: "Manajemen Cabang", icon: Network },
      { key: "tables", label: "Manajemen Meja", icon: Grid3X3 },
      { key: "shift-reports", label: "Laporan Shift Kasir", icon: ClipboardList },
    ],
  },
];

function getNavGroups(user: any) {
  const isSuperAdmin = user?.role === "admin" && user?.branchId === null;
  const allowedMenus: string[] | null = user?.allowedMenus ?? null;
  return BASE_NAV_GROUPS
    .filter(g => !g.superAdminOnly || isSuperAdmin)
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        isSuperAdmin || allowedMenus === null || allowedMenus.includes(item.key)
      ),
    }))
    .filter(group => group.items.length > 0);
}

function NgehnoomLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: "#FF9500",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <svg width={17} height={13} viewBox="0 0 22 18" fill="none">
          <path d="M2 16V6C2 6 2 2 6.5 2C11 2 11 6 11 6V16" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M11 16V6C11 6 11 2 15.5 2C20 2 20 6 20 6V16" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: "#18181B", lineHeight: 1 }}>ngehnoom</p>
        <p style={{ fontSize: 10, color: "#A1A1AA", lineHeight: 1.3, marginTop: 2 }}>admin dashboard</p>
      </div>
    </div>
  );
}

function SidebarContent({ currentSection, onNavigate, onLogout, user, collapsed = false }: {
  currentSection: string;
  onNavigate: (key: string) => void;
  onLogout: () => void;
  user: any;
  collapsed?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: collapsed ? "16px 0 14px" : "16px 16px 14px",
        borderBottom: "1px solid hsl(var(--sidebar-border))",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        {collapsed ? (
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "#FF9500",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width={15} height={11} viewBox="0 0 22 18" fill="none">
              <path d="M2 16V6C2 6 2 2 6.5 2C11 2 11 6 11 6V16" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M11 16V6C11 6 11 2 15.5 2C20 2 20 6 20 6V16" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
        ) : (
          <NgehnoomLogo />
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: collapsed ? "8px 6px" : "8px 10px" }}>
        {getNavGroups(user).map((group, gi) => (
          <div key={group.label} style={{ marginTop: gi > 0 ? (collapsed ? 6 : 16) : 0 }}>
            {!collapsed && (
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                color: "#A1A1AA", padding: "0 8px", marginBottom: 2, textTransform: "uppercase",
              }}>
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div style={{ height: 1, background: "hsl(var(--sidebar-border))", margin: "2px 8px 6px" }} />
            )}
            <div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                    data-testid={`nav-${item.key}`}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: collapsed ? "center" : "flex-start",
                      gap: collapsed ? 0 : 9,
                      width: "100%",
                      padding: collapsed ? "9px 0" : "7px 9px",
                      borderRadius: 7, border: "none", cursor: "pointer",
                      background: isActive ? "hsl(var(--sidebar-accent))" : "transparent",
                      marginBottom: 1,
                      transition: "background 0.1s",
                      position: "relative",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "hsl(var(--muted))"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <Icon
                      size={16}
                      style={{
                        color: isActive ? "#FF9500" : "#71717A",
                        flexShrink: 0,
                      }}
                    />
                    {!collapsed && (
                      <span style={{
                        fontSize: 13, fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#FF9500" : "#52525B",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {item.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - User info + logout */}
      <div style={{ borderTop: "1px solid hsl(var(--sidebar-border))", padding: collapsed ? "10px 6px" : "10px 10px" }}>
        {collapsed ? (
          <button
            onClick={onLogout}
            data-testid="button-logout-sidebar"
            title="Logout"
            style={{
              width: "100%", display: "flex", justifyContent: "center", alignItems: "center",
              padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer",
              background: "transparent",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--muted))"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut size={16} style={{ color: "#71717A" }} />
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", borderRadius: 8, background: "hsl(var(--muted))" }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: "#FF9500",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>
                {user?.username?.[0]?.toUpperCase() || "A"}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: "#18181B", lineHeight: 1 }}>{user?.username || "Admin"}</p>
              <p style={{ fontSize: 10.5, color: "#A1A1AA", marginTop: 2.5 }}>{user?.role === "admin" ? "Administrator" : "Kasir"}</p>
            </div>
            <button
              onClick={onLogout}
              data-testid="button-logout-sidebar"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6 }}
              title="Logout"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "hsl(var(--border))"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
            >
              <LogOut size={15} style={{ color: "#A1A1AA" }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSidebar({ isOpen, onClose, currentSection }: AdminSidebarProps) {
  const [, setLocation] = useLocation();
  const { logout, user } = useAuth();

  const SECTION_TO_PATH: Record<string, string> = Object.fromEntries(
    BASE_NAV_GROUPS.flatMap(g => g.items.map(i => [i.key, `/admin/${i.key}`]))
  );

  const handleNavigate = (key: string) => {
    setLocation(SECTION_TO_PATH[key] || `/admin/${key}`);
    onClose();
  };

  const handleLogout = () => { logout(); onClose(); };

  const SIDEBAR_BG = "hsl(var(--sidebar))";
  const SIDEBAR_BORDER = "1px solid hsl(var(--sidebar-border))";

  return (
    <>
      {/* Tablet Sidebar — icon-only, 64px (md to lg) */}
      <div
        className="hidden md:flex lg:hidden"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 64,
          background: SIDEBAR_BG,
          borderRight: SIDEBAR_BORDER,
          zIndex: 40, flexDirection: "column",
        }}
      >
        <SidebarContent
          currentSection={currentSection}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          user={user}
          collapsed={true}
        />
      </div>

      {/* Desktop Sidebar — full, 240px (lg+) */}
      <div
        className="hidden lg:flex"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
          background: SIDEBAR_BG,
          borderRight: SIDEBAR_BORDER,
          zIndex: 40,
        }}
      >
        <div style={{ width: "100%", height: "100%" }}>
          <SidebarContent
            currentSection={currentSection}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            user={user}
            collapsed={false}
          />
        </div>
      </div>

      {/* Mobile Drawer (only on small screens) */}
      {isOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}
          className="md:hidden"
        >
          <div
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }}
          />
          <div style={{
            position: "relative", width: 260, height: "100%",
            background: SIDEBAR_BG, boxShadow: "4px 0 24px rgba(0,0,0,0.1)",
            zIndex: 1, borderRight: SIDEBAR_BORDER,
          }}>
            <button
              onClick={onClose}
              data-testid="button-close-sidebar"
              style={{
                position: "absolute", top: 16, right: 16,
                background: "hsl(var(--muted))", border: "none", cursor: "pointer",
                width: 28, height: 28, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={14} style={{ color: "#71717A" }} />
            </button>
            <SidebarContent
              currentSection={currentSection}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              user={user}
            />
          </div>
        </div>
      )}
    </>
  );
}
