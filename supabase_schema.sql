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
);

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
-- In production, you should restrict these to authenticated users only
CREATE POLICY "Allow public insert on inventario" 
  ON public.inventario FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update on inventario" 
  ON public.inventario FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public insert on movimientos" 
  ON public.movimientos_inventario FOR INSERT 
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
ORDER BY c.equipo, c.color, i.talla;
