import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import KasirSidebar from "@/components/kasir/sidebar";
import OrdersSection from "@/pages/admin/orders";
import KitchenSection from "@/pages/admin/kitchen";
import CashierSection from "@/pages/admin/cashier";
import ReservationsSection from "@/pages/admin/reservations";
import DrinkQueueSection from "@/pages/admin/drink-queue";
import MembersSection from "@/pages/admin/members";
import UsersSection from "@/pages/admin/users";
import DiscountsSection from "@/pages/admin/discounts";
import BannersSection from "@/pages/admin/banners";
import ApprovalsSection from "@/pages/admin/approvals";
import AuditReportsSection from "@/pages/admin/audit-reports";
import AnalyticsSection from "@/pages/admin/analytics";
import InventorySection from "@/pages/admin/inventory";
import SettingsSection from "@/pages/admin/settings";
import MenuSection from "@/pages/admin/menu";
import CategoriesSection from "@/pages/admin/categories";
import ExpensesSection from "@/pages/kasir/expenses";
import DailyReportsSection from "@/pages/kasir/daily-reports";
import ShiftManagementSection from "@/pages/kasir/shift-management";
import PrinterPage from "@/pages/printer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function KasirDashboard() {
  const [location] = useLocation();
  const { user, logout, isAuthenticated, authReady } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Extract section from URL (e.g., /kasir/orders -> orders)
  const section = location.split('/kasir/')[1] || 'orders';

  // Show loading while auth is hydrating
  if (!authReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // Show access denied only after auth is ready and user is not authenticated or not kasir
  if (!isAuthenticated || !user || (user.role !== 'kasir' && user.role !== 'dapur')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="page-title mb-4">Akses Ditolak</h1>
          <p className="text-muted-foreground">
            {!isAuthenticated || !user 
              ? "Silakan login untuk mengakses dashboard kasir"
              : "Akses kasir diperlukan"
            }
          </p>
        </div>
      </div>
    );
  }

  // Compute effective allowed list (respects dapur default + allowedMenus override)
  const userAllowedMenus = (user as any)?.allowedMenus as string[] | null | undefined;
  const dapurDefault = user?.role === 'dapur' ? ['kitchen'] : null;
  const effectiveAllowed = (userAllowedMenus && userAllowedMenus.length > 0)
    ? userAllowedMenus
    : dapurDefault;

  const isSectionAllowed = (sec: string) => {
    if (!effectiveAllowed) return true; // null = all access
    return effectiveAllowed.includes(sec);
  };

  const renderSection = () => {
    // Block sections not in allowedMenus
    if (!isSectionAllowed(section)) {
      return (
        <div className="text-center py-12">
          <h2 className="section-title mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      );
    }

    switch (section) {
      // POS & Pesanan
      case 'cashier':       return <CashierSection />;
      case 'orders':        return <OrdersSection />;
      case 'drink-queue':   return <DrinkQueueSection />;
      case 'kitchen':       return <KitchenSection mode="food" />;
      case 'bar':           return <KitchenSection mode="drink" />;
      case 'reservations':  return <ReservationsSection />;
      case 'shift':         return <ShiftManagementSection />;
      case 'expenses':      return <ExpensesSection />;
      case 'daily-reports': return <DailyReportsSection />;
      // Pelanggan
      case 'members':       return <MembersSection />;
      case 'users':         return <UsersSection />;
      // Promo & Konten
      case 'discounts':     return <DiscountsSection />;
      case 'banners':       return <BannersSection />;
      // Laporan
      case 'approvals':     return <ApprovalsSection />;
      case 'audit-reports': return <AuditReportsSection />;
      case 'analytics':     return <AnalyticsSection />;
      case 'inventory':     return <InventorySection />;
      // Pengaturan
      case 'settings':      return <SettingsSection />;
      case 'menu':          return <MenuSection />;
      case 'categories':    return <CategoriesSection />;
      case 'printer':       return <PrinterPage />;
      default:              return <OrdersSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <KasirSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentSection={section}
        user={user}
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:pl-20">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="dashboard-title">Dashboard Kasir</h1>
          </div>
          <Button variant="outline" size="sm" onClick={logout} data-testid="button-logout">
            Keluar
          </Button>
        </div>
        
        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {renderSection()}
        </div>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}