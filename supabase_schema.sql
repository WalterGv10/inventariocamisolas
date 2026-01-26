-- ============================================
-- Jersey Inventory Management System
-- Supabase Database Schema
-- ============================================

-- Table: camisolas (Jersey Products)
-- Stores the catalog of available jersey products
CREATE TABLE IF NOT EXISTS public.camisolas (
  id TEXT PRIMARY KEY,
  equipo TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
  created_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT
);

-- Table: profiles (User Profiles)
-- Extends the auth.users table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'viewer' -- Default role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Table: inventario (Inventory/Stock)
-- Stores current stock levels for each product variant (jersey + size)
CREATE TABLE IF NOT EXISTS public.inventario (
  id BIGSERIAL PRIMARY KEY,
  camisola_id TEXT NOT NULL REFERENCES public.camisolas(id) ON DELETE CASCADE,
  talla TEXT NOT NULL CHECK (talla IN ('S', 'M', 'L', 'XL')),
  cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(camisola_id, talla)
);

-- Table: movimientos_inventario (Inventory Movements)
-- Audit trail for all stock entries and exits
CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
  id BIGSERIAL PRIMARY KEY,
  camisola_id TEXT NOT NULL REFERENCES public.camisolas(id) ON DELETE CASCADE,
  talla TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'a_muestra', 'venta')),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  descripcion TEXT,
  fecha_entrega DATE,
  precio_venta NUMERIC,
  usuario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_inventario_camisola ON public.inventario(camisola_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_camisola ON public.movimientos_inventario(camisola_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON public.movimientos_inventario(fecha DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.camisolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- Allow public read access (modify based on your authentication needs)
CREATE POLICY "Allow public read access on camisolas" 
  ON public.camisolas FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access on inventario" 
  ON public.inventario FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read access on movimientos" 
  ON public.movimientos_inventario FOR SELECT 
  USING (true);

-- Allow public write access (IMPORTANT: Update these policies for production!)
-- Allow authenticated write access
CREATE POLICY "Allow authenticated insert on inventario" 
  ON public.inventario FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on inventario" 
  ON public.inventario FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on movimientos" 
  ON public.movimientos_inventario FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- Initial Data Seeding
-- ============================================

-- Insert jersey products
INSERT INTO public.camisolas (id, equipo, color) VALUES
  ('rm_blanca', 'Real Madrid', 'Blanca'),
  ('rm_negra', 'Real Madrid', 'Negra'),
  ('rm_azul', 'Real Madrid', 'Azul'),
  ('bar_azulgrana', 'Barcelona', 'Azulgrana'),
  ('bar_verde_serpiente', 'Barcelona', 'Verde Serpiente'),
  ('bar_rosa_coral', 'Barcelona', 'Rosa Coral'),
  ('bar_lamine_yamal', 'Barcelona', 'Lamine Yamal')
ON CONFLICT (id) DO NOTHING;

-- Insert sample inventory for Real Madrid Blanca
INSERT INTO public.inventario (camisola_id, talla, cantidad) VALUES
  ('rm_blanca', 'S', 10),
  ('rm_blanca', 'M', 15),
  ('rm_blanca', 'L', 12)
ON CONFLICT (camisola_id, talla) DO NOTHING;

-- Insert sample movement
INSERT INTO public.movimientos_inventario (camisola_id, talla, tipo, cantidad, fecha, descripcion) VALUES
  ('rm_blanca', 'M', 'salida', 1, '2026-01-16', 'Venta')
ON CONFLICT DO NOTHING;

-- ============================================
-- Helpful View (Optional)
-- ============================================

-- Create a view that joins inventory with product details
CREATE OR REPLACE VIEW public.inventario_completo AS
SELECT 
  i.id,
  i.camisola_id,
  c.equipo,
  c.color,
  i.talla,
  i.cantidad,
  i.updated_at
FROM public.inventario i
INNER JOIN public.camisolas c ON i.camisola_id = c.id

-- ============================================
-- Order Module Tables
-- ============================================

-- Table: pedidos (Order Header)
CREATE TABLE IF NOT EXISTS public.pedidos (
  id BIGSERIAL PRIMARY KEY,
  cliente_nombre TEXT NOT NULL,
  cliente_contacto TEXT,
  fecha_pedido TIMESTAMPTZ DEFAULT NOW(),
  fecha_entrega DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'entregado', 'cancelado')),
  total NUMERIC NOT NULL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: items_pedido (Order Line Items)
CREATE TABLE IF NOT EXISTS public.items_pedido (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('inventario', 'libre')),
  camisola_id TEXT REFERENCES public.camisolas(id), -- Nullable for 'libre'
  talla TEXT, -- Nullable for 'libre', strictly 'S','M','L','XL' if 'inventario' logic enforced at app level
  descripcion TEXT NOT NULL, -- Auto-filled for inventory, manual for libre
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC NOT NULL CHECK (precio_unitario >= 0)
);

-- Indexes for Orders
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON public.pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_items_pedido_pedido ON public.items_pedido(pedido_id);

-- RLS for Orders
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_pedido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on pedidos" 
  ON public.pedidos FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on pedidos" 
  ON public.pedidos FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on pedidos" 
  ON public.pedidos FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read on items_pedido" 
  ON public.items_pedido FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on items_pedido" 
  ON public.items_pedido FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on items_pedido" 
  ON public.items_pedido FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated delete on items_pedido" 
  ON public.items_pedido FOR DELETE 
  TO authenticated
  USING (true);

