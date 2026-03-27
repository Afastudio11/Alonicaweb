-- =====================================================
-- ALONICA CAFÉ - SAMPLE DATA
-- Jalankan di Supabase SQL Editor
-- =====================================================

-- 1. CABANG
INSERT INTO branches (name, address, city, phone, opening_hours, is_active, sort_order) VALUES
  ('Alonica Bantaeng Pusat', 'Jl. Pemuda No. 12, Kelurahan Letta', 'Bantaeng', '082187654321', '07.00 – 22.00', true, 1),
  ('Alonica Bantaeng Selatan', 'Jl. Andi Mallombassang No. 5', 'Bantaeng', '082198765432', '08.00 – 22.00', true, 2)
ON CONFLICT DO NOTHING;

-- 2. PROFIL TOKO (store_profile)
INSERT INTO store_profile (id, restaurant_name, address, phone, tagline, city, opening_hours, description, custom_receipt_footer, wifi_name, is_active)
VALUES (
  gen_random_uuid(),
  'Alonica Café',
  'Jl. Pemuda No. 12, Kelurahan Letta, Bantaeng',
  '082187654321',
  'Secangkir Hangat, Sejuta Kenangan',
  'Bantaeng',
  '07.00 – 22.00',
  'Kafe nyaman di pusat kota Bantaeng dengan menu kopi spesialti dan makanan pilihan.',
  'Terima kasih telah berkunjung ke Alonica Café. Sampai jumpa lagi!',
  'Alonica_WiFi',
  true
)
ON CONFLICT DO NOTHING;

-- 3. KATEGORI (per cabang Pusat)
WITH branch AS (SELECT id FROM branches WHERE name = 'Alonica Bantaeng Pusat' LIMIT 1)
INSERT INTO categories (name, description, is_active, branch_id) VALUES
  ('Kopi Panas', 'Minuman kopi hangat pilihan', true, (SELECT id FROM branch)),
  ('Kopi Dingin', 'Es kopi segar dan nikmat', true, (SELECT id FROM branch)),
  ('Non-Kopi', 'Teh, coklat, dan minuman lainnya', true, (SELECT id FROM branch)),
  ('Makanan Ringan', 'Snack dan camilan', true, (SELECT id FROM branch)),
  ('Makanan Berat', 'Nasi dan mie untuk kenyang', true, (SELECT id FROM branch))
ON CONFLICT DO NOTHING;

-- 4. KATEGORI (per cabang Selatan)
WITH branch AS (SELECT id FROM branches WHERE name = 'Alonica Bantaeng Selatan' LIMIT 1)
INSERT INTO categories (name, description, is_active, branch_id) VALUES
  ('Kopi Panas', 'Minuman kopi hangat pilihan', true, (SELECT id FROM branch)),
  ('Kopi Dingin', 'Es kopi segar dan nikmat', true, (SELECT id FROM branch)),
  ('Non-Kopi', 'Teh, coklat, dan minuman lainnya', true, (SELECT id FROM branch)),
  ('Makanan', 'Makanan dan camilan', true, (SELECT id FROM branch))
ON CONFLICT DO NOTHING;

-- 5. MENU ITEMS (cabang Pusat)
WITH
  branch AS (SELECT id FROM branches WHERE name = 'Alonica Bantaeng Pusat' LIMIT 1),
  cat_kopi_panas AS (SELECT id FROM categories WHERE name = 'Kopi Panas' AND branch_id = (SELECT id FROM branch) LIMIT 1),
  cat_kopi_dingin AS (SELECT id FROM categories WHERE name = 'Kopi Dingin' AND branch_id = (SELECT id FROM branch) LIMIT 1),
  cat_nonkopi AS (SELECT id FROM categories WHERE name = 'Non-Kopi' AND branch_id = (SELECT id FROM branch) LIMIT 1),
  cat_snack AS (SELECT id FROM categories WHERE name = 'Makanan Ringan' AND branch_id = (SELECT id FROM branch) LIMIT 1),
  cat_berat AS (SELECT id FROM categories WHERE name = 'Makanan Berat' AND branch_id = (SELECT id FROM branch) LIMIT 1)
INSERT INTO menu_items (name, price, category_id, description, is_available, branch_id) VALUES
  -- Kopi Panas
  ('Americano', 18000, (SELECT id FROM cat_kopi_panas), 'Espresso dengan air panas, bold dan kuat', true, (SELECT id FROM branch)),
  ('Cappuccino', 22000, (SELECT id FROM cat_kopi_panas), 'Espresso dengan steamed milk dan foam lembut', true, (SELECT id FROM branch)),
  ('Latte', 24000, (SELECT id FROM cat_kopi_panas), 'Espresso dengan susu panas yang creamy', true, (SELECT id FROM branch)),
  ('Kopi Susu Alonica', 20000, (SELECT id FROM cat_kopi_panas), 'Signature kopi susu khas Alonica', true, (SELECT id FROM branch)),
  ('Flat White', 25000, (SELECT id FROM cat_kopi_panas), 'Double espresso dengan susu micro-foam', true, (SELECT id FROM branch)),
  -- Kopi Dingin
  ('Es Kopi Susu', 22000, (SELECT id FROM cat_kopi_dingin), 'Kopi susu segar dengan es batu', true, (SELECT id FROM branch)),
  ('Cold Brew', 28000, (SELECT id FROM cat_kopi_dingin), 'Cold brew 12 jam, smooth dan rendah asam', true, (SELECT id FROM branch)),
  ('Es Americano', 20000, (SELECT id FROM cat_kopi_dingin), 'Americano segar dengan es', true, (SELECT id FROM branch)),
  ('Vietnamese Coffee', 25000, (SELECT id FROM cat_kopi_dingin), 'Kopi ala Vietnam dengan susu kental manis', true, (SELECT id FROM branch)),
  ('Caramel Macchiato', 28000, (SELECT id FROM cat_kopi_dingin), 'Es kopi dengan saus karamel', true, (SELECT id FROM branch)),
  -- Non-Kopi
  ('Teh Tarik', 16000, (SELECT id FROM cat_nonkopi), 'Teh susu khas Malaysia', true, (SELECT id FROM branch)),
  ('Matcha Latte', 26000, (SELECT id FROM cat_nonkopi), 'Matcha Jepang dengan susu panas', true, (SELECT id FROM branch)),
  ('Es Matcha', 28000, (SELECT id FROM cat_nonkopi), 'Matcha dingin yang menyegarkan', true, (SELECT id FROM branch)),
  ('Chocolate', 22000, (SELECT id FROM cat_nonkopi), 'Minuman coklat hangat pilihan', true, (SELECT id FROM branch)),
  ('Lemon Tea', 18000, (SELECT id FROM cat_nonkopi), 'Teh lemon segar', true, (SELECT id FROM branch)),
  -- Makanan Ringan
  ('Roti Bakar', 20000, (SELECT id FROM cat_snack), 'Roti bakar dengan pilihan topping', true, (SELECT id FROM branch)),
  ('Pisang Goreng', 15000, (SELECT id FROM cat_snack), 'Pisang goreng renyah 3 pcs', true, (SELECT id FROM branch)),
  ('French Fries', 22000, (SELECT id FROM cat_snack), 'Kentang goreng crispy', true, (SELECT id FROM branch)),
  ('Singkong Goreng', 14000, (SELECT id FROM cat_snack), 'Singkong goreng empuk khas lokal', true, (SELECT id FROM branch)),
  -- Makanan Berat
  ('Nasi Goreng Spesial', 32000, (SELECT id FROM cat_berat), 'Nasi goreng dengan telur dan ayam', true, (SELECT id FROM branch)),
  ('Mie Goreng', 28000, (SELECT id FROM cat_berat), 'Mie goreng spesial dengan topping lengkap', true, (SELECT id FROM branch)),
  ('Nasi Ayam Geprek', 30000, (SELECT id FROM cat_berat), 'Ayam geprek pedas dengan nasi putih', true, (SELECT id FROM branch))
ON CONFLICT DO NOTHING;

-- 6. MENU ITEMS (cabang Selatan)
WITH
  branch AS (SELECT id FROM branches WHERE name = 'Alonica Bantaeng Selatan' LIMIT 1),
  cat_kopi_panas AS (SELECT id FROM categories WHERE name = 'Kopi Panas' AND branch_id = (SELECT id FROM branch) LIMIT 1),
  cat_kopi_dingin AS (SELECT id FROM categories WHERE name = 'Kopi Dingin' AND branch_id = (SELECT id FROM branch) LIMIT 1),
  cat_nonkopi AS (SELECT id FROM categories WHERE name = 'Non-Kopi' AND branch_id = (SELECT id FROM branch) LIMIT 1),
  cat_makanan AS (SELECT id FROM categories WHERE name = 'Makanan' AND branch_id = (SELECT id FROM branch) LIMIT 1)
INSERT INTO menu_items (name, price, category_id, description, is_available, branch_id) VALUES
  ('Americano', 18000, (SELECT id FROM cat_kopi_panas), 'Espresso dengan air panas', true, (SELECT id FROM branch)),
  ('Latte', 24000, (SELECT id FROM cat_kopi_panas), 'Espresso dengan susu panas', true, (SELECT id FROM branch)),
  ('Kopi Susu Alonica', 20000, (SELECT id FROM cat_kopi_panas), 'Signature kopi susu khas Alonica', true, (SELECT id FROM branch)),
  ('Es Kopi Susu', 22000, (SELECT id FROM cat_kopi_dingin), 'Kopi susu segar dengan es', true, (SELECT id FROM branch)),
  ('Cold Brew', 28000, (SELECT id FROM cat_kopi_dingin), 'Cold brew 12 jam', true, (SELECT id FROM branch)),
  ('Matcha Latte', 26000, (SELECT id FROM cat_nonkopi), 'Matcha dengan susu panas', true, (SELECT id FROM branch)),
  ('Teh Tarik', 16000, (SELECT id FROM cat_nonkopi), 'Teh susu khas Malaysia', true, (SELECT id FROM branch)),
  ('Nasi Goreng', 30000, (SELECT id FROM cat_makanan), 'Nasi goreng spesial', true, (SELECT id FROM branch)),
  ('Roti Bakar', 20000, (SELECT id FROM cat_makanan), 'Roti bakar dengan topping', true, (SELECT id FROM branch))
ON CONFLICT DO NOTHING;

-- 7. MEJA (Cabang Pusat)
WITH branch AS (SELECT id FROM branches WHERE name = 'Alonica Bantaeng Pusat' LIMIT 1)
INSERT INTO tables (number, capacity, is_available, branch_id) VALUES
  ('T01', 2, true, (SELECT id FROM branch)),
  ('T02', 2, true, (SELECT id FROM branch)),
  ('T03', 4, true, (SELECT id FROM branch)),
  ('T04', 4, true, (SELECT id FROM branch)),
  ('T05', 4, true, (SELECT id FROM branch)),
  ('T06', 6, true, (SELECT id FROM branch)),
  ('T07', 6, true, (SELECT id FROM branch)),
  ('VIP01', 8, true, (SELECT id FROM branch)),
  ('VIP02', 8, true, (SELECT id FROM branch)),
  ('Bar01', 2, true, (SELECT id FROM branch)),
  ('Bar02', 2, true, (SELECT id FROM branch)),
  ('Bar03', 2, true, (SELECT id FROM branch))
ON CONFLICT DO NOTHING;

-- 8. MEJA (Cabang Selatan)
WITH branch AS (SELECT id FROM branches WHERE name = 'Alonica Bantaeng Selatan' LIMIT 1)
INSERT INTO tables (number, capacity, is_available, branch_id) VALUES
  ('T01', 2, true, (SELECT id FROM branch)),
  ('T02', 4, true, (SELECT id FROM branch)),
  ('T03', 4, true, (SELECT id FROM branch)),
  ('T04', 6, true, (SELECT id FROM branch)),
  ('Bar01', 2, true, (SELECT id FROM branch)),
  ('Bar02', 2, true, (SELECT id FROM branch))
ON CONFLICT DO NOTHING;

-- 9. MEMBER CONTOH
INSERT INTO members (phone, name, total_orders, total_spent, discount_percent, is_vip, notes) VALUES
  ('081234567890', 'Andi Baso', 15, 480000, 5, false, NULL),
  ('082345678901', 'Sitti Rahmah', 28, 920000, 10, true, 'Pelanggan setia sejak pembukaan'),
  ('083456789012', 'Muhammad Arif', 8, 210000, 0, false, NULL),
  ('084567890123', 'Nur Fadilah', 42, 1380000, 15, true, 'Member VIP - suka kopi dingin'),
  ('085678901234', 'Andi Julian', 6, 175000, 0, false, NULL),
  ('086789012345', 'Hartina', 19, 620000, 5, false, NULL),
  ('087890123456', 'Reza Pratama', 33, 1050000, 10, true, 'Langganan cold brew setiap pagi'),
  ('088901234567', 'Dewi Safitri', 11, 340000, 0, false, NULL),
  ('089012345678', 'Baharuddin', 22, 710000, 5, false, NULL),
  ('081122334455', 'Sri Wahyuni', 5, 145000, 0, false, NULL)
ON CONFLICT (phone) DO NOTHING;

-- 10. BANNER landing page
WITH branch AS (SELECT id FROM branches WHERE name = 'Alonica Bantaeng Pusat' LIMIT 1)
INSERT INTO banners (title, subtitle, tag, cta_text, gradient, is_active, sort_order, branch_id) VALUES
  (
    'Selamat Datang di Alonica',
    'Kopi spesialti pilihan, suasana nyaman, dan harga bersahabat',
    '☕ Grand Opening',
    'Pesan Sekarang',
    'linear-gradient(135deg, #8B1538 0%, #6B1028 55%, #A8294A 100%)',
    true, 1,
    (SELECT id FROM branch)
  ),
  (
    'Kopi Susu Alonica',
    'Signature drink khas kami — creamy, bold, dan bikin nagih',
    '⭐ Best Seller',
    'Coba Sekarang',
    'linear-gradient(135deg, #6B1028 0%, #8B1538 60%, #C0395A 100%)',
    true, 2,
    (SELECT id FROM branch)
  ),
  (
    'Happy Hour Setiap Hari',
    'Diskon 20% untuk semua minuman pukul 14.00 – 17.00',
    '🎉 Promo',
    'Lihat Menu',
    'linear-gradient(135deg, #A8294A 0%, #8B1538 50%, #6B1028 100%)',
    true, 3,
    (SELECT id FROM branch)
  )
ON CONFLICT DO NOTHING;

-- Verifikasi
SELECT 'branches' as tabel, COUNT(*) as jumlah FROM branches
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'menu_items', COUNT(*) FROM menu_items
UNION ALL SELECT 'tables', COUNT(*) FROM tables
UNION ALL SELECT 'members', COUNT(*) FROM members
UNION ALL SELECT 'banners', COUNT(*) FROM banners
ORDER BY tabel;
