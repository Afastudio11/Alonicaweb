import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    const { rows: existing } = await client.query("SELECT COUNT(*) as cnt FROM categories");
    if (parseInt(existing[0].cnt) > 0) {
      console.log("✅ Database already seeded, skipping.");
      return;
    }
    console.log("🌱 Seeding production database...");

    await client.query("BEGIN");

    // === STORE PROFILE ===
    await client.query(`
      INSERT INTO store_profile (id, restaurant_name, address, phone, email, description, city, opening_hours, rating, review_count, tagline, is_active, multi_branch_enabled, show_cashier_name)
      VALUES ('8ccd75ea-1752-428c-96b7-bb14139b4f99', 'Ngehnoom Cafe', 'Bantaeng, Sulawesi Selatan', '0515-0000', NULL, 'Yang Nyaman Jadi Sayang', 'Bantaeng', '08.30 – 23.00', '4.9', '1.4rb ulasan', 'Yang Nyaman Jadi Sayang', TRUE, FALSE, TRUE)
      ON CONFLICT (id) DO NOTHING
    `);

    // === CATEGORIES ===
    await client.query(`
      INSERT INTO categories (id, name, description, is_active, branch_id) VALUES
      ('ad1b0e20-b0db-4d57-89d3-aedd8dbedb28', 'Minuman', 'Kopi, teh, dan minuman segar lainnya', TRUE, NULL),
      ('765b43e2-027b-44e2-8814-28e9ac5956be', 'Makanan', 'Camilan dan makanan berat', TRUE, NULL),
      ('f30b489d-7a04-42af-9aff-6e0882f87a4f', 'Dessert', 'Kue dan hidangan penutup', TRUE, NULL)
      ON CONFLICT (id) DO NOTHING
    `);

    // === MENU ITEMS ===
    await client.query(`
      INSERT INTO menu_items (id, name, price, category_id, description, image, is_available, branch_id, stock) VALUES
      ('1a544024-d415-430d-b4ea-14b212d45d41', 'Cappuccino', 32000, 'ad1b0e20-b0db-4d57-89d3-aedd8dbedb28', 'Espresso dengan steamed milk dan foam lembut', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&auto=format&fit=crop', TRUE, NULL, NULL),
      ('31a57d31-408c-454a-a756-a20a5540a715', 'Latte Karamel', 35000, 'ad1b0e20-b0db-4d57-89d3-aedd8dbedb28', 'Latte manis dengan drizzle karamel premium', 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&auto=format&fit=crop', TRUE, NULL, NULL),
      ('62632410-22ba-476a-9649-cf07242fd647', 'Matcha Latte', 38000, 'ad1b0e20-b0db-4d57-89d3-aedd8dbedb28', 'Matcha premium Jepang dengan susu segar', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop', TRUE, NULL, NULL),
      ('f1b5c080-f060-46b6-aa92-2d3414423f11', 'Es Kopi Susu', 28000, 'ad1b0e20-b0db-4d57-89d3-aedd8dbedb28', 'Kopi susu khas Nusantara yang melegenda', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop', TRUE, NULL, NULL),
      ('377d45e4-82fa-4fff-a45f-65bcc300bc88', 'Americano', 25000, 'ad1b0e20-b0db-4d57-89d3-aedd8dbedb28', 'Espresso klasik dengan air panas murni', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop', TRUE, NULL, NULL),
      ('f5f55406-42ec-4c96-94ae-1512314a76ee', 'Nasi Goreng Spesial', 45000, '765b43e2-027b-44e2-8814-28e9ac5956be', 'Nasi goreng khas dengan telur dan lauk pilihan', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop', TRUE, NULL, NULL),
      ('a479dc0d-84a3-4684-90d7-7dcf84223689', 'Roti Bakar Keju', 22000, '765b43e2-027b-44e2-8814-28e9ac5956be', 'Roti panggang dengan keju meleleh di atas', 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&auto=format&fit=crop', TRUE, NULL, NULL),
      ('f5786ab1-af87-4020-b78f-1dbfa912c5ee', 'Pasta Carbonara', 52000, '765b43e2-027b-44e2-8814-28e9ac5956be', 'Pasta creamy dengan bacon dan parmesan', 'https://images.unsplash.com/photo-1527324688151-0e627063f2b1?w=400&auto=format&fit=crop', TRUE, NULL, NULL),
      ('c195928f-09c7-48a7-a49e-97e8f759f100', 'Croissant Almond', 28000, 'f30b489d-7a04-42af-9aff-6e0882f87a4f', 'Croissant renyah dengan filling almond cream', 'https://images.unsplash.com/photo-1568471173242-461f0a730452?w=400&auto=format&fit=crop', TRUE, NULL, NULL),
      ('c0096992-08e8-4ddd-ad9e-8c6313883fb4', 'Tiramisu', 42000, 'f30b489d-7a04-42af-9aff-6e0882f87a4f', 'Tiramisu Italia autentik dengan mascarpone', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&auto=format&fit=crop', TRUE, NULL, NULL)
      ON CONFLICT (id) DO NOTHING
    `);

    // === USERS ===
    await client.query(`
      INSERT INTO users (id, username, password, role, is_active, branch_id, allowed_menus) VALUES
      ('af663dba-a59e-4e61-a3a0-eaaa7ebe1f5d', 'admin', '$2b$10$mGZ9sY/TNom06PL3tA60UONfkBAMVjOUp2AaKbok/CzMWhS5OBp46', 'admin', TRUE, NULL, NULL),
      ('a7731d2d-2f6e-4a49-9041-038eec57c910', 'kasir', '$2b$10$mGZ9sY/TNom06PL3tA60UONfkBAMVjOUp2AaKbok/CzMWhS5OBp46', 'kasir', TRUE, NULL, NULL)
      ON CONFLICT (id) DO NOTHING
    `);

    // === INVENTORY ===
    await client.query(`
      INSERT INTO inventory_items (id, name, category, current_stock, min_stock, max_stock, unit, price_per_unit, supplier) VALUES
      ('cad8ca81-8576-4de2-8a15-d679eb7f2cb1', 'Biji Kopi Arabika', 'bahan_baku', 5000, 500, 20000, 'gram', 50, 'CV Kopi Nusantara'),
      ('9344139a-7932-40a3-8152-ee73e9540bc9', 'Susu Segar', 'bahan_baku', 10000, 1000, 50000, 'ml', 15, 'Koperasi Peternak'),
      ('df78c74e-f209-4b87-968d-1748c58c420a', 'Matcha Powder', 'bahan_baku', 2000, 200, 5000, 'gram', 200, 'Importir Jepang'),
      ('b66e8873-4b37-48d2-8a84-7c82cd8906c9', 'Tepung Terigu', 'bahan_baku', 8000, 1000, 25000, 'gram', 12, 'Bogasari'),
      ('fceb3b26-c9a1-4bb3-9999-af1fe488567c', 'Telur Ayam', 'bahan_baku', 50, 10, 200, 'butir', 3000, 'Peternakan Lokal'),
      ('148df7b2-0421-4f18-80e1-7a4b7e515efe', 'Pasta Spaghetti', 'bahan_baku', 5000, 500, 15000, 'gram', 30, 'Importir Italia'),
      ('05015d8e-3034-4fe6-a2bc-8880ae4010d2', 'Keju Parmesan', 'bahan_baku', 1500, 200, 5000, 'gram', 150, 'Importir Eropa'),
      ('00ccb6d3-a7be-43f7-8421-6f96d0e0444f', 'Butter/Mentega', 'bahan_baku', 3000, 300, 10000, 'gram', 80, 'Indomilk'),
      ('bc59eb68-5224-4919-a1fd-4f9b62e8332c', 'Gula Pasir', 'bahan_baku', 10000, 1000, 30000, 'gram', 10, 'Pasar Lokal'),
      ('12737806-3ab4-41fa-b283-5ad709e6cfe2', 'Cokelat Bubuk', 'bahan_baku', 2000, 200, 6000, 'gram', 120, 'Ceres'),
      ('7f1e4067-142d-4321-a808-5233401d662c', 'cup', 'Kemasan', 1000, 10, 1000, 'pcs', 500, 'ahmad')
      ON CONFLICT (id) DO NOTHING
    `);

    // === BANNERS ===
    await client.query(`
      INSERT INTO banners (id, title, subtitle, tag, cta_text, gradient, is_active, sort_order, image_url, branch_id) VALUES
      ('05f4fdf8-e148-4923-8be6-a857a295bfbe', 'Yang Nyaman Jadi Sayang', 'Minuman & makanan khas Bantaeng yang bikin betah', 'Original Local Product', 'Pesan Sekarang', NULL, TRUE, 0, '/images/49a87bf0-7dd4-4fcf-ad80-62ad3341f77c.png', NULL),
      ('ccdea1cc-9d49-4446-a78d-b791edde0ecd', 'Bottle Edition Siap Dibawa', 'Pesan sekarang, nikmat kapan saja dan di mana saja', 'Promo Spesial', 'Lihat Menu', NULL, TRUE, 1, '/images/c8412fca-4071-42f0-be80-4292bb58ec9e.png', NULL),
      ('c8b8c29b-7302-4c3e-bbdf-5515534e0404', 'Pesan Online, Ambil Langsung', 'Pre-order sebelum datang, langsung siap di tempat', 'Take Away Ready', 'Pre-Order', 'linear-gradient(135deg, #FF2D55 0%, #FF6B35 55%, #FFAB00 100%)', TRUE, 2, NULL, NULL)
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query("COMMIT");
    console.log("✅ Production database seeded successfully!");
    console.log("   - 1 store profile");
    console.log("   - 3 categories");
    console.log("   - 10 menu items");
    console.log("   - 2 users (admin/kasir)");
    console.log("   - 11 inventory items");
    console.log("   - 3 banners");

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
