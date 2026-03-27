CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"performed_by" varchar NOT NULL,
	"target_id" varchar,
	"target_type" text,
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"tag" text,
	"cta_text" text DEFAULT 'Pesan Sekarang' NOT NULL,
	"gradient" text DEFAULT 'linear-gradient(135deg, #FFAB00 0%, #FF9500 55%, #FF2D55 100%)' NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"branch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '',
	"opening_hours" text DEFAULT '08.00 – 22.00',
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cash_movements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" varchar NOT NULL,
	"cashier_id" varchar NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"branch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_date" timestamp NOT NULL,
	"cashier_id" varchar NOT NULL,
	"total_revenue_cash" integer DEFAULT 0 NOT NULL,
	"total_revenue_non_cash" integer DEFAULT 0 NOT NULL,
	"total_revenue" integer DEFAULT 0 NOT NULL,
	"physical_cash_amount" integer DEFAULT 0 NOT NULL,
	"cash_difference" integer DEFAULT 0 NOT NULL,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"cash_orders" integer DEFAULT 0 NOT NULL,
	"non_cash_orders" integer DEFAULT 0 NOT NULL,
	"shift_start_time" timestamp,
	"shift_end_time" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deletion_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"item_name" text NOT NULL,
	"item_quantity" integer NOT NULL,
	"item_price" integer NOT NULL,
	"requested_by" varchar NOT NULL,
	"authorized_by" varchar NOT NULL,
	"request_time" timestamp DEFAULT now() NOT NULL,
	"approval_time" timestamp DEFAULT now() NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deletion_pins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pin" text NOT NULL,
	"description" text,
	"created_by" varchar NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"max_usage" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deletion_pins_pin_unique" UNIQUE("pin")
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'percentage' NOT NULL,
	"value" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"apply_to_all" boolean DEFAULT false NOT NULL,
	"category_ids" jsonb,
	"menu_item_ids" jsonb,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drink_queue" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"queue_number" integer NOT NULL,
	"order_id" varchar NOT NULL,
	"customer_name" text NOT NULL,
	"table_number" text NOT NULL,
	"drink_name" text NOT NULL,
	"item_type" text DEFAULT 'drink' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"status" text DEFAULT 'waiting' NOT NULL,
	"order_type" text DEFAULT 'dine_in' NOT NULL,
	"branch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'operational' NOT NULL,
	"recorded_by" varchar NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"current_stock" integer NOT NULL,
	"min_stock" integer NOT NULL,
	"max_stock" integer NOT NULL,
	"unit" text NOT NULL,
	"price_per_unit" integer NOT NULL,
	"supplier" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"phone" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_order_at" timestamp,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"discount_percent" integer DEFAULT 0 NOT NULL,
	"is_vip" boolean DEFAULT false NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "menu_item_ingredients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" varchar NOT NULL,
	"inventory_item_id" varchar NOT NULL,
	"quantity_needed" integer NOT NULL,
	"unit" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"category_id" varchar NOT NULL,
	"description" text,
	"image" text,
	"is_available" boolean DEFAULT true NOT NULL,
	"stock" integer,
	"branch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"requested_by" varchar NOT NULL,
	"related_id" varchar,
	"related_data" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"processed_by" varchar,
	"processed_at" timestamp,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" text NOT NULL,
	"table_number" text NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"payment_method" text DEFAULT 'qris' NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"pay_later" boolean DEFAULT false NOT NULL,
	"midtrans_order_id" text,
	"midtrans_transaction_id" text,
	"midtrans_transaction_status" text,
	"qris_url" text,
	"qris_string" text,
	"payment_expired_at" timestamp,
	"paid_at" timestamp,
	"order_status" text DEFAULT 'queued' NOT NULL,
	"customer_phone" text,
	"order_type" text DEFAULT 'dine_in' NOT NULL,
	"scheduled_time" text,
	"branch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "print_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"printer_type" text DEFAULT 'thermal' NOT NULL,
	"paper_size" text DEFAULT '58mm' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"print_header" boolean DEFAULT true NOT NULL,
	"print_footer" boolean DEFAULT true NOT NULL,
	"print_logo" boolean DEFAULT true NOT NULL,
	"font_size" integer DEFAULT 12 NOT NULL,
	"line_spacing" integer DEFAULT 1 NOT NULL,
	"connection_type" text DEFAULT 'browser' NOT NULL,
	"connection_string" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refunds" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"original_amount" integer NOT NULL,
	"refund_amount" integer NOT NULL,
	"refund_type" text NOT NULL,
	"reason" text NOT NULL,
	"requested_by" varchar NOT NULL,
	"authorized_by" varchar,
	"status" text DEFAULT 'pending' NOT NULL,
	"authorization_code" text,
	"processed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_name" text NOT NULL,
	"phone_number" text NOT NULL,
	"guest_count" integer NOT NULL,
	"reservation_date" timestamp NOT NULL,
	"reservation_time" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"room_preference" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"username" text NOT NULL,
	"role" text NOT NULL,
	"branch_id" varchar,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" varchar NOT NULL,
	"branch_id" varchar,
	"kasir_id" varchar NOT NULL,
	"kasir_name" text NOT NULL,
	"branch_name" text DEFAULT '',
	"report_date" text NOT NULL,
	"shift_start" timestamp NOT NULL,
	"shift_end" timestamp NOT NULL,
	"total_orders" integer DEFAULT 0,
	"total_paid" integer DEFAULT 0,
	"total_makanan" integer DEFAULT 0,
	"total_minuman" integer DEFAULT 0,
	"total_open_bill_pending" integer DEFAULT 0,
	"initial_cash" integer DEFAULT 0,
	"final_cash" integer DEFAULT 0,
	"system_cash" integer DEFAULT 0,
	"cash_difference" integer DEFAULT 0,
	"notes" text,
	"recap_data" jsonb,
	"status" text DEFAULT 'sent' NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cashier_id" varchar NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"initial_cash" integer DEFAULT 0 NOT NULL,
	"final_cash" integer,
	"system_cash" integer,
	"cash_difference" integer DEFAULT 0,
	"total_orders" integer DEFAULT 0,
	"total_revenue" integer DEFAULT 0,
	"total_cash_revenue" integer DEFAULT 0,
	"total_non_cash_revenue" integer DEFAULT 0,
	"status" text DEFAULT 'open' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" varchar NOT NULL,
	"inventory_item_name" text NOT NULL,
	"type" text NOT NULL,
	"quantity" integer NOT NULL,
	"stock_before" integer NOT NULL,
	"stock_after" integer NOT NULL,
	"reason" text,
	"order_id" varchar,
	"performed_by" varchar,
	"branch_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_profile" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_name" text DEFAULT 'Alonica' NOT NULL,
	"address" text DEFAULT 'Jl. Kuliner Rasa No. 123' NOT NULL,
	"phone" text DEFAULT '(021) 555-0123' NOT NULL,
	"email" text,
	"website" text,
	"description" text,
	"logo" text,
	"city" text DEFAULT 'Bantaeng',
	"opening_hours" text DEFAULT '08.30 – 23.00',
	"rating" text DEFAULT '4.9',
	"review_count" text DEFAULT '1.4rb ulasan',
	"tagline" text DEFAULT 'Minuman & makanan khas Bantaeng yang bikin betah',
	"multi_branch_enabled" boolean DEFAULT false NOT NULL,
	"wifi_name" text,
	"wifi_password" text,
	"custom_receipt_header" text,
	"custom_receipt_footer" text,
	"show_cashier_name" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" varchar,
	"number" text NOT NULL,
	"name" text,
	"capacity" integer DEFAULT 4 NOT NULL,
	"room" text DEFAULT 'indoor' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text,
	"role" text DEFAULT 'admin' NOT NULL,
	"branch_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"allowed_menus" jsonb DEFAULT 'null'::jsonb,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletion_logs" ADD CONSTRAINT "deletion_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletion_logs" ADD CONSTRAINT "deletion_logs_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletion_logs" ADD CONSTRAINT "deletion_logs_authorized_by_users_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletion_pins" ADD CONSTRAINT "deletion_pins_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drink_queue" ADD CONSTRAINT "drink_queue_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drink_queue" ADD CONSTRAINT "drink_queue_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_ingredients" ADD CONSTRAINT "menu_item_ingredients_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item_ingredients" ADD CONSTRAINT "menu_item_ingredients_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_authorized_by_users_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_reports" ADD CONSTRAINT "shift_reports_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_reports" ADD CONSTRAINT "shift_reports_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_reports" ADD CONSTRAINT "shift_reports_kasir_id_users_id_fk" FOREIGN KEY ("kasir_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_performed_by_idx" ON "audit_logs" USING btree ("performed_by","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "banners_is_active_idx" ON "banners" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "banners_sort_order_idx" ON "banners" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "banners_branch_id_idx" ON "banners" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "branches_is_active_idx" ON "branches" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "cash_movements_shift_id_idx" ON "cash_movements" USING btree ("shift_id","created_at");--> statement-breakpoint
CREATE INDEX "cash_movements_created_at_idx" ON "cash_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "categories_is_active_idx" ON "categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "categories_branch_id_idx" ON "categories" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "daily_reports_cashier_report_date_idx" ON "daily_reports" USING btree ("cashier_id","report_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "daily_reports_report_date_idx" ON "daily_reports" USING btree ("report_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "deletion_logs_order_id_idx" ON "deletion_logs" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "deletion_logs_requested_by_idx" ON "deletion_logs" USING btree ("requested_by","created_at");--> statement-breakpoint
CREATE INDEX "deletion_logs_created_at_idx" ON "deletion_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "deletion_pins_active_idx" ON "deletion_pins" USING btree ("is_active","created_at");--> statement-breakpoint
CREATE INDEX "deletion_pins_pin_idx" ON "deletion_pins" USING btree ("pin");--> statement-breakpoint
CREATE INDEX "discounts_is_active_idx" ON "discounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "drink_queue_status_idx" ON "drink_queue" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "drink_queue_branch_idx" ON "drink_queue" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "drink_queue_order_idx" ON "drink_queue" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "drink_queue_type_idx" ON "drink_queue" USING btree ("item_type","status");--> statement-breakpoint
CREATE INDEX "expenses_recorded_by_created_idx" ON "expenses" USING btree ("recorded_by","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "expenses_created_at_idx" ON "expenses" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "inventory_items_category_idx" ON "inventory_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "inventory_items_current_stock_idx" ON "inventory_items" USING btree ("current_stock");--> statement-breakpoint
CREATE INDEX "members_is_vip_idx" ON "members" USING btree ("is_vip");--> statement-breakpoint
CREATE INDEX "menu_item_ingredients_menu_item_id_idx" ON "menu_item_ingredients" USING btree ("menu_item_id");--> statement-breakpoint
CREATE INDEX "menu_item_ingredients_inventory_item_id_idx" ON "menu_item_ingredients" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "menu_items_category_id_idx" ON "menu_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "menu_items_availability_idx" ON "menu_items" USING btree ("is_available");--> statement-breakpoint
CREATE INDEX "menu_items_branch_id_idx" ON "menu_items" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "notifications_unread_idx" ON "notifications" USING btree ("is_read","status");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "orders_payment_method_idx" ON "orders" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "orders_order_status_idx" ON "orders" USING btree ("order_status");--> statement-breakpoint
CREATE INDEX "orders_table_number_idx" ON "orders" USING btree ("table_number");--> statement-breakpoint
CREATE INDEX "orders_branch_id_idx" ON "orders" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "refunds_order_id_idx" ON "refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "refunds_status_created_idx" ON "refunds" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "reservations_date_idx" ON "reservations" USING btree ("reservation_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reservations_status_idx" ON "reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "shift_reports_kasir_id_idx" ON "shift_reports" USING btree ("kasir_id","sent_at");--> statement-breakpoint
CREATE INDEX "shift_reports_branch_id_idx" ON "shift_reports" USING btree ("branch_id","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shifts_unique_open_per_cashier" ON "shifts" USING btree ("cashier_id") WHERE status = 'open';--> statement-breakpoint
CREATE INDEX "shifts_cashier_id_idx" ON "shifts" USING btree ("cashier_id","start_time");--> statement-breakpoint
CREATE INDEX "stock_movements_item_idx" ON "stock_movements" USING btree ("inventory_item_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "stock_movements_branch_idx" ON "stock_movements" USING btree ("branch_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "stock_movements_type_idx" ON "stock_movements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "tables_branch_idx" ON "tables" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "tables_room_idx" ON "tables" USING btree ("room");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "users_branch_id_idx" ON "users" USING btree ("branch_id");