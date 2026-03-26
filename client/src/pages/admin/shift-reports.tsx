import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileBarChart2, Search, ChevronLeft, ChevronRight, Eye, Download, Calendar, User, Building2, DollarSign, Utensils, Coffee, FileText, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { generateShiftPDF } from "@/utils/shift-pdf";
import { useToast } from "@/hooks/use-toast";
import type { ShiftReport } from "@shared/schema";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleString("id-ID", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDateOnly(d: string) {
  if (!d) return "-";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function getDiffColor(diff: number) {
  if (diff === 0) return "text-foreground";
  if (diff > 0) return "text-green-600";
  return "text-red-600";
}

interface RecapData {
  makanan: { name: string; qty: number; total: number }[];
  minuman: { name: string; qty: number; total: number }[];
  openBill: { name: string; qty: number; total: number }[];
}

export default function ShiftReportsSection() {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingReport, setViewingReport] = useState<ShiftReport | null>(null);

  const { data, isLoading } = useQuery<{ reports: ShiftReport[]; total: number }>({
    queryKey: ["/api/shift-reports", page, pageSize],
    queryFn: async () => {
      const res = await fetch(`/api/shift-reports?limit=${pageSize}&offset=${page * pageSize}`, { credentials: "include" });
      if (!res.ok) throw new Error("Gagal mengambil laporan shift");
      return res.json();
    },
  });

  const reports = data?.reports ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const filtered = reports.filter(r =>
    searchQuery === "" ||
    r.kasirName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.branchName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reportDate.includes(searchQuery)
  );

  const handleDownload = (report: ShiftReport) => {
    try {
      const recap = report.recapData as RecapData | null;
      const ok = generateShiftPDF(report, recap);
      if (!ok) {
        toast({ title: "Gagal Unduh PDF", description: "Terjadi kesalahan saat membuat PDF. Coba lagi.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Gagal Unduh PDF", description: "Terjadi kesalahan saat membuat PDF. Coba lagi.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan Shift Kasir</h1>
          <p className="text-muted-foreground">Semua laporan shift yang dikirimkan oleh kasir dari seluruh cabang</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {total} Laporan
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari kasir, cabang, tanggal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-shift-reports"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileBarChart2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Belum ada laporan shift</p>
            <p className="text-sm text-muted-foreground mt-1">Laporan akan muncul setelah kasir menutup shift dan mengirimkan laporan</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {filtered.map((report) => {
              const diff = report.cashDifference ?? 0;
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow" data-testid={`card-shift-report-${report.id}`}>
                  <CardContent className="pt-5 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Left: info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs font-normal">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDateOnly(report.reportDate)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs font-normal">
                            <User className="h-3 w-3 mr-1" />
                            {report.kasirName}
                          </Badge>
                          {report.branchName && (
                            <Badge variant="outline" className="text-xs font-normal text-blue-600 border-blue-200">
                              <Building2 className="h-3 w-3 mr-1" />
                              {report.branchName}
                            </Badge>
                          )}
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                            Terkirim
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Total Terbayar</p>
                            <p className="font-semibold text-green-600">{formatCurrency(report.totalPaid ?? 0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Makanan</p>
                            <p className="font-medium">{formatCurrency(report.totalMakanan ?? 0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Minuman</p>
                            <p className="font-medium">{formatCurrency(report.totalMinuman ?? 0)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Selisih Kas</p>
                            <p className={`font-semibold ${getDiffColor(diff)}`}>
                              {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Shift: {formatDate(report.shiftStart)} — {formatDate(report.shiftEnd)} · {report.totalOrders ?? 0} transaksi
                        </p>
                      </div>

                      {/* Right: actions */}
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingReport(report)}
                          data-testid={`button-view-report-${report.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(report)}
                          data-testid={`button-download-report-${report.id}`}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{total} laporan total</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} data-testid="button-prev-page">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">{page + 1} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} data-testid="button-next-page">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!viewingReport} onOpenChange={() => setViewingReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileBarChart2 className="h-5 w-5" />
              Detail Laporan Shift
            </DialogTitle>
          </DialogHeader>
          {viewingReport && (
            <div className="space-y-5">
              {/* Header info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-muted-foreground text-xs">Kasir</p><p className="font-semibold">{viewingReport.kasirName}</p></div>
                <div><p className="text-muted-foreground text-xs">Cabang</p><p className="font-semibold">{viewingReport.branchName || "-"}</p></div>
                <div><p className="text-muted-foreground text-xs">Tanggal</p><p className="font-semibold">{formatDateOnly(viewingReport.reportDate)}</p></div>
                <div><p className="text-muted-foreground text-xs">Dikirim</p><p className="font-semibold">{formatDate(viewingReport.sentAt)}</p></div>
                <div><p className="text-muted-foreground text-xs">Mulai Shift</p><p className="font-semibold">{formatDate(viewingReport.shiftStart)}</p></div>
                <div><p className="text-muted-foreground text-xs">Selesai Shift</p><p className="font-semibold">{formatDate(viewingReport.shiftEnd)}</p></div>
              </div>

              <Separator />

              {/* Summary boxes */}
              <div>
                <p className="text-sm font-semibold mb-3">Ringkasan Transaksi</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total Terbayar</p>
                    <p className="font-bold text-green-600 text-lg">{formatCurrency(viewingReport.totalPaid ?? 0)}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Makanan</p>
                    <p className="font-bold text-orange-600">{formatCurrency(viewingReport.totalMakanan ?? 0)}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Minuman</p>
                    <p className="font-bold text-blue-600">{formatCurrency(viewingReport.totalMinuman ?? 0)}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Open Bill Pending</p>
                    <p className="font-bold text-yellow-600">{formatCurrency(viewingReport.totalOpenBillPending ?? 0)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Total Transaksi</p>
                    <p className="font-bold">{viewingReport.totalOrders ?? 0} transaksi</p>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${(viewingReport.cashDifference ?? 0) === 0 ? 'bg-muted/50' : (viewingReport.cashDifference ?? 0) > 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                    <p className="text-xs text-muted-foreground">Selisih Kas</p>
                    <p className={`font-bold ${getDiffColor(viewingReport.cashDifference ?? 0)}`}>
                      {(viewingReport.cashDifference ?? 0) >= 0 ? "+" : ""}{formatCurrency(viewingReport.cashDifference ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Kas detail */}
              <div>
                <p className="text-sm font-semibold mb-3">Rincian Kas</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">Kas Awal</p><p className="font-medium">{formatCurrency(viewingReport.initialCash ?? 0)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Kas Tercatat</p><p className="font-medium">{formatCurrency(viewingReport.systemCash ?? 0)}</p></div>
                  <div><p className="text-muted-foreground text-xs">Kas Fisik</p><p className="font-medium">{formatCurrency(viewingReport.finalCash ?? 0)}</p></div>
                </div>
                {viewingReport.notes && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Catatan Kasir</p>
                    <p className="text-sm">{viewingReport.notes}</p>
                  </div>
                )}
              </div>

              {/* Item breakdown if available */}
              {viewingReport.recapData && (() => {
                const recap = viewingReport.recapData as RecapData;
                return (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      {(recap.makanan?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-1 mb-2">
                            <Utensils className="h-4 w-4 text-orange-500" /> Makanan
                          </p>
                          <div className="rounded-lg border divide-y text-sm">
                            {recap.makanan.map((item) => (
                              <div key={item.name} className="flex justify-between px-3 py-2">
                                <span>{item.name}</span>
                                <span className="text-muted-foreground">{item.qty}x — {formatCurrency(item.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {(recap.minuman?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-1 mb-2">
                            <Coffee className="h-4 w-4 text-blue-500" /> Minuman
                          </p>
                          <div className="rounded-lg border divide-y text-sm">
                            {recap.minuman.map((item) => (
                              <div key={item.name} className="flex justify-between px-3 py-2">
                                <span>{item.name}</span>
                                <span className="text-muted-foreground">{item.qty}x — {formatCurrency(item.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {(recap.openBill?.length ?? 0) > 0 && (
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-1 mb-2">
                            <FileText className="h-4 w-4 text-yellow-500" /> Open Bill Pending
                          </p>
                          <div className="rounded-lg border divide-y text-sm">
                            {recap.openBill.map((item) => (
                              <div key={item.name} className="flex justify-between px-3 py-2">
                                <span>{item.name}</span>
                                <span className="text-yellow-600">{item.qty}x — {formatCurrency(item.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              <Separator />
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  handleDownload(viewingReport);
                }}
                data-testid="button-download-from-dialog"
              >
                <Download className="h-4 w-4 mr-2" />
                Unduh PDF Laporan Ini
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
