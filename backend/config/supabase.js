const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let supabase = null;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Advertencia: SUPABASE_URL o SUPABASE_KEY no están configurados. La subida de imágenes fallará.');
} else {
    supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase;
