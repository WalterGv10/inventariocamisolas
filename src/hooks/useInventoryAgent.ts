import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMovimientos } from './useMovimientos';
import { useInventario } from './useInventario';

/**
 * Custom hook to manage the Inventory Agent's data and state.
 * Extracts the logic for generating LED ticker segments from App.tsx.
 */
export function useInventoryAgent() {
    const { session, user } = useAuth();
    const { getRecentMovements } = useMovimientos();
    const { inventario } = useInventario();
    const [movementTexts, setMovementTexts] = useState<string[]>([]);

    useEffect(() => {
        const fetchMovements = async () => {
            const { success, data } = await getRecentMovements(100);
            if (success && data) {
                // 1. Filter by categories
                const sales = data.filter((m: any) => m.tipo === 'venta');
                const samples = data.filter((m: any) => m.tipo === 'a_muestra');
                const entries = data.filter((m: any) => m.tipo === 'entrada');

                const segments: string[] = [];

                // 1. BIENVENIDA & STATUS
                // Note: Time updates here are static at the moment of fetch. 
                // Using a simpler static string or just rely on the Agent component to render time if needed dynamically.
                // For now, mirroring original logic:
                const now = new Date();
                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const currentUserName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'ADMIN';
                segments.push(`[${timeStr}] WALWEB INVENTARIO V2.0 ::: STATUS: OPERATIVO ::: USUARIO: ${currentUserName.toUpperCase()}`);

                // 2. VENTAS (Líneas dedicadas)
                if (sales.length > 0) {
                    sales.slice(0, 5).forEach((m: any) => {
                        const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        segments.push(`💸 VENTA [${time}]: ${m.camisolas?.equipo} (${m.talla}) x${m.cantidad}`);
                    });
                } else {
                    segments.push(`💸 VENTAS: ESPERANDO PRIMER "GOAL" DEL DÍA ::: ¡VAMOS POR ESAS VENTAS! ⚽`);
                }

                // 3. EN MUESTRA (Líneas dedicadas)
                if (samples.length > 0) {
                    samples.slice(0, 5).forEach((m: any) => {
                        segments.push(`📋 MOSTRANDO: ${m.camisolas?.equipo} ::: CALIDAD PREMIUM G5`);
                    });
                } else {
                    segments.push(`📋 MUESTRAS: TODO EL STOCK ESTÁ EN ALMACÉN ::: LISTO PARA SALIR`);
                }

                // 4. DISPONIBLES / ENTRADAS (Líneas dedicadas o Datos Interesantes)
                if (entries.length > 0) {
                    entries.slice(0, 5).forEach((m: any) => {
                        segments.push(`🚀 NUEVO INGRESO: ${m.camisolas?.equipo} - ¡STOCK RENOVADO!`);
                    });
                } else {
                    const totalUnits = inventario.reduce((acc, curr) => acc + curr.cantidad, 0);
                    const sortedInventario = [...inventario].sort((a, b) => (b.vendidas || 0) - (a.vendidas || 0));
                    const bestSeller = sortedInventario[0];
                    segments.push(`📊 DATA: ${totalUnits} UNIDADES TOTALES EN STOCK ::: TOP VENTAS: ${bestSeller?.equipo || 'Cargando...'}`);
                }

                setMovementTexts(segments);
            }
        };

        if (session) {
            fetchMovements();
        }
        // Poll every minute or so? For now just on mount/dep change
    }, [session, inventario.length]); // Added inventario length as dep so stats update

    return { movementTexts };
}
