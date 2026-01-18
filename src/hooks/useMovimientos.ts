import { supabase } from '../lib/supabase';
import type { MovimientoInventario } from '../types';

export function useMovimientos() {
    const createMovimiento = async (movimiento: MovimientoInventario) => {
        try {
            // 1. Insert the movement log
            const { error: moveError } = await supabase
                .from('movimientos_inventario')
                .insert([movimiento]);

            if (moveError) throw moveError;

            // 2. Update the inventory count
            const { data: invData, error: invFetchError } = await supabase
                .from('inventario')
                .select('cantidad')
                .eq('camisola_id', movimiento.camisola_id)
                .eq('talla', movimiento.talla)
                .single();

            if (invFetchError && invFetchError.code !== 'PGRST116') throw invFetchError;

            const currentCantidad = invData?.cantidad || 0;
            const newCantidad = movimiento.tipo === 'entrada'
                ? currentCantidad + movimiento.cantidad
                : Math.max(0, currentCantidad - movimiento.cantidad);

            const { error: upsertError } = await supabase
                .from('inventario')
                .upsert({
                    camisola_id: movimiento.camisola_id,
                    talla: movimiento.talla,
                    cantidad: newCantidad,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'camisola_id,talla' });

            if (upsertError) throw upsertError;

            return { success: true };
        } catch (err) {
            console.error('Error creating movement:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
        }
    };

    const updateInventarioDirect = async (id: number, field: 'cantidad' | 'muestras' | 'vendidas', delta: number) => {
        try {
            // Fetch current record
            const { data, error: fetchError } = await supabase
                .from('inventario')
                .select(field)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            const newValue = Math.max(0, (data as any)[field] + delta);

            const { error: updateError } = await supabase
                .from('inventario')
                .update({ [field]: newValue })
                .eq('id', id);

            if (updateError) throw updateError;
            return { success: true };
        } catch (err) {
            console.error('Error updating inventory:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
        }
    };

    const moveInventory = async (id: number, fromField: 'cantidad' | 'muestras' | 'vendidas', toField: 'cantidad' | 'muestras' | 'vendidas', amount: number) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('inventario')
                .select('cantidad, muestras, vendidas')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            const currentFrom = (data as any)[fromField] || 0;
            const currentTo = (data as any)[toField] || 0;

            if (currentFrom < amount) throw new Error('No hay suficiente cantidad para mover');

            const { error: updateError } = await supabase
                .from('inventario')
                .update({
                    [fromField]: currentFrom - amount,
                    [toField]: currentTo + amount
                })
                .eq('id', id);

            if (updateError) throw updateError;
            return { success: true };
        } catch (err) {
            console.error('Error moving inventory:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
        }
    };

    const resetAllInventario = async () => {
        try {
            const { error } = await supabase
                .from('inventario')
                .update({ cantidad: 0, muestras: 0, vendidas: 0 })
                .neq('cantidad', -1);

            if (error) throw error;
            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
        }
    };

    const getRecentMovements = async (limit: number = 10) => {
        try {
            const { data, error } = await supabase
                .from('movimientos_inventario')
                .select(`
                    *,
                    camisolas (
                        equipo,
                        color
                    )
                `)
                .order('fecha', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            console.error('Error fetching recent movements:', err);
            return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
        }
    };

    return { createMovimiento, updateInventarioDirect, moveInventory, resetAllInventario, getRecentMovements };
}
