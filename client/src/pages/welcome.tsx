import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  ShoppingBag, Search, Settings, MapPin, Clock, Star,
  Plus, Minus, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem, Category } from "@shared/schema";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&auto=format&fit=crop&q=80",
    tag: "NEW ARRIVAL",
    headline: "Kopi & Kuliner\nTerbaik Hari Ini",
    sub: "Nikmati cita rasa premium di setiap tegukan",
  },
  {
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&auto=format&fit=crop&q=80",
    tag: "PROMO SPESIAL",
    headline: "Hemat 20%\nPesanan Pertama",
    sub: "Gunakan kode ALONICA20 saat checkout",
  },
  {
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&auto=format&fit=crop&q=80",
    tag: "TAKE AWAY",
    headline: "Pesan Online,\nSiap Dalam 15 Menit",
    sub: "Pre-order sebelum datang, langsung ambil",
  },
];

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const { login, user } = useAuth();
  const { cartItems, addToCart, updateQuantity, totalItems, total } = useCart();
  const { toast } = useToast();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const categoryNavRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const { data: menuItems = [] } = useQuery<MenuItem[]>({ queryKey: ["/api/menu"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  useEffect(() => {
    if (user) {
      if (user.role === "kasir") setLocation("/kasir/orders");
      else if (user.role === "admin") setLocation("/admin");
    }
  }, [user, setLocation]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const filteredItems = menuItems.filter(
    (item) =>
      item.isAvailable &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const itemsByCategory = categories
    .map((cat) => ({
      category: cat,
      items: filteredItems.filter((item) => item.categoryId === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  const handleAddToCart = (item: MenuItem) => {
    addToCart({ id: item.id, name: item.name, price: item.price, image: item.image || undefined });
  };

  const getCartQuantity = (itemId: string) => {
    const found = cartItems.find((c) => c.id === itemId);
    return found ? found.quantity : 0;
  };

  const scrollToCategory = (catId: string | null) => {
    setActiveCategory(catId);
    if (!catId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = sectionRefs.current[catId];
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const handleAdminLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login(adminUsername, adminPassword);
      setShowAdminLogin(false);
    } catch {
      toast({ title: "Login gagal", description: "Username atau password salah", variant: "destructive" });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#F5F0E8", fontFamily: "var(--font-sans)" }}>
      {/* ─── STICKY NAVBAR ─── */}
      <nav
        className="sticky top-0 z-50 bg-white border-b"
        style={{ borderColor: "#EAE0D8" }}
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <h1
                className="text-xl font-bold leading-none"
                style={{ fontFamily: "var(--font-playfair)", color: "#800001" }}
                data-testid="text-brand-name"
              >
                Alonica
              </h1>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: "#9B8B87" }}>
                Cafe & Restaurant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              data-testid="button-search"
            >
              <Search size={20} style={{ color: "#5A4A47" }} />
            </button>
            <button
              onClick={() => setLocation("/cart")}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              data-testid="button-cart-nav"
            >
              <ShoppingBag size={20} style={{ color: "#5A4A47" }} />
              {totalItems > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background: "#800001" }}
                  data-testid="cart-badge"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAdminLogin(true)}
              className="p-1 opacity-20 hover:opacity-60 transition-opacity"
              data-testid="button-admin-access"
            >
              <Settings size={14} style={{ color: "#5A4A47" }} />
            </button>
          </div>
        </div>

        {/* Search bar dropdown */}
        {showSearch && (
          <div className="px-4 pb-3 bg-white">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#9B8B87" }}
              />
              <input
                autoFocus
                type="text"
                placeholder="Cari makanan favorit kamu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 rounded-full text-sm outline-none border"
                style={{ borderColor: "#E0D6D0", background: "#FAFAF8" }}
                data-testid="input-search"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X size={14} style={{ color: "#9B8B87" }} />
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO BANNER CAROUSEL ─── */}
      <div className="relative overflow-hidden" style={{ height: "240px" }}>
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === currentSlide ? 1 : 0 }}
          >
            <img
              src={slide.image}
              alt={slide.headline}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)",
              }}
            />
            <div className="absolute inset-0 flex flex-col justify-end p-5 pb-8">
              <span
                className="inline-block text-[10px] font-semibold tracking-widest px-2.5 py-1 rounded-full mb-2 w-fit"
                style={{ background: "#800001", color: "white" }}
              >
                {slide.tag}
              </span>
              <h2
                className="text-2xl font-bold text-white leading-tight whitespace-pre-line"
                style={{ fontFamily: "var(--font-playfair)", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
              >
                {slide.headline}
              </h2>
              <p className="text-white/75 text-xs mt-1">{slide.sub}</p>
            </div>
          </div>
        ))}

        {/* Prev/Next arrows */}
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
          onClick={() => setCurrentSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
          onClick={() => setCurrentSlide((s) => (s + 1) % SLIDES.length)}
        >
          <ChevronRight size={14} />
        </button>

        {/* Slide dots */}
        <div className="absolute bottom-3 right-4 flex gap-1">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentSlide ? "18px" : "6px",
                height: "6px",
                background: i === currentSlide ? "white" : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>
      </div>

      {/* ─── STORE INFO STRIP ─── */}
      <div className="bg-white" style={{ borderBottom: "1px solid #EAE0D8" }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-5 overflow-x-auto scrollbar-hide text-xs">
          {[
            { icon: <Clock size={13} />, text: "Buka 10:00 – 22:00" },
            { icon: <MapPin size={13} />, text: "Surabaya, Jawa Timur" },
            { icon: <Star size={13} />, text: "4.9 Rating · 2.4K Ulasan" },
          ].map((info, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0"
              style={{ color: "#6B5B58" }}
            >
              <span style={{ color: "#800001" }}>{info.icon}</span>
              <span>{info.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CATEGORY NAV (sticky) ─── */}
      <div
        className="sticky z-40 bg-white"
        style={{ top: "56px", borderBottom: "1px solid #EAE0D8" }}
        ref={categoryNavRef}
      >
        <div className="max-w-lg mx-auto px-4 py-2.5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
            <button
              onClick={() => scrollToCategory(null)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={
                activeCategory === null
                  ? { background: "#800001", color: "white" }
                  : { background: "#F5EDE8", color: "#5A4A47" }
              }
              data-testid="cat-all"
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap"
                style={
                  activeCategory === cat.id
                    ? { background: "#800001", color: "white" }
                    : { background: "#F5EDE8", color: "#5A4A47" }
                }
                data-testid={`cat-${cat.id}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MENU CONTENT ─── */}
      <div className="max-w-lg mx-auto px-4 pt-5 pb-32">
        {itemsByCategory.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ color: "#9B8B87" }}>
              {searchQuery ? "Tidak ada menu yang ditemukan" : "Menu belum tersedia saat ini"}
            </p>
          </div>
        ) : (
          itemsByCategory.map((group) => (
            <section
              key={group.category.id}
              className="mb-8"
              ref={(el) => { sectionRefs.current[group.category.id] = el; }}
            >
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-semibold" style={{ color: "#1A0A0A" }}>
                  {group.category.name}
                </h2>
                <div className="flex-1 h-px" style={{ background: "#E8DDD8" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {group.items.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    quantity={getCartQuantity(item.id)}
                    onAdd={() => handleAddToCart(item)}
                    onDecrease={() => updateQuantity(item.id, getCartQuantity(item.id) - 1)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* ─── FIXED BOTTOM CART BAR ─── */}
      {totalItems > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
          style={{ background: "linear-gradient(to top, #F5F0E8 70%, transparent)" }}
        >
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setLocation("/cart")}
              className="w-full h-14 rounded-2xl flex items-center justify-between px-5 shadow-lg transition-transform active:scale-95"
              style={{ background: "#800001", color: "white" }}
              data-testid="button-view-cart"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-bold"
                  style={{ color: "#800001" }}
                >
                  {totalItems}
                </span>
                <span className="text-sm font-medium">Lihat Pesanan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">{formatCurrency(total)}</span>
                <ChevronRight size={16} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ─── ADMIN LOGIN DIALOG ─── */}
      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className="w-full max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-center">Admin Login</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Masukkan kredensial untuk mengakses dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Username"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              disabled={isLoggingIn}
              data-testid="input-admin-username"
            />
            <Input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              disabled={isLoggingIn}
              data-testid="input-admin-password"
            />
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAdminLogin(false)}
                data-testid="button-cancel-admin"
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={handleAdminLogin}
                disabled={isLoggingIn}
                style={{ background: "#800001" }}
                data-testid="button-login-admin"
              >
                {isLoggingIn ? "Memproses..." : "Login"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenuCard({
  item,
  quantity,
  onAdd,
  onDecrease,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onDecrease: () => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-sm"
      style={{ border: "1px solid #F0E8E4" }}
      data-testid={`card-menu-${item.id}`}
    >
      {/* Image */}
      <div className="relative">
        <img
          src={
            item.image ||
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop"
          }
          alt={item.name}
          className="w-full object-cover"
          style={{ height: "130px" }}
          data-testid={`img-menu-${item.id}`}
        />
        {/* Add/qty button overlay */}
        <div className="absolute bottom-2 right-2">
          {quantity === 0 ? (
            <button
              onClick={onAdd}
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-90"
              style={{ background: "#800001", color: "white" }}
              data-testid={`button-add-${item.id}`}
            >
              <Plus size={16} />
            </button>
          ) : (
            <div
              className="flex items-center gap-1 rounded-full px-2 py-1 shadow-md"
              style={{ background: "#800001", color: "white" }}
            >
              <button onClick={onDecrease} className="w-5 h-5 flex items-center justify-center" data-testid={`button-decrease-${item.id}`}>
                <Minus size={12} />
              </button>
              <span className="text-xs font-bold min-w-[16px] text-center">{quantity}</span>
              <button onClick={onAdd} className="w-5 h-5 flex items-center justify-center" data-testid={`button-increase-${item.id}`}>
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3
          className="text-sm font-medium line-clamp-2 leading-snug mb-1.5"
          style={{ color: "#1A0A0A", minHeight: "2.5rem" }}
          data-testid={`text-name-${item.id}`}
        >
          {item.name}
        </h3>
        <p
          className="text-sm font-semibold"
          style={{ color: "#800001" }}
          data-testid={`text-price-${item.id}`}
        >
          {formatCurrency(item.price)}
        </p>
      </div>
    </div>
  );
}
