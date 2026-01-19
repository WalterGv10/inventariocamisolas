
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanLogs() {
    console.log('🧹 Iniciando limpieza total de historial (movimientos_inventario)...');

    // Delete all rows from 'movimientos_inventario'
    // using a dummy filter that matches everything usually: id > 0 (if id is int)
    const { error, count } = await supabase
        .from('movimientos_inventario')
        .delete()
        .neq('id', -1); // Deletes all rows where ID is distinct from -1 (basically all)

    if (error) {
        console.error('❌ Error al borrar historial:', error.message);
    } else {
        console.log(`✅ Historial eliminado correctamente.`);
    }
}

cleanLogs();
