import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LockKeyhole, ShieldOff } from "lucide-react";
import AdminSidebar from "@/components/admin/sidebar";
import OrdersSection from "./orders";
import KitchenSection from "./kitchen";
import CashierSection from "./cashier";
import MenuSection from "./menu";
import CategoriesSection from "./categories";
import AnalyticsSection from "./analytics";
import InventorySection from "./inventory";
import SettingsSection from "./settings";
import ReservationsSection from "./reservations";
import UsersSection from "./users";
import DiscountsSection from "./discounts";
import PrintSettingsSection from "./print-settings";
import AuditReportsSection from "./audit-reports";
import ApprovalsSection from "./approvals";
import BannersSection from "./banners";
import MembersSection from "./members";
import BranchesSection from "./branches";
import PrinterPage from "../printer";
import DrinkQueueSection from "./drink-queue";
import { Menu, Bell } from "lucide-react";
import { useState } from "react";
import NotificationBell from "@/components/admin/notification-bell";
import ScheduledOrderReminder from "@/components/admin/scheduled-reminder";

const SECTION_LABELS: Record<string, string> = {
  orders: "Pesanan",
  kitchen: "Dapur",
  cashier: "Kasir",
  reservations: "Reservasi",
  members: "Data Member",
  users: "Pengguna Admin",
  discounts: "Diskon & Voucher",
  banners: "Banner Halaman Depan",
  approvals: "Persetujuan",
  "audit-reports": "Laporan Keuangan",
  analytics: "Laporan Penjualan",
  inventory: "Laporan Item",
  settings: "Pengaturan Toko",
  menu: "Manajemen Menu",
  categories: "Kategori Menu",
  printer: "Pengaturan Printer",
  "print-settings": "Pengaturan Cetak",
  branches: "Manajemen Cabang",
  "drink-queue": "Antrian Pesanan",
};

export default function AdminDashboard() {
  const [location] = useLocation();
  const { user, logout, isAuthenticated, authReady } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const section = location.split("/admin/")[1] || "orders";
  const pageLabel = SECTION_LABELS[section] || "Dashboard";

  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "3px solid #FF9500", borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
          }} />
          <p style={{ color: "#6E6E73", fontSize: 14 }}>Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 32, background: "#fff", borderRadius: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <LockKeyhole size={40} color="#8E8E93" />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", marginBottom: 8 }}>Akses Ditolak</h1>
          <p style={{ color: "#6E6E73", fontSize: 14 }}>Silakan login untuk mengakses dashboard admin</p>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 32, background: "#fff", borderRadius: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <ShieldOff size={40} color="#8E8E93" />
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1D1D1F", marginBottom: 8 }}>Akses Admin Diperlukan</h1>
          <p style={{ color: "#6E6E73", fontSize: 14, marginBottom: 16 }}>Role saat ini: {user.role}</p>
          <button
            onClick={logout}
            style={{
              padding: "10px 24px", background: "#FF9500", color: "#fff",
              border: "none", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}
            data-testid="button-logout-access-denied"
          >
            Keluar & Login sebagai Admin
          </button>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (section) {
      case "orders": return <OrdersSection />;
      case "kitchen": return <KitchenSection />;
      case "cashier": return <CashierSection />;
      case "reservations": return <ReservationsSection />;
      case "members": return <MembersSection />;
      case "users": return <UsersSection />;
      case "menu": return <MenuSection />;
      case "categories": return <CategoriesSection />;
      case "discounts": return <DiscountsSection />;
      case "analytics": return <AnalyticsSection />;
      case "audit-reports": return <AuditReportsSection />;
      case "approvals": return <ApprovalsSection />;
      case "print-settings": return <PrintSettingsSection />;
      case "printer": return <PrinterPage />;
      case "inventory": return <InventorySection />;
      case "banners": return <BannersSection />;
      case "settings": return <SettingsSection />;
      case "drink-queue": return <DrinkQueueSection />;
      case "branches": return user.branchId === null ? <BranchesSection /> : <OrdersSection />;
      default: return <OrdersSection />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF", display: "flex" }}>
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentSection={section}
      />

      {/* Main Content — offset for tablet/desktop sidebar */}
      <div style={{ flex: 1, minWidth: 0 }} className="md:pl-16 lg:pl-[240px]">
        {/* Top Header Bar */}
        <div style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          {/* Orange gradient accent line */}
          <div style={{
            height: 3,
            background: "linear-gradient(90deg, #FFAB00, #FF9500, #FF2D55)",
          }} />
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 20px", height: 52,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Mobile hamburger */}
              <button
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
                data-testid="button-mobile-menu"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 6, borderRadius: 8,
                }}
              >
                <Menu size={20} style={{ color: "#1D1D1F" }} />
              </button>
              <div>
                <h1 style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", lineHeight: 1 }}>
                  {pageLabel}
                </h1>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {user?.role === "admin" && <NotificationBell />}
              <button
                onClick={logout}
                data-testid="button-logout"
                style={{
                  height: 32, padding: "0 14px",
                  background: "rgba(0,0,0,0.05)", border: "none",
                  borderRadius: 10, fontSize: 13, fontWeight: 500,
                  color: "#1D1D1F", cursor: "pointer",
                }}
              >
                Keluar
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ padding: "20px 20px 40px" }}>
          {renderSection()}
        </div>
      </div>

      {/* Floating reminder for scheduled orders */}
      <ScheduledOrderReminder />

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
