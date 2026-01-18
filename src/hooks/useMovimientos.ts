import { supabase } from '../lib/supabase';
import type { MovimientoInventario } from '../types';

/**
 * Custom hook for Inventory Operations/Movements.
 * 
 * Provides methods for:
 * - createMovimiento: Logs a movement and automatically updates inventory counts (Transactional-ish).
 * - updateInventarioDirect: Direct +/- updates to inventory fields (Admin quick actions).
 * - moveInventory: Transfers stock between categories (e.g., Stock to Samples).
 * - resetAllInventario: DANGER. Resets all counts to zero.
 * 
 * ---
 * 
 * Hook personalizado para Operaciones/Movimientos de Inventario.
 * 
 * Provee métodos para:
 * - createMovimiento: Registra un movimiento y actualiza automáticamente conteos (Transaccional).
 * - updateInventarioDirect: Actualizaciones directas +/- a campos de inventario (Acciones rápidas de Admin).
 * - moveInventory: Transfiere stock entre categorías (ej. Stock a Muestras).
 * - resetAllInventario: PELIGRO. Reinicia todos los conteos a cero.
 */
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
                .select('*')
                .eq('camisola_id', movimiento.camisola_id)
                .eq('talla', movimiento.talla)
                .single();

            if (invFetchError && invFetchError.code !== 'PGRST116') throw invFetchError;

            // Calculate new values based on movement type
            let updateData: any = { updated_at: new Date().toISOString() };
            const currentStock = invData?.cantidad || 0;
            const currentMuestras = invData?.muestras || 0;
            const currentVendidas = invData?.vendidas || 0;

            if (movimiento.tipo === 'entrada') {
                updateData.cantidad = currentStock + movimiento.cantidad;
            } else if (movimiento.tipo === 'salida') {
                updateData.cantidad = Math.max(0, currentStock - movimiento.cantidad);
            } else if (movimiento.tipo === 'a_muestra') {
                if (currentStock < movimiento.cantidad) throw new Error('Stock insuficiente para mover a muestras');
                updateData.cantidad = currentStock - movimiento.cantidad;
                updateData.muestras = currentMuestras + movimiento.cantidad;
            } else if (movimiento.tipo === 'venta') {
                if (currentStock < movimiento.cantidad) throw new Error('Stock insuficiente para registrar venta');
                updateData.cantidad = currentStock - movimiento.cantidad;
                updateData.vendidas = currentVendidas + movimiento.cantidad;
            }

            const { error: upsertError } = await supabase
                .from('inventario')
                .upsert({
                    camisola_id: movimiento.camisola_id,
                    talla: movimiento.talla,
                    ...updateData
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
