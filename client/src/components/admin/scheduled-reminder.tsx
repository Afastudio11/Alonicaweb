import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Clock, X, ChevronRight } from "lucide-react";
import type { Order } from "@shared/schema";

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function getMinutesUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.round(diff / 60000);
}

export default function ScheduledOrderReminder() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders/scheduled"],
    refetchInterval: 30000,
  });

  const visible = orders.filter(o =>
    !dismissed.has(o.id) && o.scheduledTime
  );

  if (visible.length === 0) return null;

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 100,
      display: "flex", flexDirection: "column", gap: 10,
      maxWidth: 360,
    }}>
      {visible.map(order => {
        const mins = order.scheduledTime ? getMinutesUntil(order.scheduledTime) : 0;
        const isUrgent = mins <= 5;
        const items = Array.isArray(order.items) ? order.items as any[] : [];
        const itemNames = items.slice(0, 2).map((i: any) => i.name).join(", ");
        const more = items.length > 2 ? ` +${items.length - 2} lainnya` : "";

        return (
          <div
            key={order.id}
            data-testid={`reminder-${order.id}`}
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: "16px 18px",
              boxShadow: isUrgent
                ? "0 8px 30px rgba(255,45,85,0.25), 0 2px 8px rgba(0,0,0,0.08)"
                : "0 8px 30px rgba(255,149,0,0.2), 0 2px 8px rgba(0,0,0,0.06)",
              border: `2px solid ${isUrgent ? "#FF2D55" : "#FF9500"}`,
              animation: isUrgent ? "pulse-reminder 1.5s infinite" : "none",
              position: "relative",
            }}
          >
            {/* Close */}
            <button
              onClick={() => setDismissed(prev => new Set([...prev, order.id]))}
              data-testid={`button-dismiss-reminder-${order.id}`}
              style={{
                position: "absolute", top: 12, right: 12,
                width: 24, height: 24, borderRadius: "50%",
                border: "none", background: "#F2F2F7",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#8E8E93",
              }}
            >
              <X size={12} />
            </button>

            {/* Icon + heading */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: isUrgent
                  ? "linear-gradient(135deg, #FF2D55, #FF6B6B)"
                  : "linear-gradient(135deg, #FF9500, #FFAB00)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Bell size={16} color="#fff" />
              </div>
              <div>
                <p style={{
                  fontSize: 13, fontWeight: 800, color: isUrgent ? "#FF2D55" : "#FF9500",
                  margin: 0, textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {isUrgent ? "Segera Siapkan!" : "Pesanan Terjadwal"}
                </p>
                <p style={{ fontSize: 11, color: "#8E8E93", margin: 0 }}>
                  {order.scheduledTime ? `Jam ${formatTime(order.scheduledTime)}` : ""} · {mins <= 0 ? "sekarang!" : `${mins} menit lagi`}
                </p>
              </div>
            </div>

            {/* Order details */}
            <div style={{
              background: "#F5F5F7", borderRadius: 10, padding: "10px 12px",
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", margin: "0 0 2px" }}>
                {order.customerName}
              </p>
              <p style={{ fontSize: 12, color: "#6E6E73", margin: 0 }}>
                {order.orderType === "take_away" ? "Take Away" : `Meja ${order.tableNumber}`}
                {itemNames && ` · ${itemNames}${more}`}
              </p>
            </div>

            {/* Time indicator bar */}
            <div style={{ marginTop: 10, height: 4, borderRadius: 999, background: "#F2F2F7", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.max(0, Math.min(100, ((10 - Math.min(mins, 10)) / 10) * 100))}%`,
                background: isUrgent
                  ? "linear-gradient(90deg, #FF2D55, #FF6B6B)"
                  : "linear-gradient(90deg, #FF9500, #FFAB00)",
                borderRadius: 999,
                transition: "width 0.5s",
              }} />
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes pulse-reminder {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
}
