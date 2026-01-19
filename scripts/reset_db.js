
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function performReset() {
    console.log('Iniciando reinicio de inventario (Reset To Zero)...');

    try {
        // 1. Reset all inventory counts to 0
        const { error: updateError } = await supabase
            .from('inventario')
            .update({ cantidad: 0, muestras: 0, vendidas: 0 })
            .neq('cantidad', -1); // Update all rows (using a always-true condition if needed, or just no filter if enabled)

        if (updateError) {
            throw new Error(`Error reset inv: ${updateError.message}`);
        }

        console.log('✅ Inventario reiniciado a 0 exitosamente.');

        // 2. Log the event (Using a dummy record or creating a system log entry if possible)
        // We'll insert a dummy movement for a known item if we want to trace it in the 'movimientos_inventario' table
        // Or we just rely on console output if this is a manual run.
        console.log('✅ Base de datos a cero (excepto perfiles).');

    } catch (err) {
        console.error('❌ Error fatal:', err);
    }
}

performReset();
