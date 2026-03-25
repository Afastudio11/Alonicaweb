import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Clock, DollarSign, TrendingUp, TrendingDown, User, AlertCircle, BarChart2, Utensils, Coffee, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import type { Shift } from "@shared/schema";

interface ItemSummary { name: string; qty: number; total: number; }
interface ShiftRecap {
  shift: Shift;
  makanan: ItemSummary[];
  minuman: ItemSummary[];
  openBill: ItemSummary[];
  summary: {
    totalOrders: number;
    totalPaid: number;
    totalMakanan: number;
    totalMinuman: number;
    totalOpenBillPending: number;
    totalItems: number;
  };
}

export default function ShiftManagementSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [initialCash, setInitialCash] = useState(0);
  const [finalCash, setFinalCash] = useState(0);
  const [notes, setNotes] = useState("");
  const [cashIn, setCashIn] = useState(0);
  const [cashOut, setCashOut] = useState(0);
  const [cashDescription, setCashDescription] = useState("");
  const [showRecap, setShowRecap] = useState(false);
  const [recapSection, setRecapSection] = useState<'makanan' | 'minuman' | 'openBill' | null>(null);

  const { data: activeShift, isLoading: loadingShift } = useQuery<Shift | null>({
    queryKey: ['/api/shifts/active'],
    retry: false
  });

  const { data: recap, isLoading: loadingRecap } = useQuery<ShiftRecap>({
    queryKey: ['/api/shifts', activeShift?.id, 'recap'],
    enabled: !!activeShift?.id && showRecap,
  });

  const openShiftMutation = useMutation({
    mutationFn: async (data: { initialCash: number }) => {
      const response = await apiRequest('POST', '/api/shifts', { initialCash: data.initialCash });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Shift Dibuka", description: "Shift berhasil dibuka. Anda dapat mulai melayani pelanggan." });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts/active'] });
      setInitialCash(0);
    },
    onError: (error: any) => {
      toast({ title: "Gagal Membuka Shift", description: error.message || "Terjadi kesalahan saat membuka shift", variant: "destructive" });
    }
  });

  const closeShiftMutation = useMutation({
    mutationFn: async (data: { finalCash: number; notes?: string }) => {
      if (!activeShift?.id) throw new Error("No active shift");
      const response = await apiRequest('PUT', `/api/shifts/${activeShift.id}/close`, { finalCash: data.finalCash, notes: data.notes });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Shift Ditutup", description: "Shift berhasil ditutup. Laporan shift telah disimpan." });
      queryClient.invalidateQueries({ queryKey: ['/api/shifts/active'] });
      setFinalCash(0);
      setNotes("");
      setShowRecap(false);
    },
    onError: (error: any) => {
      toast({ title: "Gagal Menutup Shift", description: error.message || "Terjadi kesalahan saat menutup shift", variant: "destructive" });
    }
  });

  const cashMovementMutation = useMutation({
    mutationFn: async (data: { type: 'in' | 'out'; amount: number; description: string }) => {
      if (!activeShift?.id) throw new Error("No active shift");
      const response = await apiRequest('POST', '/api/cash-movements', {
        shiftId: activeShift.id,
        cashierId: user?.id,
        type: data.type,
        amount: data.amount,
        description: data.description,
        category: data.type === 'in' ? 'deposit' : 'expense'
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.type === 'in' ? "Kas Masuk Dicatat" : "Kas Keluar Dicatat",
        description: `Transaksi kas ${variables.type === 'in' ? 'masuk' : 'keluar'} berhasil dicatat`
      });
      setCashIn(0);
      setCashOut(0);
      setCashDescription("");
      queryClient.invalidateQueries({ queryKey: ['/api/cash-movements'] });
    },
    onError: (error: any) => {
      toast({ title: "Gagal Mencatat Kas", description: error.message || "Terjadi kesalahan saat mencatat transaksi kas", variant: "destructive" });
    }
  });

  const handleOpenShift = () => {
    if (isNaN(initialCash) || initialCash < 0) {
      toast({ title: "Input Tidak Valid", description: "Masukkan jumlah kas awal yang valid", variant: "destructive" });
      return;
    }
    openShiftMutation.mutate({ initialCash });
  };

  const handleCloseShift = () => {
    if (isNaN(finalCash) || finalCash < 0) {
      toast({ title: "Input Tidak Valid", description: "Masukkan jumlah kas akhir yang valid", variant: "destructive" });
      return;
    }
    closeShiftMutation.mutate({ finalCash, notes: notes || undefined });
  };

  const handleCashMovement = (type: 'in' | 'out') => {
    const amount = type === 'in' ? cashIn : cashOut;
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Input Tidak Valid", description: "Masukkan jumlah kas yang valid", variant: "destructive" });
      return;
    }
    if (!cashDescription.trim()) {
      toast({ title: "Input Tidak Valid", description: "Masukkan deskripsi transaksi kas", variant: "destructive" });
      return;
    }
    cashMovementMutation.mutate({ type, amount, description: cashDescription });
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const calculateCashDifference = () => {
    if (!activeShift || !finalCash) return 0;
    return finalCash - (activeShift.systemCash || activeShift.initialCash || 0);
  };

  if (loadingShift) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Shift</h1>
          <p className="text-muted-foreground">Kelola sesi kerja dan pencatatan kas</p>
        </div>
        <Badge variant={activeShift ? "default" : "secondary"} className="text-sm">
          {activeShift ? "Shift Aktif" : "Tidak Ada Shift"}
        </Badge>
      </div>

      {!activeShift ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Buka Shift Baru
            </CardTitle>
            <CardDescription>Mulai sesi kerja baru dengan mencatat kas awal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initial-cash">Kas Awal (Rp)</Label>
              <CurrencyInput id="initial-cash" value={initialCash} onValueChange={setInitialCash} data-testid="input-initial-cash" />
            </div>
            <Button onClick={handleOpenShift} disabled={openShiftMutation.isPending} className="w-full" data-testid="button-open-shift">
              {openShiftMutation.isPending ? "Membuka..." : "Buka Shift"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Shift Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Shift Aktif
              </CardTitle>
              <CardDescription>ID Sesi: {activeShift.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Mulai Shift</p>
                  <p className="font-medium">{formatTime(activeShift.startTime)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kasir</p>
                  <p className="font-medium">{user?.username}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kas Awal</p>
                  <p className="font-medium">{formatCurrency(activeShift.initialCash || 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="default">Aktif</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cash Movements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Kas Masuk/Keluar
              </CardTitle>
              <CardDescription>Catat setoran awal dan pengeluaran dadakan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cash-description">Deskripsi</Label>
                <Input
                  id="cash-description"
                  placeholder="Deskripsi transaksi"
                  value={cashDescription}
                  onChange={(e) => setCashDescription(e.target.value)}
                  data-testid="input-cash-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cash-in">Kas Masuk (Rp)</Label>
                  <CurrencyInput id="cash-in" value={cashIn} onValueChange={setCashIn} data-testid="input-cash-in" />
                  <Button size="sm" onClick={() => handleCashMovement('in')} disabled={cashMovementMutation.isPending} className="w-full" data-testid="button-cash-in">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Catat
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cash-out">Kas Keluar (Rp)</Label>
                  <CurrencyInput id="cash-out" value={cashOut} onValueChange={setCashOut} data-testid="input-cash-out" />
                  <Button size="sm" variant="outline" onClick={() => handleCashMovement('out')} disabled={cashMovementMutation.isPending} className="w-full" data-testid="button-cash-out">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    Catat
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shift Recap */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    Rekap Barang Keluar Shift Ini
                  </CardTitle>
                  <CardDescription>
                    Ringkasan produk yang terjual selama shift — dipisah per kategori
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecap(!showRecap)}
                  data-testid="button-toggle-recap"
                >
                  {showRecap ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                  {showRecap ? "Sembunyikan" : "Tampilkan Rekap"}
                </Button>
              </div>
            </CardHeader>

            {showRecap && (
              <CardContent className="space-y-4">
                {loadingRecap ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : recap ? (
                  <>
                    {/* Summary row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Terbayar</p>
                        <p className="font-semibold text-green-600">{formatCurrency(recap.summary.totalPaid)}</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Makanan</p>
                        <p className="font-semibold text-orange-600">{formatCurrency(recap.summary.totalMakanan)}</p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Minuman</p>
                        <p className="font-semibold text-blue-600">{formatCurrency(recap.summary.totalMinuman)}</p>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Open Bill Pending</p>
                        <p className="font-semibold text-yellow-600">{formatCurrency(recap.summary.totalOpenBillPending)}</p>
                        {recap.summary.totalOpenBillPending > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">belum dibayar</p>
                        )}
                      </div>
                    </div>

                    {/* Makanan items */}
                    {recap.makanan.length > 0 && (
                      <div>
                        <button
                          className="flex items-center gap-2 w-full text-left font-medium text-sm py-2"
                          onClick={() => setRecapSection(recapSection === 'makanan' ? null : 'makanan')}
                          data-testid="button-toggle-makanan"
                        >
                          <Utensils className="h-4 w-4 text-orange-500" />
                          Makanan ({recap.makanan.length} item)
                          {recapSection === 'makanan' ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                        </button>
                        {recapSection === 'makanan' && (
                          <div className="mt-1 rounded-lg border divide-y">
                            {recap.makanan.map((item) => (
                              <div key={item.name} className="flex items-center justify-between px-3 py-2 text-sm" data-testid={`recap-makanan-${item.name}`}>
                                <span className="text-foreground">{item.name}</span>
                                <div className="flex items-center gap-4 text-right">
                                  <span className="text-muted-foreground">{item.qty}x</span>
                                  <span className="font-medium">{formatCurrency(item.total)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Minuman items */}
                    {recap.minuman.length > 0 && (
                      <div>
                        <button
                          className="flex items-center gap-2 w-full text-left font-medium text-sm py-2"
                          onClick={() => setRecapSection(recapSection === 'minuman' ? null : 'minuman')}
                          data-testid="button-toggle-minuman"
                        >
                          <Coffee className="h-4 w-4 text-blue-500" />
                          Minuman ({recap.minuman.length} item)
                          {recapSection === 'minuman' ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                        </button>
                        {recapSection === 'minuman' && (
                          <div className="mt-1 rounded-lg border divide-y">
                            {recap.minuman.map((item) => (
                              <div key={item.name} className="flex items-center justify-between px-3 py-2 text-sm" data-testid={`recap-minuman-${item.name}`}>
                                <span className="text-foreground">{item.name}</span>
                                <div className="flex items-center gap-4 text-right">
                                  <span className="text-muted-foreground">{item.qty}x</span>
                                  <span className="font-medium">{formatCurrency(item.total)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Open Bill items */}
                    {recap.openBill.length > 0 && (
                      <div>
                        <button
                          className="flex items-center gap-2 w-full text-left font-medium text-sm py-2"
                          onClick={() => setRecapSection(recapSection === 'openBill' ? null : 'openBill')}
                          data-testid="button-toggle-openbill"
                        >
                          <FileText className="h-4 w-4 text-yellow-500" />
                          Open Bill Pending ({recap.openBill.length} item)
                          {recapSection === 'openBill' ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                        </button>
                        {recapSection === 'openBill' && (
                          <div className="mt-1 rounded-lg border divide-y">
                            {recap.openBill.map((item) => (
                              <div key={item.name} className="flex items-center justify-between px-3 py-2 text-sm" data-testid={`recap-openbill-${item.name}`}>
                                <span className="text-foreground">{item.name}</span>
                                <div className="flex items-center gap-4 text-right">
                                  <span className="text-muted-foreground">{item.qty}x</span>
                                  <span className="font-medium text-yellow-600">{formatCurrency(item.total)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {recap.makanan.length === 0 && recap.minuman.length === 0 && recap.openBill.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">Belum ada transaksi di shift ini</p>
                    )}
                  </>
                ) : null}
              </CardContent>
            )}
          </Card>

          {/* Close Shift */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tutup Shift (Closingan)
              </CardTitle>
              <CardDescription>Akhiri sesi kerja dan lakukan penghitungan kas akhir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="final-cash">Kas Fisik Dihitung (Rp)</Label>
                  <CurrencyInput id="final-cash" value={finalCash} onValueChange={setFinalCash} data-testid="input-final-cash" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Catatan untuk shift ini..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    data-testid="input-shift-notes"
                  />
                </div>
              </div>

              {finalCash > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Ringkasan Kas</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Kas Tercatat</p>
                      <p className="font-medium">{formatCurrency(activeShift.systemCash || activeShift.initialCash || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kas Fisik</p>
                      <p className="font-medium">{formatCurrency(finalCash || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Selisih</p>
                      <div className="flex items-center gap-1">
                        {calculateCashDifference() !== 0 && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                        <p className={`font-medium ${calculateCashDifference() > 0 ? 'text-green-600' : calculateCashDifference() < 0 ? 'text-red-600' : 'text-foreground'}`}>
                          {formatCurrency(calculateCashDifference())}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {recap && recap.summary.totalOpenBillPending > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Open Bill Belum Lunas</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-0.5">
                        Terdapat {formatCurrency(recap.summary.totalOpenBillPending)} dari open bill yang masih belum dibayar di shift ini.
                        Dana ini akan dilanjutkan ke shift berikutnya.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <Button
                onClick={handleCloseShift}
                disabled={closeShiftMutation.isPending}
                variant="destructive"
                className="w-full"
                data-testid="button-close-shift"
              >
                {closeShiftMutation.isPending ? "Menutup..." : "Tutup Shift"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
