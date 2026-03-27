import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, BarChart3, Clock, Download, ChevronLeft, ChevronRight, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import type { Order } from "@shared/schema";

const TIME_PERIODS = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' }
];

function getPeriodLabel(period: string, offset: number): string {
  const now = new Date();
  if (period === 'daily') {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (period === 'weekly') {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - offset * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    return `${fmt(weekStart)} – ${fmt(weekEnd)} ${weekEnd.getFullYear()}`;
  }
  if (period === 'monthly') {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  return '';
}

export default function AnalyticsSection() {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showDanaTertahan, setShowDanaTertahan] = useState(false);
  const { toast } = useToast();

  const { data: rawOrders, isLoading } = useQuery<{ orders: Order[]; total: number } | Order[]>({
    queryKey: ["/api/orders?limit=9999"],
  });

  const { data: openBills = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders/open-bills"],
    refetchInterval: 30000,
  });

  const orders: Order[] = Array.isArray(rawOrders) ? rawOrders : (rawOrders?.orders ?? []);

  // Compute dana tertahan (held funds from unpaid open bills)
  const danaTertahan = useMemo(() => {
    const totalTertahan = openBills.reduce((s, b) => s + b.total, 0);
    const byCustomer: Record<string, { customerName: string; orderCount: number; total: number; oldestDate: Date }> = {};
    openBills.forEach(bill => {
      const k = bill.customerName;
      if (!byCustomer[k]) byCustomer[k] = { customerName: k, orderCount: 0, total: 0, oldestDate: new Date(bill.createdAt) };
      byCustomer[k].orderCount++;
      byCustomer[k].total += bill.total;
      const d = new Date(bill.createdAt);
      if (d < byCustomer[k].oldestDate) byCustomer[k].oldestDate = d;
    });
    const customers = Object.values(byCustomer).sort((a, b) => b.total - a.total);
    return { totalTertahan, totalOrders: openBills.length, customerCount: customers.length, customers };
  }, [openBills]);

  const analytics = calculateAnalytics(orders, selectedPeriod, periodOffset);
  const periodLabel = getPeriodLabel(selectedPeriod, periodOffset);

  const generatePDFReport = async () => {
    try {
      setIsGeneratingPdf(true);
      
      // Import autoTable function for ESM compatibility
      const { default: autoTable } = await import('jspdf-autotable');
      
      // Validate analytics data
      if (!analytics || analytics.totalOrders === 0) {
        throw new Error('No data available to generate report');
      }
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(255, 149, 0); // Ngehnoom orange
      doc.text('Ngehnoom Cafe', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Laporan Analitik Penjualan', pageWidth / 2, 35, { align: 'center' });
      
      // Period and date info
      doc.setFontSize(12);
      const currentDate = new Date().toLocaleDateString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const periodLabel = selectedPeriod === 'daily' ? 'Harian' : selectedPeriod === 'weekly' ? 'Mingguan' : 'Bulanan';
      doc.text(`Periode: ${periodLabel}`, 20, 50);
      doc.text(`Dibuat: ${currentDate}`, 20, 60);
      
      // KPI Summary
      doc.setFontSize(14);
      doc.setTextColor(255, 149, 0);
      doc.text('Indikator Kinerja Utama', 20, 80);
      
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Pendapatan: ${formatCurrency(analytics.totalRevenue)} (+${analytics.revenueGrowth}%)`, 20, 95);
      doc.text(`Total Pesanan: ${analytics.totalOrders} (+${analytics.ordersGrowth}%)`, 20, 105);
      doc.text(`Rata-rata Nilai Pesanan: ${formatCurrency(analytics.averageOrderValue)} (-${analytics.aovChange}%)`, 20, 115);
      doc.text(`Jam Puncak: ${analytics.peakHour} (${analytics.peakHourOrders} pesanan)`, 20, 125);
      
      // Menu Terlaris Table
      doc.setFontSize(14);
      doc.setTextColor(255, 149, 0);
      doc.text('Menu Terlaris', 20, 145);
      
      try {
        const topItemsData = analytics.topItems && analytics.topItems.length > 0 
          ? analytics.topItems.map((item, index) => [
              (index + 1).toString(),
              item.name || 'Unknown Item',
              (item.orders || 0).toString()
            ])
          : [['1', 'No data available', '0']];
        
        autoTable(doc, {
          startY: 155,
          head: [['Peringkat', 'Menu', 'Pesanan']],
          body: topItemsData,
          theme: 'grid',
          headStyles: { fillColor: [255, 149, 0], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 20, right: 20 },
        });
      } catch (error) {
        console.warn('Failed to generate Menu Terlaris table:', error);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('Unable to generate Menu Terlaris table', 20, 165);
      }
      
      // Daily Sales Data Table
      let finalY = (doc as any).lastAutoTable?.finalY || 200;
      doc.setFontSize(14);
      doc.setTextColor(220, 38, 38);
      doc.text('Penjualan Harian', 20, finalY + 20);
      
      try {
        const dailySalesTableData = analytics.dailySalesData && analytics.dailySalesData.length > 0
          ? analytics.dailySalesData.map(item => [
              item.date || 'N/A',
              formatCurrency(item.revenue || 0)
            ])
          : [['No data', formatCurrency(0)]];
        
        autoTable(doc, {
          startY: finalY + 30,
          head: [['Date', 'Revenue']],
          body: dailySalesTableData,
          theme: 'grid',
          headStyles: { fillColor: [255, 149, 0], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 20, right: 20 },
        });
        
        // Update finalY for next section
        finalY = (doc as any).lastAutoTable?.finalY || finalY + 80;
      } catch (error) {
        console.warn('Failed to generate Daily Sales table:', error);
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('Unable to generate Daily Sales table', 20, finalY + 40);
        finalY = finalY + 60;
      }
      
      // Hourly Orders Pattern Table
      
      // Check if we need a new page
      if (finalY > 220) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(220, 38, 38);
        doc.text('Pola Pesanan Per Jam', 20, 30);
        
        try {
          const hourlyOrdersTableData = analytics.hourlyOrdersData && analytics.hourlyOrdersData.length > 0
            ? analytics.hourlyOrdersData.map(item => [
                `${item.hour || 0}:00`,
                (item.orders || 0).toString()
              ])
            : [['No data', '0']];
          
          autoTable(doc, {
            startY: 40,
            head: [['Hour', 'Orders']],
            body: hourlyOrdersTableData,
            theme: 'grid',
            headStyles: { fillColor: [255, 149, 0], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 20, right: 20 },
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 40 }
            }
          });
        } catch (error) {
          console.warn('Failed to generate Hourly Orders table (new page):', error);
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text('Unable to generate Hourly Orders table', 20, 50);
        }
      } else {
        doc.setFontSize(14);
        doc.setTextColor(220, 38, 38);
        doc.text('Pola Pesanan Per Jam', 20, finalY + 20);
        
        try {
          const hourlyOrdersTableData = analytics.hourlyOrdersData && analytics.hourlyOrdersData.length > 0
            ? analytics.hourlyOrdersData.map(item => [
                `${item.hour || 0}:00`,
                (item.orders || 0).toString()
              ])
            : [['No data', '0']];
          
          autoTable(doc, {
            startY: finalY + 30,
            head: [['Hour', 'Orders']],
            body: hourlyOrdersTableData,
            theme: 'grid',
            headStyles: { fillColor: [255, 149, 0], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 20, right: 20 },
            columnStyles: {
              0: { cellWidth: 40 },
              1: { cellWidth: 40 }
            }
          });
        } catch (error) {
          console.warn('Failed to generate Hourly Orders table (same page):', error);
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text('Unable to generate Hourly Orders table', 20, finalY + 40);
        }
      }
      
      // Metode Pembayaran
      const finalY2 = (doc as any).lastAutoTable?.finalY || 280;
      if (finalY2 > 250) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(220, 38, 38);
        doc.text('Distribusi Metode Pembayaran', 20, 30);
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`Tunai: ${analytics.paymentMethods.cash}%`, 20, 45);
        doc.text(`QRIS: ${analytics.paymentMethods.qris}%`, 20, 55);
      } else {
        doc.setFontSize(14);
        doc.setTextColor(220, 38, 38);
        doc.text('Distribusi Metode Pembayaran', 20, finalY2 + 20);
        
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`Tunai: ${analytics.paymentMethods.cash}%`, 20, finalY2 + 35);
        doc.text(`QRIS: ${analytics.paymentMethods.qris}%`, 20, finalY2 + 45);
      }
      
      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, doc.internal.pageSize.height - 10, { align: 'right' });
        doc.text('Dibuat oleh Ngehnoom Cafe POS', 20, doc.internal.pageSize.height - 10);
      }
      
      // Save the PDF
      const filename = `ngehnoom-laporan-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast({
        title: "PDF Generated Successfully",
        description: `Laporan penjualan diunduh sebagai ${filename}`,
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Detailed error:', errorMessage);
      toast({
        title: "PDF Generation Failed",
        description: `Error: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex space-x-1 bg-muted rounded-xl p-1">
          {TIME_PERIODS.map((period) => (
            <div key={period.value} className="h-10 w-20 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="alonica-card p-4 animate-pulse">
              <div className="h-16 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period selector + navigation + download */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-3">
          {/* Period type selector */}
          <div className="flex space-x-1 bg-muted rounded-xl p-1 w-fit">
            {TIME_PERIODS.map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? "default" : "ghost"}
                onClick={() => { setSelectedPeriod(period.value); setPeriodOffset(0); }}
                className={`h-11 px-4 text-sm font-medium ${selectedPeriod === period.value ? "bg-white text-primary" : ""}`}
                data-testid={`button-period-${period.value}`}
              >
                {period.label}
              </Button>
            ))}
          </div>

          {/* Period navigation: previous / label / next */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={() => setPeriodOffset(o => o + 1)}
              data-testid="button-period-prev"
              title="Periode sebelumnya"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground min-w-[200px] text-center" data-testid="text-period-label">
              {periodLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={() => setPeriodOffset(o => Math.max(0, o - 1))}
              disabled={periodOffset === 0}
              data-testid="button-period-next"
              title="Periode berikutnya"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            {periodOffset > 0 && (
              <Button
                variant="ghost"
                className="h-11 px-4 text-sm text-primary"
                onClick={() => setPeriodOffset(0)}
                data-testid="button-period-now"
              >
                Sekarang
              </Button>
            )}
          </div>
        </div>

        <Button
          onClick={generatePDFReport}
          disabled={isGeneratingPdf || isLoading}
          className="flex items-center gap-2"
          data-testid="button-download-pdf"
        >
          <Download className="h-4 w-4" />
          {isGeneratingPdf ? 'Membuat PDF...' : 'Unduh PDF'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="alonica-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-revenue">
              {formatCurrency(analytics.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span data-testid="stat-revenue-growth">+{analytics.revenueGrowth}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="alonica-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-pesanan-analytics">
              {analytics.totalOrders}
            </div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span data-testid="stat-pesanan-growth">+{analytics.ordersGrowth}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="alonica-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Nilai Pesanan</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-avg-order-value">
              {formatCurrency(analytics.averageOrderValue)}
            </div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <TrendingDown className="h-3 w-3 mr-1" />
              <span data-testid="stat-aov-change">-{analytics.aovChange}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="alonica-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jam Puncak</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-peak-hour">
              {analytics.peakHour}
            </div>
            <p className="text-xs text-muted-foreground mt-1" data-testid="stat-peak-pesanan">
              {analytics.peakHourOrders} pesanan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dana Tertahan — Unpaid Open Bills */}
      <Card className="alonica-card border-amber-200 dark:border-amber-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Dana Tertahan (Open Bill Belum Bayar)</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="h-8 px-2"
              onClick={() => setShowDanaTertahan(v => !v)}
              data-testid="button-toggle-dana-tertahan"
            >
              {showDanaTertahan ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Total Dana Tertahan</p>
              <p className="text-xl font-bold text-amber-600" data-testid="stat-dana-tertahan-total">
                {formatCurrency(danaTertahan.totalTertahan)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jumlah Pesanan</p>
              <p className="text-xl font-bold">{danaTertahan.totalOrders}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Jumlah Pelanggan</p>
              <p className="text-xl font-bold">{danaTertahan.customerCount}</p>
            </div>
          </div>

          {showDanaTertahan && (
            <div className="mt-3 border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Rincian per Pelanggan</p>
              {danaTertahan.customers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada open bill aktif</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {danaTertahan.customers.map((c) => (
                    <div key={c.customerName} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
                      <div>
                        <p className="text-sm font-medium">{c.customerName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 py-0 px-1.5">
                            {c.orderCount} pesanan
                          </Badge>
                          <span>Sejak {c.oldestDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <p className="font-bold text-amber-600 text-sm">{formatCurrency(c.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* REAL CHARTS WITH LIVE DATA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="alonica-card">
          <CardHeader>
            <CardTitle>Tren Penjualan Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} tickFormatter={(value) => formatCurrency(value).replace('Rp. ', '')} width={60} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Pendapatan']}
                    labelFormatter={(label) => `Tanggal: ${label}`}
                  />
                  <Bar dataKey="revenue" fill="#FF9500" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="alonica-card">
          <CardHeader>
            <CardTitle>Pola Pesanan Per Jam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.hourlyOrdersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tick={{fontSize: 11}} />
                  <YAxis tick={{fontSize: 11}} />
                  <Tooltip 
                    formatter={(value) => [`${value} pesanan`, 'Pesanan']}
                    labelFormatter={(label) => `Pukul: ${label}:00`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#FF9500" 
                    strokeWidth={3}
                    dot={{ fill: '#FF9500', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="alonica-card">
          <CardHeader>
            <CardTitle>Menu Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-foreground">{item.name}</span>
                  <span className="text-sm font-medium text-primary">{item.orders} pesanan</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="alonica-card">
          <CardHeader>
            <CardTitle>Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">Tunai</span>
                <span className="text-sm font-medium text-primary">{analytics.paymentMethods.cash}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground">QRIS</span>
                <span className="text-sm font-medium text-primary">{analytics.paymentMethods.qris}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getPeriodRange(period: string, offset: number): { start: Date; end: Date } {
  const now = new Date();
  if (period === 'daily') {
    const start = new Date(now);
    start.setDate(start.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (period === 'weekly') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() - offset * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  // monthly
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function calculateAnalytics(orders: Order[], period: string, offset: number = 0) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  const { start: periodStart, end: periodEnd } = getPeriodRange(period, offset);
  const { start: prevStart, end: prevEnd } = getPeriodRange(period, offset + 1);

  const filteredOrders = safeOrders.filter(order => {
    const d = new Date(order.createdAt);
    return d >= periodStart && d <= periodEnd;
  });

  const previousPeriodOrders = safeOrders.filter(order => {
    const d = new Date(order.createdAt);
    return d >= prevStart && d <= prevEnd;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = filteredOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate previous period metrics for growth comparison
  const prevTotalRevenue = previousPeriodOrders.reduce((sum, order) => sum + order.total, 0);
  const prevTotalOrders = previousPeriodOrders.length;
  const prevAverageOrderValue = prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;

  // Calculate growth percentages
  const revenueGrowth = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue * 100) : 0;
  const ordersGrowth = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders * 100) : 0;
  const aovChange = prevAverageOrderValue > 0 ? Math.abs((averageOrderValue - prevAverageOrderValue) / prevAverageOrderValue * 100) : 0;

  // Calculate hourly distribution
  const hourlyOrders = new Array(24).fill(0);
  filteredOrders.forEach(order => {
    const hour = new Date(order.createdAt).getHours();
    hourlyOrders[hour]++;
  });

  const peakHourIndex = hourlyOrders.indexOf(Math.max(...hourlyOrders));
  const peakHour = `${peakHourIndex.toString().padStart(2, '0')}:00`;
  const peakHourOrders = hourlyOrders[peakHourIndex];

  // Calculate top items
  const itemCounts: Record<string, { name: string; orders: number }> = {};
  filteredOrders.forEach(order => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        if (itemCounts[item.name]) {
          itemCounts[item.name].orders += item.quantity;
        } else {
          itemCounts[item.name] = { name: item.name, orders: item.quantity };
        }
      });
    }
  });

  const topItems = Object.values(itemCounts)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  // Calculate payment method distribution
  const cashOrders = filteredOrders.filter(order => order.paymentMethod === 'cash').length;
  const qrisOrders = filteredOrders.filter(order => order.paymentMethod === 'qris').length;
  const total = cashOrders + qrisOrders;

  const paymentMethods = {
    cash: total > 0 ? Math.round((cashOrders / total) * 100) : 0,
    qris: total > 0 ? Math.round((qrisOrders / total) * 100) : 0
  };

  // Generate chart data for Tren Penjualan Harian
  const dailySalesData = [];
  const days = period === 'monthly' ? 30 : (period === 'weekly' ? 7 : 1);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(periodStart);
    date.setDate(periodStart.getDate() + (days - 1 - i));
    const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
    
    const dayOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.toDateString() === date.toDateString();
    });
    
    const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
    dailySalesData.push({ date: dateStr, revenue });
  }

  // Generate chart data for Hourly Orders Pattern
  const hourlyOrdersData = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourStr = hour.toString().padStart(2, '0');
    hourlyOrdersData.push({
      hour: hourStr,
      orders: hourlyOrders[hour] || 0
    });
  }

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    peakHour,
    peakHourOrders,
    topItems,
    paymentMethods,
    dailySalesData,
    hourlyOrdersData,
    // Real growth percentages based on previous period comparison
    revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    ordersGrowth: Math.round(ordersGrowth * 10) / 10,
    aovChange: Math.round(aovChange * 10) / 10
  };
}
