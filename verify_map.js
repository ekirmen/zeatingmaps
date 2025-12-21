require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Falta SUPABASE_URL o SUPABASE_ANON_KEY en .env');
    process.exit(1);
}

console.log('Connecting to:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyMap() {
    // Check map 158 (from logs)
    const mapId = 158;
    console.log(`\nVerificando mapa ID ${mapId}...`);

    const { data, error } = await supabase
        .from('mapas')
        .select('id, imagen_fondo, updated_at')
        .eq('id', mapId)
        .single();

    if (error) {
        console.error('❌ Error query:', error.message);
    } else {
        console.log('✅ Datos en DB:');
        console.log('ID:', data.id);
        console.log('Imagen Fondo:', data.imagen_fondo);
        console.log('Updated:', data.updated_at);

        if (data.imagen_fondo && data.imagen_fondo.startsWith('http')) {
            console.log('\n✅ La URL es válida (no es base64).');
            console.log('Prueba abrir esto en tu navegador entrañable:');
            console.log(data.imagen_fondo);
        } else {
            console.log('\n⚠️ ADVERTENCIA: La imagen no parece ser una URL válida.');
        }
    }
}

verifyMap();
