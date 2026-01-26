import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Pedido, ItemPedido } from '../types/orders';

export interface CreateOrderParams {
    cliente_nombre: string;
    cliente_contacto?: string;
    fecha_entrega?: string;
    notas?: string;
    items: ItemPedido[];
    tipo: 'venta' | 'abastecimiento' | 'despacho';
}

export function usePedidos() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPedidos = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('pedidos')
                .select(`
                    *,
                    items:items_pedido(*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPedidos(data || []);
        } catch (err: any) {
            console.error('Error fetching orders:', err);
            setError(err.message || (err instanceof Error ? err.message : 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    }, []);

    const createPedido = async (params: CreateOrderParams) => {
        try {
            setLoading(true);
            setError(null);

            // 1. Calculate total
            const total = params.items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

            // 2. Determine initial state
            const initialEstado = params.tipo === 'abastecimiento' ? 'pendiente_recibir' :
                params.tipo === 'despacho' ? 'pendiente_despacho' : 'pendiente';

            // 3. Insert Order Header
            const { data: orderData, error: orderError } = await supabase
                .from('pedidos')
                .insert([{
                    cliente_nombre: params.cliente_nombre,
                    cliente_contacto: params.cliente_contacto,
                    fecha_entrega: params.fecha_entrega || null,
                    notas: params.notas,
                    tipo: params.tipo,
                    estado: initialEstado,
                    total
                }])
                .select()
                .single();

            if (orderError) throw orderError;
            if (!orderData) throw new Error('No se pudo crear el pedido');

            const pedidoId = orderData.id;

            // 3. Insert Line Items
            const itemsToInsert = params.items.map(item => ({
                pedido_id: pedidoId,
                tipo: item.tipo,
                camisola_id: item.camisola_id || null, // Ensure explicit null if undefined
                talla: item.talla || null,
                descripcion: item.descripcion,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario
            }));

            const { error: itemsError } = await supabase
                .from('items_pedido')
                .insert(itemsToInsert);

            if (itemsError) {
                // Determine if we should rollback header? Supabase doesn't have multi-table transactions via client natively easily without RPC.
                // For now, we'll throw and user might see a partial state, but we can prevent it by strict checks before.
                // Ideally, use an RPC for this transaction.
                throw itemsError;
            }

            await fetchPedidos();
            return { success: true, orderId: pedidoId };

        } catch (err: any) {
            console.error('Error creating order:', err);
            return { success: false, error: err.message || (err instanceof Error ? err.message : 'Error creando pedido') };
        } finally {
            setLoading(false);
        }
    };

    const updateEstadoPedido = async (id: number, nuevoEstado: Pedido['estado']) => {
        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ estado: nuevoEstado })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update or refetch
            setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || (err instanceof Error ? err.message : 'Error actualizando estado') };
        }
    };

    const confirmarPedido = async (id: number, fechaConfirmacion: string, createMovimiento: any) => {
        try {
            setLoading(true);
            const pedido = pedidos.find(p => p.id === id);
            if (!pedido) throw new Error('Pedido no encontrado');

            let nuevoEstado: Pedido['estado'];
            let tipoMovimiento: 'entrada' | 'salida' | 'venta';

            if (pedido.tipo === 'abastecimiento') {
                nuevoEstado = 'recibido';
                tipoMovimiento = 'entrada';
            } else if (pedido.tipo === 'despacho') {
                nuevoEstado = 'despachado';
                tipoMovimiento = 'venta';
            } else {
                nuevoEstado = 'entregado';
                tipoMovimiento = 'venta';
            }

            // 1. Update Inventory for each item
            if (pedido.items) {
                for (const item of pedido.items) {
                    if (item.tipo === 'inventario' && item.camisola_id && item.talla) {
                        const res = await createMovimiento({
                            camisola_id: item.camisola_id,
                            talla: item.talla,
                            tipo: tipoMovimiento,
                            cantidad: item.cantidad,
                            fecha: fechaConfirmacion,
                            descripcion: `Confirmación Pedido #${pedido.id} (${pedido.tipo})`,
                            precio_venta: tipoMovimiento === 'venta' ? item.precio_unitario : undefined
                        });
                        if (!res.success) throw new Error(`Error actualizando stock para ${item.descripcion}: ${res.error}`);
                    }
                }
            }

            // 2. Update Order Status
            const { error: updateError } = await supabase
                .from('pedidos')
                .update({
                    estado: nuevoEstado,
                    fecha_confirmacion: fechaConfirmacion
                })
                .eq('id', id);

            if (updateError) throw updateError;

            await fetchPedidos();
            return { success: true };

        } catch (err: any) {
            console.error('Error confirmando pedido:', err);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Load initially
    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    return {
        pedidos,
        loading,
        error,
        createPedido,
        updateEstadoPedido,
        confirmarPedido,
        refetch: fetchPedidos
    };
}
