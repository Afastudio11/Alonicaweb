import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Save, Eye, TrendingUp, DollarSign, ChevronLeft, ChevronRight, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { insertDailyReportSchema, type DailyReport } from "@shared/schema";

const dailyReportFormSchema = insertDailyReportSchema.extend({
  reportDate: z.coerce.date()
});

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatDateShort(d: string | Date) {
  return new Date(d).toLocaleDateString("id-ID", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}

// ─── ADMIN VIEW ───────────────────────────────────────────────────────────────
function AdminDailyReports() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kasirFilter, setKasirFilter] = useState("all");
  const PAGE_SIZE = 20;

  const { data: usersRaw = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });
  const users: any[] = Array.isArray(usersRaw) ? usersRaw : [];
  const kasirUsers = users.filter((u: any) => u.role === "kasir" || u.role === "admin");

  const { data: reportsData, isLoading } = useQuery<{ reports: DailyReport[]; total: number; totalPages: number }>({
    queryKey: ["/api/daily-reports", page, PAGE_SIZE, kasirFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      const res = await fetch(`/api/daily-reports?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Gagal mengambil laporan");
      return res.json();
    },
  });

  const allReports: DailyReport[] = reportsData?.reports ?? [];
  const total = reportsData?.total ?? 0;
  const totalPages = reportsData?.totalPages ?? 1;

  const getUserName = (cashierId: string) => {
    const u = users.find((u: any) => u.id === cashierId);
    return u ? (u.name || u.username) : cashierId;
  };

  const filtered = allReports.filter(r => {
    const matchKasir = kasirFilter === "all" || r.cashierId === kasirFilter;
    const matchSearch = search === "" ||
      getUserName(r.cashierId).toLowerCase().includes(search.toLowerCase()) ||
      formatDateShort(r.reportDate).includes(search);
    return matchKasir && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Laporan Harian Kasir</h1>
        <p className="text-sm text-muted-foreground">{total} total laporan</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama kasir atau tanggal..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-reports"
          />
        </div>
        <Select value={kasirFilter} onValueChange={v => { setKasirFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-56" data-testid="select-kasir-filter">
            <SelectValue placeholder="Semua kasir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kasir</SelectItem>
            {kasirUsers.map((u: any) => (
              <SelectItem key={u.id} value={u.id}>{u.name || u.username}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Tidak ada laporan ditemukan</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(report => (
            <Card key={report.id} data-testid={`report-card-${report.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{getUserName(report.cashierId)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateShort(report.reportDate)}</p>
                      {report.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">"{report.notes}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm ml-12 sm:ml-0">
                    <div className="text-center">
                      <p className="font-semibold text-green-600">{formatCurrency(report.totalRevenue)}</p>
                      <p className="text-xs text-muted-foreground">Total Pendapatan</p>
                    </div>
                    <Separator orientation="vertical" className="h-8 hidden sm:block" />
                    <div className="text-center">
                      <p className="font-medium">{formatCurrency(report.totalRevenueCash)}</p>
                      <p className="text-xs text-muted-foreground">Tunai</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{formatCurrency(report.totalRevenueNonCash)}</p>
                      <p className="text-xs text-muted-foreground">Non-Tunai</p>
                    </div>
                    <Separator orientation="vertical" className="h-8 hidden sm:block" />
                    <div className="text-center">
                      <p className="font-medium">{report.totalOrders} pesanan</p>
                      <p className="text-xs text-muted-foreground">Transaksi</p>
                    </div>
                    <div className="text-center">
                      <Badge variant={report.cashDifference >= 0 ? "default" : "destructive"}>
                        {report.cashDifference >= 0 ? "+" : ""}{formatCurrency(report.cashDifference)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Selisih Kas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages} ({total} laporan)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{page}</span>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KASIR VIEW ───────────────────────────────────────────────────────────────
export default function DailyReportsSection() {
  const { user } = useAuth();

  if ((user as any)?.role === "admin") return <AdminDailyReports />;

  return <KasirDailyReports />;
}

function KasirDailyReports() {
  const [selectedDate] = useState(new Date().toISOString().split("T")[0]);
  const { toast } = useToast();
  const { createErrorHandler } = useErrorHandler();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof dailyReportFormSchema>>({
    resolver: zodResolver(dailyReportFormSchema),
    defaultValues: {
      reportDate: new Date(),
      cashierId: user?.id || "",
      totalRevenueCash: 0,
      totalRevenueNonCash: 0,
      totalRevenue: 0,
      physicalCashAmount: 0,
      cashDifference: 0,
      totalOrders: 0,
      cashOrders: 0,
      nonCashOrders: 0,
      notes: ""
    }
  });

  const { data: reportsData, isLoading } = useQuery<{ reports: DailyReport[]; total: number } | DailyReport[]>({
    queryKey: ["/api/daily-reports"],
  });

  const reports: DailyReport[] = Array.isArray(reportsData)
    ? reportsData
    : (reportsData as any)?.reports ?? [];

  const todayReport = reports.find(report => {
    return new Date(report.reportDate).toDateString() === new Date().toDateString();
  });

  const submitReportMutation = useMutation({
    mutationFn: async (data: z.infer<typeof dailyReportFormSchema>) => {
      const formData = {
        ...data,
        totalRevenue: (data.totalRevenueCash || 0) + (data.totalRevenueNonCash || 0),
        cashDifference: (data.physicalCashAmount || 0) - (data.totalRevenueCash || 0),
        totalOrders: (data.cashOrders || 0) + (data.nonCashOrders || 0),
        cashierId: user?.id || ""
      };
      if (todayReport) {
        const response = await apiRequest("PUT", `/api/daily-reports/${todayReport.id}`, formData);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/daily-reports", formData);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-reports"] });
      toast({ title: "Laporan berhasil disimpan", description: "Laporan harian telah disimpan" });
    },
    onError: createErrorHandler("Gagal menyimpan laporan harian")
  });

  const totalRevenueCash = form.watch("totalRevenueCash") || 0;
  const totalRevenueNonCash = form.watch("totalRevenueNonCash") || 0;
  const physicalCashAmount = form.watch("physicalCashAmount") || 0;
  const cashOrders = form.watch("cashOrders") || 0;
  const nonCashOrders = form.watch("nonCashOrders") || 0;
  const totalRevenue = totalRevenueCash + totalRevenueNonCash;
  const cashDifference = physicalCashAmount - totalRevenueCash;
  const totalOrders = cashOrders + nonCashOrders;

  useEffect(() => {
    if (todayReport) {
      form.reset({
        reportDate: new Date(todayReport.reportDate),
        cashierId: todayReport.cashierId,
        totalRevenueCash: todayReport.totalRevenueCash,
        totalRevenueNonCash: todayReport.totalRevenueNonCash,
        totalRevenue: todayReport.totalRevenue,
        physicalCashAmount: todayReport.physicalCashAmount,
        cashDifference: todayReport.cashDifference,
        totalOrders: todayReport.totalOrders,
        cashOrders: todayReport.cashOrders,
        nonCashOrders: todayReport.nonCashOrders,
        notes: todayReport.notes || ""
      });
    } else if (user?.id) {
      form.reset({
        reportDate: new Date(),
        cashierId: user.id,
        totalRevenueCash: 0,
        totalRevenueNonCash: 0,
        totalRevenue: 0,
        physicalCashAmount: 0,
        cashDifference: 0,
        totalOrders: 0,
        cashOrders: 0,
        nonCashOrders: 0,
        notes: ""
      });
    }
  }, [todayReport, user?.id, form]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" data-testid="text-daily-reports-title">
          Laporan Harian Kasir
        </h1>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pendapatan</p>
                <p className="text-2xl font-bold" data-testid="text-total-revenue">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tunai: {formatCurrency(totalRevenueCash)} | Non-Tunai: {formatCurrency(totalRevenueNonCash)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kas Fisik</p>
                <p className="text-2xl font-bold" data-testid="text-physical-cash">{formatCurrency(physicalCashAmount)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Pesanan: {totalOrders}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selisih Kas</p>
                <p className={`text-2xl font-bold ${cashDifference >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-cash-difference">
                  {cashDifference >= 0 ? "+" : ""}{formatCurrency(cashDifference)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Fisik - Tercatat</p>
              </div>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${cashDifference >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                <DollarSign className={`h-5 w-5 ${cashDifference >= 0 ? "text-green-600" : "text-red-600"}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Report Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {todayReport ? "Edit Laporan Hari Ini" : "Buat Laporan Harian"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(d => submitReportMutation.mutate(d))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="totalRevenueCash" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pendapatan Tunai (IDR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} placeholder="0" data-testid="input-cash-revenue" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="totalRevenueNonCash" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pendapatan Non-Tunai (IDR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} placeholder="0" data-testid="input-noncash-revenue" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="physicalCashAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kas Fisik yang Dihitung (IDR)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} placeholder="0" data-testid="input-physical-cash" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Selisih Kas</label>
                  <div className={`p-3 rounded-md border ${cashDifference === 0 ? "bg-gray-50 border-gray-200" : cashDifference > 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <span className={`font-semibold ${cashDifference === 0 ? "text-gray-600" : cashDifference > 0 ? "text-green-600" : "text-red-600"}`} data-testid="display-cash-difference">
                      {cashDifference >= 0 ? "+" : ""}{formatCurrency(cashDifference)}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">Kas Fisik - Pendapatan Tunai</p>
                  </div>
                </div>
                <FormField control={form.control} name="cashOrders" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Pesanan Tunai</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} placeholder="0" data-testid="input-cash-orders" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nonCashOrders" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Pesanan Non-Tunai</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} placeholder="0" data-testid="input-noncash-orders" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (opsional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Catatan tentang shift hari ini, masalah yang terjadi, dll." rows={4} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex justify-end">
                <Button type="submit" disabled={submitReportMutation.isPending} data-testid="button-submit-report">
                  {submitReportMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Menyimpan...
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {todayReport ? "Update Laporan" : "Simpan Laporan"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      {reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Laporan Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.slice(0, 10).map(report => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`report-item-${report.id}`}>
                  <div>
                    <p className="font-medium">{formatDateShort(report.reportDate)}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: {formatCurrency(report.totalRevenue)} ({report.totalOrders} pesanan)
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={report.cashDifference >= 0 ? "default" : "destructive"}>
                      {report.cashDifference >= 0 ? "+" : ""}{formatCurrency(report.cashDifference)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Selisih kas</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
