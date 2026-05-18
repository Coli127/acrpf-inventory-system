-- Fix RLS policies for tables that are blocking authenticated users
-- Run this in Supabase Dashboard > SQL Editor

-- CUSTOMERS
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
CREATE POLICY "Authenticated users can manage customers" ON customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PURCHASE ORDERS
DROP POLICY IF EXISTS "Authenticated users can manage purchase_orders" ON purchase_orders;
CREATE POLICY "Authenticated users can manage purchase_orders" ON purchase_orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PURCHASE ORDER ITEMS
DROP POLICY IF EXISTS "Authenticated users can manage purchase_order_items" ON purchase_order_items;
CREATE POLICY "Authenticated users can manage purchase_order_items" ON purchase_order_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ACTIVITY LOG
DROP POLICY IF EXISTS "Authenticated users can view activity_log" ON activity_log;
DROP POLICY IF EXISTS "Authenticated users can insert activity_log" ON activity_log;
CREATE POLICY "Authenticated users can manage activity_log" ON activity_log
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can manage notifications" ON notifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PROFILES
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Authenticated users can manage profiles" ON profiles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
