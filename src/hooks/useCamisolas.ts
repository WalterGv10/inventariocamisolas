import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Camisola } from '../types';

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
