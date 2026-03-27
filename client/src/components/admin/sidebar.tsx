import { useLocation } from "wouter";
import { useState } from "react";
import {
  ClipboardList,
  Utensils,
  Tags,
  TrendingUp,
  Package2,
  Settings,
  LogOut,
  X,
  Calendar,
  Percent as PercentIcon,
  Printer,
  Building2,
  Cog,
  CheckSquare,
  ImageIcon,
  Users,
  CreditCard,
  Crown,
  Menu as MenuIcon,
  GitBranch,
  GlassWater,
  ChefHat,
  FileBarChart2,
  LayoutGrid,
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
      { key: "cashier", label: "Kasir", icon: CreditCard },
      { key: "orders", label: "Pesanan", icon: ClipboardList },
      { key: "drink-queue", label: "Antrian Pesanan", icon: GlassWater },
      { key: "kitchen", label: "Dapur", icon: ChefHat },
      { key: "bar", label: "Bar", icon: GlassWater },
      { key: "reservations", label: "Reservasi", icon: Calendar },
    ],
  },
  {
    label: "PELANGGAN",
    superAdminOnly: false,
    items: [
      { key: "members", label: "Data Member", icon: Crown },
      { key: "users", label: "Kelola Akun Staff", icon: Users },
    ],
  },
  {
    label: "MENU & INVENTORI",
    superAdminOnly: false,
    items: [
      { key: "menu", label: "Manajemen Menu", icon: Utensils },
      { key: "categories", label: "Kategori Menu", icon: Tags },
      { key: "inventory", label: "Stok Bahan Baku", icon: Package2 },
    ],
  },
  {
    label: "PROMO & KONTEN",
    superAdminOnly: false,
    items: [
      { key: "discounts", label: "Diskon & Voucher", icon: PercentIcon },
      { key: "banners", label: "Banner Halaman Depan", icon: ImageIcon },
    ],
  },
  {
    label: "LAPORAN",
    superAdminOnly: false,
    items: [
      { key: "approvals", label: "Persetujuan", icon: CheckSquare },
      { key: "audit-reports", label: "Laporan Keuangan", icon: Building2 },
      { key: "analytics", label: "Laporan Penjualan", icon: TrendingUp },
    ],
  },
  {
    label: "PENGATURAN",
    superAdminOnly: false,
    items: [
      { key: "settings", label: "Pengaturan Toko", icon: Cog },
      { key: "printer", label: "Pengaturan Printer", icon: Printer },
    ],
  },
  {
    label: "MULTI-CABANG",
    superAdminOnly: true,
    items: [
      { key: "branches", label: "Manajemen Cabang", icon: GitBranch },
      { key: "tables", label: "Manajemen Meja", icon: LayoutGrid },
      { key: "shift-reports", label: "Laporan Shift Kasir", icon: FileBarChart2 },
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

const SIDEBAR_BG = "#16171D";
const SIDEBAR_BORDER = "rgba(255,255,255,0.07)";
const ACTIVE_BG = "rgba(255,149,0,0.14)";
const HOVER_BG = "rgba(255,255,255,0.05)";
const ICON_INACTIVE = "rgba(255,255,255,0.45)";
const ICON_ACTIVE = "#FF9500";
const TEXT_INACTIVE = "rgba(255,255,255,0.72)";
const TEXT_ACTIVE = "#FF9500";
const LABEL_COLOR = "rgba(255,255,255,0.28)";

function NgehnoomLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: "linear-gradient(135deg, #FFAB00 0%, #FF9500 50%, #FF2D55 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(255,149,0,0.35)",
      }}>
        <svg width={17} height={13} viewBox="0 0 22 18" fill="none">
          <path d="M2 16V6C2 6 2 2 6.5 2C11 2 11 6 11 6V16" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M11 16V6C11 6 11 2 15.5 2C20 2 20 6 20 6V16" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p style={{ fontWeight: 800, fontSize: 14.5, letterSpacing: "-0.02em", color: "#FFFFFF", lineHeight: 1 }}>ngehnoom</p>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", lineHeight: 1.3, marginTop: 2, letterSpacing: "0.02em" }}>admin dashboard</p>
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
        padding: collapsed ? "18px 0 16px" : "18px 16px 16px",
        borderBottom: `1px solid ${SIDEBAR_BORDER}`,
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        {collapsed ? (
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, #FFAB00 0%, #FF9500 50%, #FF2D55 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(255,149,0,0.35)",
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
      <nav style={{ flex: 1, overflowY: "auto", padding: collapsed ? "10px 6px" : "10px 8px" }}>
        {getNavGroups(user).map((group, gi) => (
          <div key={group.label} style={{ marginTop: gi > 0 ? (collapsed ? 6 : 18) : 0 }}>
            {!collapsed && (
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
                color: LABEL_COLOR, padding: "0 8px", marginBottom: 3, textTransform: "uppercase",
              }}>
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div style={{ height: 1, background: SIDEBAR_BORDER, margin: "2px 8px 6px" }} />
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
                      padding: collapsed ? "9px 0" : "8px 9px",
                      borderRadius: 9, border: "none", cursor: "pointer",
                      background: isActive ? ACTIVE_BG : "transparent",
                      marginBottom: 1,
                      transition: "background 0.13s",
                      position: "relative",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = HOVER_BG; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    {isActive && !collapsed && (
                      <div style={{
                        position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                        width: 3, height: 16, borderRadius: "0 3px 3px 0",
                        background: "#FF9500",
                      }} />
                    )}
                    <Icon
                      size={collapsed ? 19 : 16}
                      style={{ color: isActive ? ICON_ACTIVE : ICON_INACTIVE, flexShrink: 0 }}
                    />
                    {!collapsed && (
                      <span style={{
                        fontSize: 13, fontWeight: isActive ? 600 : 400,
                        color: isActive ? TEXT_ACTIVE : TEXT_INACTIVE,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {item.label}
                      </span>
                    )}
                    {collapsed && isActive && (
                      <div style={{
                        position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
                        width: 3, height: 16, borderRadius: "2px 0 0 2px",
                        background: "#FF9500",
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - User info + logout */}
      <div style={{ borderTop: `1px solid ${SIDEBAR_BORDER}`, padding: collapsed ? "10px 6px" : "10px 8px" }}>
        {collapsed ? (
          <button
            onClick={onLogout}
            data-testid="button-logout-sidebar"
            title="Logout"
            style={{
              width: "100%", display: "flex", justifyContent: "center", alignItems: "center",
              padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer",
              background: "transparent",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = HOVER_BG; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut size={17} style={{ color: ICON_INACTIVE }} />
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, #FF9500, #FF2D55)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>
                {user?.username?.[0]?.toUpperCase() || "A"}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1 }}>{user?.username || "Admin"}</p>
              <p style={{ fontSize: 10.5, color: "rgba(255,255,255,0.38)", marginTop: 2.5 }}>{user?.role === "admin" ? "Administrator" : "Kasir"}</p>
            </div>
            <button
              onClick={onLogout}
              data-testid="button-logout-sidebar"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 7 }}
              title="Logout"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = HOVER_BG; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
            >
              <LogOut size={15} style={{ color: "rgba(255,255,255,0.38)" }} />
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

  return (
    <>
      {/* Tablet Sidebar — icon-only, 64px (md to lg) */}
      <div
        className="hidden md:flex lg:hidden"
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 64,
          background: SIDEBAR_BG,
          borderRight: `1px solid ${SIDEBAR_BORDER}`,
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
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          />
          <div style={{
            position: "relative", width: 260, height: "100%",
            background: SIDEBAR_BG, boxShadow: "4px 0 32px rgba(0,0,0,0.25)",
            zIndex: 1,
          }}>
            <button
              onClick={onClose}
              data-testid="button-close-sidebar"
              style={{
                position: "absolute", top: 16, right: 16,
                background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer",
                width: 28, height: 28, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={14} style={{ color: "rgba(255,255,255,0.8)" }} />
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
