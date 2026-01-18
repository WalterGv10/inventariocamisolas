-- ============================================================================
-- SCRIPT: Inicializar todos los modelos
-- ============================================================================
-- Este script asegurará que los 7 modelos existan en la tabla de inventario
-- con todas sus tallas (S, M, L, XL) inicializadas en 0.

INSERT INTO public.inventario (camisola_id, talla, cantidad, muestras, vendidas)
SELECT 
    c.id, 
    t.talla, 
    0, -- Stock inicial
    0, -- Muestras inicial
    0  -- Vendidas inicial
FROM public.camisolas c
CROSS JOIN (VALUES ('S'), ('M'), ('L'), ('XL')) AS t(talla)
ON CONFLICT (camisola_id, talla) DO NOTHING;

-- Verificación (Opcional)
-- SELECT count(*) FROM public.inventario; 
-- Debería dar 28 filas (7 modelos * 4 tallas)
