import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ShoppingBag, CheckCircle, Clock, DollarSign, Eye, Receipt, Printer, Search, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, getOrderStatusColor } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { smartPrintReceipt } from "@/utils/thermal-print";
import type { Order, OrderItem } from "@shared/schema";

export default function OrdersSection() {
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hasActiveFilters = searchQuery !== "" || dateFilter !== "all" || statusFilter !== "all";

  const ordersUrl = hasActiveFilters
    ? "/api/orders"
    : `/api/orders?limit=${pageSize}&offset=${page * pageSize}`;

  const { data, isLoading, refetch } = useQuery<{ orders: Order[]; total: number } | Order[]>({
    queryKey: [ordersUrl],
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const isLegacyFormat = Array.isArray(data);
  const orders = isLegacyFormat ? data : (data?.orders || []);
  const totalOrders = isLegacyFormat ? data.length : (data?.total || 0);
  const totalPages = Math.ceil(totalOrders / pageSize);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, dateFilter, searchQuery]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Status berhasil diupdate",
        description: "Status pesanan telah diperbarui",
      });
    },
    onError: () => {
      toast({
        title: "Gagal update status",
        description: "Silakan coba lagi",
        variant: "destructive",
      });
    }
  });

  // Auto-accept all queued paid orders — no manual Terima needed
  useEffect(() => {
    const needsAccept = orders.filter(
      (o: any) => o.orderStatus === 'queued' && (o.paymentStatus === 'paid' || o.paymentMethod === 'cash')
    );
    needsAccept.forEach((o: any) => {
      apiRequest('PATCH', `/api/orders/${o.id}/status`, { status: 'preparing' })
        .then(() => queryClient.invalidateQueries({ queryKey: ['/api/orders'] }))
        .catch(() => {});
    });
  }, [orders]);


  // Calculate stats
  const today = new Date().toDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const todayOrders = orders.filter(order => 
    new Date(order.createdAt).toDateString() === today
  );
  const yesterdayOrders = orders.filter(order => 
    new Date(order.createdAt).toDateString() === yesterdayStr
  );

  const stats = {
    totalToday: todayOrders.length,
    completed: todayOrders.filter(order => order.orderStatus === 'served').length,
    pending: todayOrders.filter(order => order.orderStatus === 'queued').length,
    revenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
    revenueYesterday: yesterdayOrders.reduce((sum, order) => sum + order.total, 0),
    totalYesterday: yesterdayOrders.length,
  };

  const handleStatusUpdate = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };



  // Helper function to check if order date matches filter
  const isOrderInDateRange = (order: Order, filter: string): boolean => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    switch (filter) {
      case "today":
        return orderDate.toDateString() === today.toDateString();
      case "yesterday":
        return orderDate.toDateString() === yesterday.toDateString();
      case "7days":
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return orderDate >= sevenDaysAgo;
      case "30days":
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return orderDate >= thirtyDaysAgo;
      case "all":
      default:
        return true;
    }
  };

  // Sort and filter orders based on statusFilter, dateFilter, and search (memoized for performance)
  const filteredAndSortedOrders = useMemo(() => {
    return orders
      .filter(order => statusFilter === "all" || order.orderStatus === statusFilter)
      .filter(order => isOrderInDateRange(order, dateFilter))
      .filter(order => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          order.customerName?.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query) ||
          order.tableNumber?.toLowerCase().includes(query) ||
          (Array.isArray(order.items) && order.items.some((item: any) => item.name?.toLowerCase().includes(query)))
        );
      })
      .sort((a, b) => {
        // Sort by status priority: queued -> preparing -> ready -> served
        const statusOrder = { queued: 0, preparing: 1, ready: 2, served: 3, cancelled: 4 };
        const aOrder = statusOrder[a.orderStatus as keyof typeof statusOrder] ?? 5;
        const bOrder = statusOrder[b.orderStatus as keyof typeof statusOrder] ?? 5;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        // If same status, sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [orders, statusFilter, dateFilter, searchQuery]);

  const handlePrintReceipt = async (order: Order) => {
    await smartPrintReceipt(order);
  };

  const handleViewReceipt = (order: Order) => {
    setViewingReceipt(order);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="alonica-card p-4 animate-pulse">
              <div className="h-16 bg-muted rounded"></div>
            </div>
          ))}
        </div>
        <div className="alonica-card p-4 animate-pulse">
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pesanan</h1>
        <p className="text-sm text-muted-foreground mt-1">Lihat dan kelola semua pesanan pelanggan</p>
      </div>

      {/* KPI Cards - ShopZen Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total Pesanan Hari Ini</p>
              <p className="text-2xl font-semibold text-foreground" data-testid="stat-total-orders">
                {stats.totalToday}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>kemarin: {stats.totalYesterday} pesanan</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Antrian</p>
              <p className="text-2xl font-semibold text-foreground" data-testid="stat-pending-orders">
                {stats.pending}
              </p>
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <Clock className="h-3 w-3" />
                <span>perlu tindakan</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Selesai</p>
              <p className="text-2xl font-semibold text-foreground" data-testid="stat-completed-orders">
                {stats.completed}
              </p>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>terlayani hari ini</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Pendapatan Hari Ini</p>
              <p className="text-2xl font-semibold text-primary" data-testid="stat-revenue">
                {formatCurrency(stats.revenue)}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>kemarin: {formatCurrency(stats.revenueYesterday)}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>
      </div>


      {/* Orders Table - ShopZen Style */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Table Header with Search and Filters */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Daftar Pesanan</h2>
            <Button 
              onClick={() => refetch()}
              disabled={isLoading}
              variant="outline"
              className="gap-2 h-10"
              data-testid="button-refresh-orders"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Search Bar - Prominent */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari pesanan berdasarkan ID, nama, meja, atau item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                data-testid="input-search-orders"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="queued">Antrian</SelectItem>
                  <SelectItem value="preparing">Diproses</SelectItem>
                  <SelectItem value="ready">Siap</SelectItem>
                  <SelectItem value="served">Selesai</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]" data-testid="select-date-filter">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Waktu</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="yesterday">Kemarin</SelectItem>
                  <SelectItem value="7days">7 Hari Terakhir</SelectItem>
                  <SelectItem value="30days">30 Hari Terakhir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Order Cards */}
        <div className="divide-y divide-border">
          {filteredAndSortedOrders.map((order) => {
            const paymentLabel =
              order.paymentStatus === 'paid' ? 'Lunas' :
              order.paymentStatus === 'pending' ? 'Menunggu' :
              order.paymentStatus === 'failed' ? 'Gagal' :
              order.paymentStatus === 'expired' ? 'Kedaluwarsa' :
              order.paymentStatus === 'unpaid' ? 'Belum Bayar' :
              order.paymentStatus === 'refunded' ? 'Dikembalikan' :
              order.paymentStatus;
            const paymentColor =
              order.paymentStatus === 'paid' ? { bg: '#F0FFF4', text: '#15803D' } :
              order.paymentStatus === 'pending' ? { bg: '#FFFBEB', text: '#92400E' } :
              order.paymentStatus === 'failed' || order.paymentStatus === 'expired' ? { bg: '#FEF2F2', text: '#B91C1C' } :
              { bg: '#F5F5F7', text: '#6E6E73' };
            const itemCount = Array.isArray(order.items) ? order.items.length : 0;
            const isOnlineOrder = order.paymentMethod === 'qris';
            const isPendingPayment = isOnlineOrder && order.paymentStatus === 'pending';
            const rowBg = isPendingPayment ? "#FFFBEB" : "transparent";

            return (
              <div
                key={order.id}
                data-testid={`row-order-${order.id}`}
                style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: rowBg, borderLeft: isPendingPayment ? "3px solid #FF9500" : isOnlineOrder ? "3px solid #34C759" : "3px solid transparent" }}
              >
                {/* Left: ID + waktu */}
                <div style={{ minWidth: 90, flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1D1D1F", fontFamily: "monospace" }}>
                    #{order.id.slice(-6).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: "#8E8E93", marginTop: 2 }}>
                    {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Center: info utama */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>
                      {order.customerName}
                    </div>
                    {isOnlineOrder && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: isPendingPayment ? "#FEF3C7" : "#DCFCE7", color: isPendingPayment ? "#92400E" : "#15803D" }}>
                        {isPendingPayment ? "Menunggu Bayar" : "Online"}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#6E6E73" }}>
                      {order.orderType === 'take_away' ? 'Bawa Pulang' : `Meja ${order.tableNumber}`}
                    </span>
                    <span style={{ fontSize: 12, color: "#6E6E73" }}>•</span>
                    <button
                      onClick={() => setViewingOrder(order)}
                      style={{ fontSize: 12, color: "#FF9500", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      data-testid={`button-view-items-${order.id}`}
                    >
                      {itemCount} item
                    </button>
                    {(order as any).scheduledTime && (() => {
                      const st = new Date((order as any).scheduledTime);
                      const now = new Date();
                      const isToday = st.toDateString() === now.toDateString();
                      const isTomorrow = st.toDateString() === new Date(now.getTime() + 86400000).toDateString();
                      const dateLabel = isToday ? 'Hari ini' : isTomorrow ? 'Besok' : st.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                      const timeLabel = st.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <>
                          <span style={{ fontSize: 12, color: "#6E6E73" }}>•</span>
                          <span style={{ fontSize: 12, color: "#FF2D55", fontWeight: 600 }}>
                            Ambil: {dateLabel}, {timeLabel}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Total */}
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1D1D1F", flexShrink: 0, minWidth: 80, textAlign: "right" }}>
                  {formatCurrency(order.total)}
                </div>

                {/* Badges */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                      background: paymentColor.bg, color: paymentColor.text,
                    }}
                    data-testid={`payment-status-${order.id}`}
                  >
                    {paymentLabel}
                  </span>
                  <Badge className={getOrderStatusColor(order.orderStatus)} data-testid={`status-${order.id}`}>
                    {ORDER_STATUSES[order.orderStatus as keyof typeof ORDER_STATUSES] || order.orderStatus}
                  </Badge>
                </div>

                {/* Aksi */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {order.orderStatus === 'queued' && (order as any).paymentMethod !== 'qris' && (
                    <Button
                      onClick={() => handleStatusUpdate(order.id, 'preparing')}
                      className="bg-blue-500 hover:bg-blue-600 h-9 text-xs px-3"
                      data-testid={`button-accept-${order.id}`}
                    >
                      Terima
                    </Button>
                  )}
                  {order.orderStatus === 'preparing' && (
                    <Button
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                      className="bg-green-500 hover:bg-green-600 h-9 text-xs px-3"
                      data-testid={`button-ready-${order.id}`}
                    >
                      Siap
                    </Button>
                  )}
                  {order.orderStatus === 'ready' && (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate(order.id, 'served')}
                      className="h-9 text-xs px-3"
                      data-testid={`button-complete-${order.id}`}
                    >
                      Selesai
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setViewingOrder(order)}
                    className="h-9 w-9 p-0"
                    data-testid={`button-view-${order.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePrintReceipt(order)}
                    className="bg-green-50 hover:bg-green-100 text-green-700 h-9 w-9 p-0"
                    data-testid={`button-receipt-${order.id}`}
                  >
                    <Receipt className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAndSortedOrders.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm" data-testid="text-no-orders">
              {orders.length === 0 ? "Belum ada pesanan" : "Tidak ada pesanan dengan filter ini"}
            </p>
          </div>
        )}

        {/* Pagination Controls - Only show when no filters active */}
        {!hasActiveFilters && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/50">
            <div className="text-sm text-muted-foreground">
              Menampilkan {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalOrders)} dari {totalOrders} pesanan
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="h-10 gap-1"
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </Button>
              <div className="text-sm text-muted-foreground">
                Hal. {page + 1} dari {totalPages || 1}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="h-10 gap-1"
                data-testid="button-next-page"
              >
                Berikutnya
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {hasActiveFilters && (
          <div className="px-6 py-4 border-t border-border bg-muted/50">
            <div className="text-sm text-muted-foreground text-center">
              Menampilkan {filteredAndSortedOrders.length} pesanan sesuai filter
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
        <DialogContent className="max-w-2xl" data-testid="modal-order-details">
          <DialogHeader>
            <DialogTitle>
              Detail Pesanan — #{viewingOrder?.id.slice(-6).toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Lihat detail lengkap pesanan termasuk items, info pembayaran dan timeline.
            </DialogDescription>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-6">
              {/* Customer & Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Pelanggan</h3>
                  <p className="text-lg font-medium" data-testid="order-detail-customer">{viewingOrder.customerName}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Meja</h3>
                  <p className="text-lg font-medium" data-testid="order-detail-table">{viewingOrder.tableNumber}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Status</h3>
                  <Badge className={getOrderStatusColor(viewingOrder.orderStatus)} data-testid="order-detail-status">
                    {ORDER_STATUSES[viewingOrder.orderStatus as keyof typeof ORDER_STATUSES] || viewingOrder.orderStatus}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Pembayaran</h3>
                  <p className="text-lg font-medium" data-testid="order-detail-payment">
                    {viewingOrder.paymentMethod === 'qris' ? 'QRIS' : viewingOrder.paymentMethod === 'cash' ? 'Tunai' : viewingOrder.paymentMethod.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-3">Item Dipesan</h3>
                <div className="space-y-3">
                  {Array.isArray(viewingOrder.items) ? viewingOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg" data-testid={`order-item-${index}`}>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">Jumlah: {item.quantity}</p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground italic">Catatan: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(item.price)}</p>
                        <p className="text-sm text-muted-foreground">x {item.quantity}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground">Tidak ada item</p>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span data-testid="order-detail-subtotal">{formatCurrency(viewingOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diskon:</span>
                    <span data-testid="order-detail-discount">{formatCurrency(viewingOrder.discount)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span data-testid="order-detail-total">{formatCurrency(viewingOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-sm text-muted-foreground border-t pt-4">
                <p>Dipesan: {formatDate(new Date(viewingOrder.createdAt))}</p>
                <p>Diperbarui: {formatDate(new Date(viewingOrder.updatedAt))}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={!!viewingReceipt} onOpenChange={() => setViewingReceipt(null)}>
        <DialogContent className="max-w-md print:max-w-none print:shadow-none">
          <DialogHeader className="print-hide">
            <DialogTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Struk - #{viewingReceipt?.id.slice(-6).toUpperCase()}</span>
            </DialogTitle>
            <DialogDescription>
              Struk pesanan yang bisa dicetak dengan thermal printer.
            </DialogDescription>
          </DialogHeader>
          
          {viewingReceipt && (
            <div className="customer-receipt space-y-4 print:text-black print:bg-white">
              {/* Restaurant Header */}
              <div className="text-center border-b pb-4">
                <h2 className="font-playfair text-xl font-bold">Alonica Restaurant</h2>
                <p className="text-sm text-muted-foreground">
                  Jl. Ratulangi No.14, Bantaeng<br />
                  Telp: 0515-4545
                </p>
              </div>
              
              {/* Order Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{formatDate(new Date(viewingReceipt.createdAt))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{new Date(viewingReceipt.createdAt).toLocaleTimeString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{viewingReceipt.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Meja:</span>
                  <span>{viewingReceipt.tableNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>No. Pesanan:</span>
                  <span className="text-xs">#{viewingReceipt.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
              
              {/* Items */}
              <div className="border-t border-b py-4">
                <h3 className="font-semibold mb-3">Detail Pesanan:</h3>
                <div className="space-y-2">
                  {(Array.isArray(viewingReceipt.items) ? viewingReceipt.items : []).map((item: any, index: number) => (
                    <div key={index} className="receipt-item text-sm">
                      <div className="receipt-item-name">
                        <p className="font-medium">{item?.name || 'N/A'}</p>
                        <p className="text-muted-foreground">
                          {item.quantity}x {formatCurrency(item.price)}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="receipt-item-price">
                        {formatCurrency((item.price || 0) * (item.quantity || 1))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Total */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(viewingReceipt.subtotal || 0)}</span>
                </div>
                {(viewingReceipt.discount || 0) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon:</span>
                    <span>-{formatCurrency(viewingReceipt.discount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(viewingReceipt.total)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="text-center space-y-2">
                <div>
                  <p className="text-muted-foreground text-sm">Metode Pembayaran</p>
                  <p className="font-medium capitalize">
                    {viewingReceipt.paymentMethod === 'qris' ? 'QRIS' : 'Tunai'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Status</p>
                  <p className="font-medium text-primary capitalize">
                    {ORDER_STATUSES[viewingReceipt.orderStatus as keyof typeof ORDER_STATUSES] || viewingReceipt.orderStatus}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  Terima kasih telah berkunjung!
                </p>
                <p className="text-xs text-muted-foreground">
                  Alonica Restaurant - Cita Rasa Nusantara
                </p>
              </div>
            </div>
          )}
          
          {/* Print Button */}
          <div className="mt-4 print-hide">
            <Button
              onClick={async () => await smartPrintReceipt(viewingReceipt)}
              className="w-full flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Cetak Struk
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
