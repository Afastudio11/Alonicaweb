import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ShoppingCart, Search, X, Plus, Minus, ChevronRight, Clock, MapPin, Star, Coffee } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { MenuItem, Category, Banner } from "@shared/schema";

const FALLBACK_SLIDES = [
  {
    bg: "linear-gradient(135deg, #FFAB00 0%, #FF9500 55%, #FF2D55 100%)",
    tag: "Original Local Product",
    headline: "Yang Nyaman\nJadi Sayang",
    sub: "Minuman & makanan khas Bantaeng yang bikin betah",
    cta: "Pesan Sekarang",
  },
  {
    bg: "linear-gradient(135deg, #FF9500 0%, #FF6B35 50%, #FF2D55 100%)",
    tag: "Promo Spesial",
    headline: "Bottle Edition\nSiap Dibawa",
    sub: "Pesan sekarang, nikmat kapan saja dan di mana saja",
    cta: "Lihat Menu",
  },
  {
    bg: "linear-gradient(135deg, #FF2D55 0%, #FF6B35 55%, #FFAB00 100%)",
    tag: "Take Away Ready",
    headline: "Pesan Online,\nAmbil Langsung",
    sub: "Pre-order sebelum datang, langsung siap di tempat",
    cta: "Pre-Order",
  },
];

function NgehnoomLogo({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #FFAB00, #FF9500, #FF2D55)",
          padding: 2,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 22 18" fill="none">
            <path
              d="M2 16V6C2 6 2 2 6.5 2C11 2 11 6 11 6V16"
              stroke="#FF9500" strokeWidth="3" strokeLinecap="round"
            />
            <path
              d="M11 16V6C11 6 11 2 15.5 2C20 2 20 6 20 6V16"
              stroke="#FF9500" strokeWidth="3" strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 800,
          fontSize: size * 0.625,
          letterSpacing: "-0.02em",
          color: "#1D1D1F",
          lineHeight: 1,
        }}
      >
        ngehnoom
      </span>
    </div>
  );
}

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const { cartItems, addToCart, updateQuantity, totalItems, total } = useCart();
  const { toast } = useToast();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const slideTimer = useRef<NodeJS.Timeout | null>(null);

  const { data: menuItems = [] } = useQuery<MenuItem[]>({ queryKey: ["/api/menu"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: apiBanners = [] } = useQuery<Banner[]>({ queryKey: ["/api/banners"] });

  const SLIDES = apiBanners.length > 0
    ? apiBanners.map(b => ({
        bg: b.gradient,
        imageUrl: b.imageUrl ?? "",
        tag: b.tag ?? "",
        headline: b.title,
        sub: b.subtitle ?? "",
        cta: b.ctaText,
      }))
    : FALLBACK_SLIDES;

  useEffect(() => {
    slideTimer.current = setInterval(() => setCurrentSlide(s => (s + 1) % SLIDES.length), 4500);
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [SLIDES.length]);

  const filteredItems = menuItems.filter(item => {
    const matchCat = !activeCategory || item.categoryId === activeCategory;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch && item.isAvailable;
  });

  const groupedItems = (() => {
    if (activeCategory) {
      const cat = categories.find(c => c.id === activeCategory);
      return cat ? [{ category: cat, items: filteredItems }] : [];
    }
    return categories
      .map(cat => ({
        category: cat,
        items: filteredItems.filter(item => item.categoryId === cat.id),
      }))
      .filter(g => g.items.length > 0);
  })();

  const getCartQty = (id: string) =>
    cartItems.find(i => i.id === id)?.quantity ?? 0;

  const handleAdd = (item: MenuItem) => {
    addToCart({ id: item.id, name: item.name, price: item.price, image: item.image ?? "" });
    toast({ title: `${item.name} ditambahkan`, duration: 1500 });
  };

  const slide = SLIDES[currentSlide];

  return (
    <div
      className="min-h-screen"
      style={{ background: "#F5F5F7", fontFamily: "var(--font-sans)" }}
    >
      {/* ─── FROSTED NAVBAR ─── */}
      <header
        className="ng-navbar sticky top-0 z-50"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <NgehnoomLogo size={30} />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSearch(s => !s)}
              className="ng-tap w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: showSearch ? "#FF9500" : "transparent" }}
              data-testid="button-search"
            >
              <Search size={18} style={{ color: showSearch ? "#fff" : "#1D1D1F" }} />
            </button>
            <button
              onClick={() => setLocation("/cart")}
              className="ng-tap relative w-9 h-9 flex items-center justify-center rounded-full"
              data-testid="button-cart"
            >
              <ShoppingCart size={18} style={{ color: "#1D1D1F" }} />
              {totalItems > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: "#FF2D55", padding: "0 4px" }}
                >
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar slide-down */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div
              className="flex items-center gap-2 rounded-2xl px-4 h-10"
              style={{ background: "#EBEBF0" }}
            >
              <Search size={15} style={{ color: "#6E6E73", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Cari menu…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: "#1D1D1F" }}
                data-testid="input-search"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X size={14} style={{ color: "#6E6E73" }} />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-2xl mx-auto">
        {/* ─── HERO CAROUSEL ─── */}
        {!searchQuery && (
          <div className="px-4 pt-4 pb-2">
            <div
              className="relative rounded-3xl overflow-hidden ng-tap"
              style={{ background: slide.imageUrl ? undefined : slide.bg, minHeight: 200, cursor: "pointer" }}
              onClick={() => setLocation("/cart")}
            >
              {/* Background image mode */}
              {slide.imageUrl ? (
                <img
                  src={slide.imageUrl}
                  alt={slide.headline}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <>
                  {/* Decorative circles for gradient mode */}
                  <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                  <div style={{ position: "absolute", bottom: -30, right: 40, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
                  <div style={{ position: "absolute", top: 30, right: 70, width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.14)" }} />
                </>
              )}

              <div className="relative px-6 py-8" style={slide.imageUrl ? { background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 100%)" } : {}}>
                {slide.tag && (
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
                    style={{ background: "rgba(255,255,255,0.25)", color: "#fff", backdropFilter: "blur(4px)" }}
                  >
                    {slide.tag}
                  </span>
                )}
                <h1
                  className="font-extrabold text-white mb-2 leading-tight whitespace-pre-line"
                  style={{ fontSize: 28, letterSpacing: "-0.03em" }}
                >
                  {slide.headline}
                </h1>
                {slide.sub && (
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 20, maxWidth: 220 }}>
                    {slide.sub}
                  </p>
                )}
                <div
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,0.22)", color: "#fff", backdropFilter: "blur(4px)" }}
                >
                  {slide.cta}
                  <ChevronRight size={14} />
                </div>
              </div>

              {/* Slide dots */}
              <div className="absolute bottom-4 right-5 flex gap-1.5">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setCurrentSlide(i); }}
                    style={{
                      width: i === currentSlide ? 18 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === currentSlide ? "#fff" : "rgba(255,255,255,0.45)",
                      transition: "all 0.3s",
                      border: "none",
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── INFO STRIP ─── */}
        {!searchQuery && (
          <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scroll-bar">
            {[
              { icon: "Clock", text: "08.30 – 23.00" },
              { icon: "MapPin", text: "Bantaeng" },
              { icon: "Star", text: "4.9 · 1.4rb ulasan" },
            ].map(info => {
              const iconMap: Record<string, JSX.Element> = {
                Clock: <Clock size={13} style={{ color: "#6E6E73", flexShrink: 0 }} />,
                MapPin: <MapPin size={13} style={{ color: "#6E6E73", flexShrink: 0 }} />,
                Star: <Star size={13} style={{ color: "#6E6E73", flexShrink: 0 }} />,
              };
              return (
                <div
                  key={info.text}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
                  style={{ background: "#fff", fontSize: 12, color: "#6E6E73", fontWeight: 500, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                >
                  {iconMap[info.icon]}
                  <span>{info.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── CATEGORY PILLS ─── */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scroll-bar">
          <button
            onClick={() => setActiveCategory(null)}
            className="ng-tap flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={
              !activeCategory
                ? { background: "#FF9500", color: "#fff" }
                : { background: "#fff", color: "#1D1D1F", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }
            }
            data-testid="category-all"
          >
            Semua
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className="ng-tap flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={
                activeCategory === cat.id
                  ? { background: "#FF9500", color: "#fff" }
                  : { background: "#fff", color: "#1D1D1F", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }
              }
              data-testid={`category-${cat.id}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ─── MENU GRID ─── */}
        <div className="px-4 pb-36">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-3">
                <Coffee size={48} style={{ color: "#AEAEB2" }} />
              </div>
              <p className="font-semibold" style={{ color: "#1D1D1F" }}>Menu belum tersedia</p>
              <p className="text-sm mt-1" style={{ color: "#6E6E73" }}>Coba cari kata lain atau pilih kategori berbeda</p>
            </div>
          ) : (
            groupedItems.map(({ category, items }) => (
              <div key={category.id} className="mb-6">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-3 pt-2">
                  <h2 className="font-bold text-base" style={{ color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                    {category.name}
                  </h2>
                  <div style={{ flex: 1, height: 1, background: "#E5E5EA" }} />
                  <span className="text-xs font-medium" style={{ color: "#AEAEB2" }}>
                    {items.length} item
                  </span>
                </div>

                {/* Items grid */}
                <div className="grid grid-cols-2 gap-3">
                  {items.map(item => {
                    const qty = getCartQty(item.id);
                    return (
                      <div
                        key={item.id}
                        className="ng-card overflow-hidden"
                        data-testid={`card-menu-${item.id}`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedItem(item)}
                      >
                        {/* Image */}
                        <div className="relative" style={{ height: 120 }}>
                          <img
                            src={item.image || "https://images.unsplash.com/photo-1561456461-890f7f9b8c10?w=400&auto=format&fit=crop"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          {qty > 0 && (
                            <div
                              className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: "#FF2D55" }}
                            >
                              {qty}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <p
                            className="font-semibold leading-snug mb-1 line-clamp-2"
                            style={{ fontSize: 13, color: "#1D1D1F", letterSpacing: "-0.01em" }}
                            data-testid={`text-menu-name-${item.id}`}
                          >
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-xs line-clamp-1 mb-2" style={{ color: "#6E6E73" }}>
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span
                              className="font-bold"
                              style={{ fontSize: 13, color: "#FF9500" }}
                              data-testid={`text-menu-price-${item.id}`}
                            >
                              {formatCurrency(item.price)}
                            </span>

                            {qty === 0 ? (
                              <button
                                onClick={e => { e.stopPropagation(); handleAdd(item); }}
                                className="ng-tap w-7 h-7 rounded-full flex items-center justify-center"
                                style={{ background: "#FF9500" }}
                                data-testid={`button-add-${item.id}`}
                              >
                                <Plus size={14} color="#fff" strokeWidth={2.5} />
                              </button>
                            ) : (
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => updateQuantity(item.id, qty - 1)}
                                  className="ng-tap w-6 h-6 rounded-full flex items-center justify-center"
                                  style={{ background: "#F5F5F7", border: "1px solid #E5E5EA" }}
                                  data-testid={`button-decrease-${item.id}`}
                                >
                                  <Minus size={11} style={{ color: "#1D1D1F" }} />
                                </button>
                                <span className="text-xs font-bold w-4 text-center" style={{ color: "#1D1D1F" }}>
                                  {qty}
                                </span>
                                <button
                                  onClick={() => { handleAdd(item); }}
                                  className="ng-tap w-6 h-6 rounded-full flex items-center justify-center"
                                  style={{ background: "#FF9500" }}
                                  data-testid={`button-increase-${item.id}`}
                                >
                                  <Plus size={11} color="#fff" strokeWidth={2.5} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── FLOATING CART BAR ─── */}
      {totalItems > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4"
          style={{
            background: "rgba(245,245,247,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setLocation("/cart")}
              className="ng-tap w-full h-14 rounded-2xl flex items-center justify-between px-5 shadow-lg"
              style={{ background: "linear-gradient(135deg, #FF9500, #FF6B35)" }}
              data-testid="button-view-cart"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}
              >
                {totalItems}
              </div>
              <span className="font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
                Lihat Keranjang
              </span>
              <span className="font-bold text-white" style={{ fontSize: 13 }}>
                {formatCurrency(total)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ─── ITEM DETAIL SHEET ─── */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-2xl rounded-t-3xl overflow-hidden"
            style={{ background: "#fff" }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedItem.image || "https://images.unsplash.com/photo-1561456461-890f7f9b8c10?w=600&auto=format&fit=crop"}
              alt={selectedItem.name}
              className="w-full object-cover"
              style={{ height: 220 }}
            />
            <div className="px-5 py-5">
              <div className="flex items-start justify-between mb-1">
                <h2 className="font-extrabold text-xl leading-tight" style={{ color: "#1D1D1F", letterSpacing: "-0.03em", flex: 1 }}>
                  {selectedItem.name}
                </h2>
                <button onClick={() => setSelectedItem(null)} className="ml-2 mt-0.5">
                  <X size={20} style={{ color: "#6E6E73" }} />
                </button>
              </div>
              {selectedItem.description && (
                <p className="text-sm mb-4" style={{ color: "#6E6E73" }}>{selectedItem.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xl" style={{ color: "#FF9500", letterSpacing: "-0.02em" }}>
                  {formatCurrency(selectedItem.price)}
                </span>
                {getCartQty(selectedItem.id) === 0 ? (
                  <button
                    onClick={() => { handleAdd(selectedItem); setSelectedItem(null); }}
                    className="ng-tap px-6 h-11 rounded-2xl font-bold text-white text-sm"
                    style={{ background: "linear-gradient(135deg, #FF9500, #FF6B35)" }}
                    data-testid="button-add-detail"
                  >
                    Tambah ke Keranjang
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(selectedItem.id, getCartQty(selectedItem.id) - 1)}
                      className="ng-tap w-10 h-10 rounded-full flex items-center justify-center border"
                      style={{ borderColor: "#E5E5EA" }}
                    >
                      <Minus size={16} style={{ color: "#1D1D1F" }} />
                    </button>
                    <span className="font-bold text-lg" style={{ color: "#1D1D1F", minWidth: 20, textAlign: "center" }}>
                      {getCartQty(selectedItem.id)}
                    </span>
                    <button
                      onClick={() => handleAdd(selectedItem)}
                      className="ng-tap w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: "#FF9500" }}
                    >
                      <Plus size={16} color="#fff" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div style={{ height: "env(safe-area-inset-bottom, 16px)", minHeight: 16 }} />
          </div>
        </div>
      )}

    </div>
  );
}
