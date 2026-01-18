import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Camisola } from '../types';

/**
 * Custom hook to fetch the list of Jersey Models (Camisolas).
 * 
 * Fetches data from the 'camisolas' table in Supabase.
 * Returns:
 * - camisolas: Array of jersey models.
 * - loading: Loading state boolean.
 * 
 * ---
 * 
 * Hook personalizado para obtener la lista de Modelos de Camisolas.
 * 
 * Obtiene datos de la tabla 'camisolas' en Supabase.
 * Retorna:
 * - camisolas: Array de modelos de camisolas.
 * - loading: Booleano de estado de carga.
 */
export function useCamisolas() {
    const [camisolas, setCamisolas] = useState<Camisola[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCamisolas = async () => {
            try {
                const { data, error } = await supabase
                    .from('camisolas')
                    .select('*')
                    .order('equipo');

                if (error) throw error;
                setCamisolas(data || []);
            } catch (err) {
                console.error('Error fetching camisolas:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCamisolas();
    }, []);

    return { camisolas, loading };
}
