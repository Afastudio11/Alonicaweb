import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Check, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { printWithThermalSettings, getThermalPreference } from "@/utils/thermal-print";
import type { Order } from "@shared/schema";

interface ReceiptData extends Order {
  orderDate: string;
  customerData: {
    name: string;
    table: string;
  };
}

export default function SuccessPage() {
  const [, setLocation] = useLocation();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    // Load receipt data from localStorage
    const storedReceipt = localStorage.getItem('alonica-receipt');
    if (storedReceipt) {
      try {
        setReceiptData(JSON.parse(storedReceipt));
      } catch (error) {
        console.error('Failed to load receipt data:', error);
      }
    }
  }, []);

  const handleBackToMenu = () => {
    localStorage.removeItem('alonica-customer');
    localStorage.removeItem('alonica-receipt');
    setLocation("/");
  };

  const handlePrintReceipt = () => {
    printWithThermalSettings(getThermalPreference());
  };

  if (!receiptData) {
    // Fallback to simple success message if no receipt data
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center px-6">
        <div className="text-center space-y-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(48,209,88,0.12)" }}
            data-testid="icon-success"
          >
            <Check className="h-10 w-10" style={{ color: "#30D158" }} />
          </div>

          <div>
            <h1 className="font-extrabold text-3xl mb-1" style={{ color: "#1D1D1F", letterSpacing: "-0.04em" }} data-testid="text-success-title">
              Terima Kasih!
            </h1>
            <p style={{ color: "#6E6E73", fontSize: 15 }} data-testid="text-success-message">
              Pesanan kamu sedang kami siapkan
            </p>
          </div>

          <p className="font-extrabold text-2xl" style={{ color: "#FF9500", letterSpacing: "-0.03em" }} data-testid="text-brand-footer">
            ngehnoom
          </p>

          <button
            onClick={handleBackToMenu}
            className="ng-tap px-8 h-12 rounded-2xl font-bold text-white"
            style={{ background: "linear-gradient(135deg, #FF9500, #FF6B35)" }}
            data-testid="button-back-to-menu"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    );
  }

  const orderDate = new Date(receiptData.orderDate);
  const items = Array.isArray(receiptData.items) ? receiptData.items : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="ng-navbar sticky top-0 z-40 print-hide"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 h-14">
          <button
            onClick={handleBackToMenu}
            className="ng-tap w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: "#F5F5F7" }}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: "#1D1D1F" }} />
          </button>
          <h1 className="flex-1 font-bold text-base" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }} data-testid="text-page-title">
            Struk Pembayaran
          </h1>
          <button
            onClick={handlePrintReceipt}
            className="ng-tap flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold"
            style={{ background: "#F5F5F7", color: "#1D1D1F" }}
            data-testid="button-print"
          >
            <Printer className="h-3.5 w-3.5" />
            Cetak
          </button>
        </div>
      </header>

      {/* Receipt Content */}
      <div className="px-6 py-8">
        <div className="customer-receipt max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8" data-testid="receipt-container">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4" data-testid="icon-success">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h2 className="page-title mb-2" data-testid="text-success-title">
              Pesanan Berhasil!
            </h2>
            <p className="text-muted-foreground" data-testid="text-success-message">
              Terima kasih atas pesanan Anda
            </p>
          </div>

          {/* Restaurant Info */}
          <div className="receipt-header text-center border-b border-border pb-6 mb-6">
            <h1 className="font-extrabold text-2xl mb-1" style={{ color: "#FF9500", letterSpacing: "-0.03em" }} data-testid="text-restaurant-name">
              ngehnoom
            </h1>
            <p className="text-sm text-muted-foreground">Raya Lanto & Tanetea · Bantaeng</p>
            <p className="text-sm text-muted-foreground">#YangNyamanJadiSayang</p>
          </div>

          {/* Order Info */}
          <div className="space-y-4 border-b border-border pb-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">ID Pesanan</p>
                <p className="font-medium" data-testid="text-order-id">#{receiptData.id?.slice(-8).toUpperCase() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tanggal</p>
                <p className="font-medium" data-testid="text-order-date">
                  {orderDate.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Waktu</p>
                <p className="font-medium" data-testid="text-order-time">
                  {orderDate.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Meja</p>
                <p className="font-medium" data-testid="text-table-number">#{receiptData.tableNumber}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Atas Nama</p>
              <p className="font-medium" data-testid="text-customer-name">{receiptData.customerData?.name || receiptData.customerName || 'N/A'}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4 border-b border-border pb-6 mb-6">
            <h3 className="card-title thermal-compact">Detail Pesanan</h3>
            {items.map((item: any, index: number) => (
              <div key={index} className="receipt-item thermal-compact" data-testid={`receipt-item-${index}`}>
                <div className="receipt-item-name">
                  <p className="font-medium text-foreground" data-testid={`text-item-name-${index}`}>{item?.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} x {formatCurrency(item.price)}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground italic" data-testid={`text-item-notes-${index}`}>
                      Catatan: {item.notes}
                    </p>
                  )}
                </div>
                <div className="receipt-item-price" data-testid={`text-item-total-${index}`}>
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-3 pb-6 mb-6">
            <div className="thermal-divider"></div>
            <div className="thermal-grid">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium" data-testid="text-subtotal">{formatCurrency(receiptData.subtotal)}</span>
            </div>
            {receiptData.discount > 0 && (
              <div className="thermal-grid">
                <span className="text-muted-foreground">Diskon</span>
                <span className="font-medium text-red-600" data-testid="text-discount">-{formatCurrency(receiptData.discount)}</span>
              </div>
            )}
            <div className="thermal-divider"></div>
            <div className="receipt-total thermal-center">
              <div>Total: {formatCurrency(receiptData.total)}</div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="text-center space-y-4">
            <div>
              <p className="text-muted-foreground text-sm">Metode Pembayaran</p>
              <p className="font-medium text-foreground capitalize" data-testid="text-payment-method">
                {receiptData.paymentMethod === 'qris' ? 'QRIS' : 'Cash'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Status Pesanan</p>
              <p className="font-medium text-primary capitalize" data-testid="text-order-status">
                {receiptData.status === 'pending' ? 'Sedang Diproses' : receiptData.status}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              Terima kasih telah memesan di ngehnoom!
            </p>
            <p className="text-xs text-muted-foreground">
              Makanan Anda akan segera disiapkan
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-md mx-auto mt-8 space-y-4 print-hide">
          <Button
            onClick={handlePrintReceipt}
            variant="outline"
            className="w-full h-12 rounded-xl"
            data-testid="button-print-receipt"
          >
            <Printer className="h-5 w-5 mr-2" />
            Cetak Struk
          </Button>
          <Button
            onClick={handleBackToMenu}
            className="w-full h-12 rounded-xl"
            data-testid="button-back-to-menu"
          >
            Kembali ke Menu
          </Button>
        </div>
      </div>
    </div>
  );
}