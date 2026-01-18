-- ============================================================================
-- FIXED MIGRATION SCRIPT: Add 'muestras', 'vendidas' and Fix View
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Copy the ENTIRE content of this file.
-- 2. Go to your Supabase Dashboard -> SQL Editor.
-- 3. Paste and Run.
-- ============================================================================

-- 1. DROP the existing view first to avoid "cannot change name of view column" error
DROP VIEW IF EXISTS public.inventario_completo;

-- 2. Add new columns to 'inventario' table
ALTER TABLE public.inventario 
ADD COLUMN IF NOT EXISTS muestras INTEGER NOT NULL DEFAULT 0 CHECK (muestras >= 0);

ALTER TABLE public.inventario 
ADD COLUMN IF NOT EXISTS vendidas INTEGER NOT NULL DEFAULT 0 CHECK (vendidas >= 0);

-- 3. Recreate the view with the new columns
CREATE OR REPLACE VIEW public.inventario_completo AS
SELECT 
  i.id,
  i.camisola_id,
  c.equipo,
  c.color,
  i.talla,
  i.cantidad as stock,       -- Renaming 'cantidad' to 'stock' for clarity in frontend
  i.muestras,
  i.vendidas,
  i.updated_at
FROM public.inventario i
INNER JOIN public.camisolas c ON i.camisola_id = c.id
ORDER BY c.equipo, c.color, i.talla;
