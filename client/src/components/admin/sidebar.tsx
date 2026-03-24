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
  ChefHat,
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
      { key: "kitchen", label: "Dapur", icon: ChefHat },
      { key: "drink-queue", label: "Antrian Pesanan", icon: GlassWater },
      { key: "reservations", label: "Reservasi", icon: Calendar },
    ],
  },
  {
    label: "PELANGGAN",
    superAdminOnly: false,
    items: [
      { key: "members", label: "Data Member", icon: Crown },
      { key: "users", label: "Pengguna Admin", icon: Users },
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
      { key: "inventory", label: "Laporan Item", icon: Package2 },
    ],
  },
  {
    label: "PENGATURAN",
    superAdminOnly: false,
    items: [
      { key: "settings", label: "Pengaturan Toko", icon: Cog },
      { key: "menu", label: "Manajemen Menu", icon: Utensils },
      { key: "categories", label: "Kategori Menu", icon: Tags },
      { key: "printer", label: "Pengaturan Printer", icon: Printer },
    ],
  },
  {
    label: "MULTI-CABANG",
    superAdminOnly: true,
    items: [
      { key: "branches", label: "Manajemen Cabang", icon: GitBranch },
    ],
  },
];

function getNavGroups(user: any) {
  const isSuperAdmin = user?.role === "admin" && user?.branchId === null;
  return BASE_NAV_GROUPS.filter(g => !g.superAdminOnly || isSuperAdmin);
}

function NgehnoomLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "linear-gradient(135deg, #FFAB00, #FF9500, #FF2D55)",
        padding: 2, flexShrink: 0,
      }}>
        <div style={{
          width: "100%", height: "100%", borderRadius: "50%",
          background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width={18} height={14} viewBox="0 0 22 18" fill="none">
            <path d="M2 16V6C2 6 2 2 6.5 2C11 2 11 6 11 6V16" stroke="#FF9500" strokeWidth="3" strokeLinecap="round" />
            <path d="M11 16V6C11 6 11 2 15.5 2C20 2 20 6 20 6V16" stroke="#FF9500" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div>
        <p style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: "#1D1D1F", lineHeight: 1 }}>ngehnoom</p>
        <p style={{ fontSize: 10, color: "#AEAEB2", lineHeight: 1.2, marginTop: 2 }}>admin dashboard</p>
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
        padding: collapsed ? "20px 0 16px" : "20px 18px 16px",
        borderBottom: "1px solid #F0F0F0",
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
      }}>
        {collapsed ? (
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #FFAB00, #FF9500, #FF2D55)",
            padding: 2, flexShrink: 0,
          }}>
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%",
              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width={16} height={12} viewBox="0 0 22 18" fill="none">
                <path d="M2 16V6C2 6 2 2 6.5 2C11 2 11 6 11 6V16" stroke="#FF9500" strokeWidth="3" strokeLinecap="round" />
                <path d="M11 16V6C11 6 11 2 15.5 2C20 2 20 6 20 6V16" stroke="#FF9500" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        ) : (
          <NgehnoomLogo />
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: collapsed ? "12px 6px" : "12px 10px" }}>
        {getNavGroups(user).map((group, gi) => (
          <div key={group.label} style={{ marginTop: gi > 0 ? (collapsed ? 8 : 20) : 0 }}>
            {!collapsed && (
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                color: "#AEAEB2", padding: "0 10px", marginBottom: 4,
              }}>
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div style={{ height: 1, background: "#F0F0F0", margin: "4px 6px 8px" }} />
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
                      gap: collapsed ? 0 : 10,
                      width: "100%",
                      padding: collapsed ? "10px 0" : "9px 10px",
                      borderRadius: 12, border: "none", cursor: "pointer",
                      background: isActive ? "rgba(255,149,0,0.1)" : "transparent",
                      marginBottom: 2, transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <Icon
                      size={collapsed ? 20 : 17}
                      style={{ color: isActive ? "#FF9500" : "#6E6E73", flexShrink: 0 }}
                    />
                    {!collapsed && (
                      <>
                        <span style={{
                          fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                          color: isActive ? "#FF9500" : "#1D1D1F",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {item.label}
                        </span>
                        {isActive && (
                          <div style={{
                            marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                            background: "#FF9500", flexShrink: 0,
                          }} />
                        )}
                      </>
                    )}
                    {collapsed && isActive && (
                      <div style={{
                        position: "absolute", right: 0,
                        width: 3, height: 20, borderRadius: "2px 0 0 2px",
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
      <div style={{ borderTop: "1px solid #F0F0F0", padding: collapsed ? "12px 6px" : "12px 10px" }}>
        {collapsed ? (
          <button
            onClick={onLogout}
            data-testid="button-logout-sidebar"
            title="Logout"
            style={{
              width: "100%", display: "flex", justifyContent: "center", alignItems: "center",
              padding: "8px 0", borderRadius: 10, border: "none", cursor: "pointer",
              background: "transparent",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.05)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut size={18} style={{ color: "#AEAEB2" }} />
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 12, background: "#F5F5F7" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #FF9500, #FF2D55)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
                {user?.username?.[0]?.toUpperCase() || "A"}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", lineHeight: 1 }}>{user?.username || "Admin"}</p>
              <p style={{ fontSize: 11, color: "#AEAEB2", marginTop: 2 }}>{user?.role === "admin" ? "Administrator" : "Kasir"}</p>
            </div>
            <button
              onClick={onLogout}
              data-testid="button-logout-sidebar"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 8 }}
              title="Logout"
            >
              <LogOut size={16} style={{ color: "#AEAEB2" }} />
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
          background: "#FFFFFF", borderRight: "1px solid #F0F0F0",
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
          background: "#FFFFFF", borderRight: "1px solid #F0F0F0",
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
          {/* Backdrop */}
          <div
            onClick={onClose}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          />
          {/* Drawer */}
          <div style={{
            position: "relative", width: 260, height: "100%",
            background: "#FFFFFF", boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
            zIndex: 1,
          }}>
            {/* Close button */}
            <button
              onClick={onClose}
              data-testid="button-close-sidebar"
              style={{
                position: "absolute", top: 16, right: 16,
                background: "rgba(0,0,0,0.06)", border: "none", cursor: "pointer",
                width: 28, height: 28, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={14} style={{ color: "#1D1D1F" }} />
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
