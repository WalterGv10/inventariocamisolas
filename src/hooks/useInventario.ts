import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { InventarioConDetalles } from '../types';

/**
 * Custom hook to fetch and subscribe to Inventory data.
 * 
 * - Fetches initial inventory state with joined product details (Camisolas).
 * - Subscribes to real-time changes in the 'inventario' table via Supabase.
 * - Provides refetch capability.
 * 
 * ---
 * 
 * Hook personalizado para obtener y suscribirse a datos de Inventario.
 * 
 * - Obtiene el estado inicial del inventario con detalles de producto unidos (Camisolas).
 * - Se suscribe a cambios en tiempo real en la tabla 'inventario' vía Supabase.
 * - Provee capacidad de recarga manual (refetch).
 */
export function useInventario() {
    const [inventario, setInventario] = useState<InventarioConDetalles[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInventario = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch inventory with product details
            const { data, error: fetchError } = await supabase
                .from('inventario')
                .select(`
                    id,
                    camisola_id,
                    talla,
                    cantidad,
                    muestras,
                    vendidas,
                    updated_at,
                    camisolas (
                        equipo,
                        color
                    )
                `)
                .order('camisola_id');

            if (fetchError) throw fetchError;

            const transformedData: InventarioConDetalles[] = (data || []).map((item: any) => ({
                id: item.id,
                camisola_id: item.camisola_id,
                talla: item.talla,
                cantidad: item.cantidad,
                muestras: item.muestras || 0,
                vendidas: item.vendidas || 0,
                updated_at: item.updated_at,
                equipo: item.camisolas?.equipo || '',
                color: item.camisolas?.color || '',
            }));

            setInventario(transformedData);
        } catch (err) {
            console.error('Error fetching inventario:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventario();

        const channel = supabase
            .channel('inventario-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventario' },
                () => fetchInventario()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return { inventario, loading, error, refetch: fetchInventario };
}
