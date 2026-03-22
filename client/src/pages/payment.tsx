import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, CreditCard, Check, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import type { OrderItem } from "@shared/schema";

interface PaymentResponse {
  order: any;
  payment: {
    qrisUrl?: string;
    qrisString?: string;
    expiryTime: string;
    transactionId: string;
    midtransOrderId: string;
    snapToken?: string;
  };
}

interface PaymentStatus {
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired';
  transactionStatus: string;
  orderId: string;
  total: number;
}

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'creating' | 'pending' | 'paid' | 'failed' | 'expired'>('creating');
  const { cartItems, total, clearCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      // Create order with Midtrans QRIS integration
      const orderPayload = {
        ...orderData,
        paymentMethod: 'qris',
        useMidtrans: true // Flag to use real Midtrans integration
      };
      
      const response = await apiRequest('POST', '/api/orders', orderPayload);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data: PaymentResponse) => {
      // Store order details for receipt generation
      const receiptData = {
        ...data.order,
        orderDate: new Date().toISOString(),
        paymentMethod: 'qris'
      };
      localStorage.setItem('alonica-receipt', JSON.stringify(receiptData));
      
      setOrderId(data.order.id);
      setPaymentData(data);
      setPaymentStatus('pending');
      
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal membuat pembayaran",
        description: error.message,
        variant: "destructive",
      });
      setPaymentStatus('failed');
    }
  });

  // Real-time payment status checking
  const { data: paymentStatusData } = useQuery<PaymentStatus>({
    queryKey: ['/api/orders', orderId, 'payment-status'],
    enabled: !!orderId && paymentStatus === 'pending',
    refetchInterval: 2000, // Check every 2 seconds
    gcTime: 0, // Don't cache
    staleTime: 0,
  });

  // Handle payment status updates
  useEffect(() => {
    if (paymentStatusData && orderId) {
      const newStatus = paymentStatusData.paymentStatus;
      
      if (newStatus === 'paid') {
        setPaymentStatus('paid');
        clearCart();
        toast({
          title: "Pembayaran berhasil!",
          description: "Terima kasih, pesanan Anda sedang diproses",
        });
        
        // Navigate to success page after brief delay
        setTimeout(() => {
          setLocation("/success");
        }, 2000);
      } else if (newStatus === 'failed') {
        setPaymentStatus('failed');
        toast({
          title: "Pembayaran gagal",
          description: "Silakan coba lagi atau hubungi kasir",
          variant: "destructive",
        });
      } else if (newStatus === 'expired') {
        setPaymentStatus('expired');
        toast({
          title: "Pembayaran kedaluwarsa",
          description: "Waktu pembayaran telah habis",
          variant: "destructive",
        });
      }
    }
  }, [paymentStatusData, orderId, clearCart, setLocation, toast]);

  const handleCreateOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Keranjang kosong",
        description: "Silakan tambahkan item ke keranjang",
        variant: "destructive",
      });
      return;
    }

    // Get customer data
    const customerData = localStorage.getItem('alonica-customer');
    if (!customerData) {
      toast({
        title: "Data customer tidak ditemukan",
        description: "Silakan kembali ke halaman welcome",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }

    const { name, table, phone, orderType, scheduledTime } = JSON.parse(customerData);

    // Convert cart items to order items
    const orderItems: OrderItem[] = cartItems.map(item => ({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes || ""
    }));

    const orderData = {
      customerName: name,
      tableNumber: table,
      items: orderItems,
      customerPhone: phone || null,
      orderType: orderType || 'dine_in',
      scheduledTime: scheduledTime || null,
    };

    createOrderMutation.mutate(orderData);
  };

  const formatTimeRemaining = (expiryTime: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiryTime).getTime();
    const remaining = Math.max(0, expiry - now);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderPaymentContent = () => {
    if (paymentStatus === 'creating') {
      return (
        <div className="space-y-4">
          {/* QRIS Info Card */}
          <div
            className="rounded-3xl p-5 flex items-center gap-4"
            style={{ background: "rgba(255,149,0,0.07)", border: "1.5px solid rgba(255,149,0,0.18)" }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #FF9500, #FF6B35)" }}
            >
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "#1D1D1F" }}>QRIS Payment</p>
              <p className="text-xs mt-0.5" style={{ color: "#6E6E73" }}>
                GoPay · OVO · Dana · ShopeePay · Mobile Banking
              </p>
            </div>
            <Check className="h-5 w-5 ml-auto flex-shrink-0" style={{ color: "#FF9500" }} />
          </div>

          {/* Total Summary */}
          <div className="ng-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "#AEAEB2" }}>Total Pembayaran</p>
                <p className="font-extrabold text-3xl" style={{ color: "#FF9500", letterSpacing: "-0.03em" }} data-testid="text-payment-total">
                  {formatCurrency(total)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: "#6E6E73" }}>
                  {cartItems.length} jenis item
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateOrder}
            disabled={createOrderMutation.isPending}
            className="ng-tap w-full h-14 rounded-2xl font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #FF9500, #FF6B35)", fontSize: 15, letterSpacing: "-0.02em" }}
            data-testid="button-create-payment"
          >
            {createOrderMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Membuat Pembayaran…
              </span>
            ) : (
              "Buat QR Code QRIS →"
            )}
          </button>
        </div>
      );
    }

    if (paymentStatus === 'pending' && paymentData) {
      return (
        <div className="space-y-4" data-testid="qris-payment">
          {/* QR Code Card */}
          <div className="ng-card p-6 text-center">
            <p className="font-bold text-base mb-1" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>
              Scan & Bayar Sekarang
            </p>
            <p className="text-xs mb-5" style={{ color: "#6E6E73" }}>
              Buka e-wallet atau mobile banking, scan QR di bawah ini
            </p>

            <div
              className="w-52 h-52 mx-auto mb-4 rounded-3xl overflow-hidden flex items-center justify-center"
              style={{ background: "#F5F5F7", border: "1px solid #E5E5EA" }}
            >
              {paymentData.payment.qrisUrl ? (
                <img
                  src={paymentData.payment.qrisUrl}
                  alt="QRIS"
                  className="w-full h-full object-contain"
                  data-testid="img-qris-code"
                />
              ) : paymentData.payment.qrisString ? (
                <p className="text-xs text-center p-3 font-mono break-all" style={{ color: "#6E6E73" }}>
                  {paymentData.payment.qrisString}
                </p>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-xs" style={{ color: "#6E6E73" }}>QR Code QRIS</p>
                </div>
              )}
            </div>

            <p className="font-extrabold text-2xl mb-1" style={{ color: "#FF9500", letterSpacing: "-0.03em" }}>
              {formatCurrency(total)}
            </p>
            <p className="text-xs" style={{ color: "#AEAEB2" }}>
              ID: {paymentData.payment.midtransOrderId}
            </p>

            {/* Timer */}
            <div
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(255,149,0,0.1)", color: "#FF9500" }}
            >
              <Clock className="h-3.5 w-3.5" />
              Kedaluwarsa: {formatTimeRemaining(paymentData.payment.expiryTime)}
            </div>
          </div>

          {/* Waiting indicator */}
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: "rgba(0,122,255,0.06)", border: "1px solid rgba(0,122,255,0.12)" }}
          >
            <RefreshCw className="h-5 w-5 animate-spin flex-shrink-0" style={{ color: "#007AFF" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#007AFF" }}>Menunggu Konfirmasi</p>
              <p className="text-xs" style={{ color: "#6E6E73" }}>Status diperbarui otomatis setelah pembayaran berhasil</p>
            </div>
          </div>
        </div>
      );
    }

    if (paymentStatus === 'paid') {
      return (
        <div className="text-center py-8 space-y-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(48,209,88,0.12)" }}
          >
            <CheckCircle className="h-10 w-10" style={{ color: "#30D158" }} />
          </div>
          <div>
            <h2 className="font-extrabold text-2xl mb-1" style={{ color: "#1D1D1F", letterSpacing: "-0.03em" }}>
              Pembayaran Berhasil!
            </h2>
            <p style={{ color: "#6E6E73", fontSize: 14 }}>Pesanan kamu sedang kami siapkan 🍵</p>
          </div>
        </div>
      );
    }

    if (paymentStatus === 'failed' || paymentStatus === 'expired') {
      return (
        <div className="text-center py-8 space-y-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(255,59,48,0.1)" }}
          >
            <XCircle className="h-10 w-10" style={{ color: "#FF3B30" }} />
          </div>
          <div>
            <h2 className="font-extrabold text-2xl mb-1" style={{ color: "#1D1D1F", letterSpacing: "-0.03em" }}>
              {paymentStatus === 'expired' ? 'Waktu Habis' : 'Pembayaran Gagal'}
            </h2>
            <p className="mb-6" style={{ color: "#6E6E73", fontSize: 14 }}>
              {paymentStatus === 'expired' ? 'QR Code sudah kedaluwarsa.' : 'Terjadi kesalahan. Silakan coba lagi.'}
            </p>
            <button
              onClick={() => setLocation('/cart')}
              className="ng-tap px-8 h-12 rounded-2xl font-bold text-sm"
              style={{ background: "#F5F5F7", color: "#1D1D1F" }}
            >
              ← Kembali ke Keranjang
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: "#F5F0E8", fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 bg-white flex items-center gap-3 px-4 h-14"
        style={{ borderBottom: "1px solid #EAE0D8" }}
      >
        <button
          onClick={() => setLocation("/cart")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" style={{ color: "#5A4A47" }} />
        </button>
        <h1 className="text-base font-semibold flex-1" style={{ color: "#1A0A0A" }} data-testid="text-page-title">
          Pembayaran QRIS
        </h1>
        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "#FFF5F5", color: "#800001" }}>
          Midtrans
        </span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {renderPaymentContent()}
      </div>
    </div>
  );
}