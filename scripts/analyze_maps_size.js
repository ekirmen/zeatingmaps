
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeMaps() {
    console.log('🔍 Analyzing specific map for Funcion ID 43...');

    // 1. Get mapa_id from funcion 43
    const { data: funcion, error: funcError } = await supabase
        .from('funciones')
        .select('mapa_id')
        .eq('id', 43)
        .single();

    if (funcError) {
        console.error('Error fetching funcion 43:', funcError);
        // If we can't find function 43, maybe we scan all maps we can find
        console.log('⚠️ Could not find Funcion 43. Falling back to scanning all readable maps...');
    } else {
        console.log(`✅ Funcion 43 uses Map ID: ${funcion.mapa_id}`);
    }

    let query = supabase.from('mapas').select('id, nombre, contenido');

    if (funcion?.mapa_id) {
        query = query.eq('id', funcion.mapa_id);
    }

    const { data: maps, error } = await query;

    if (error) {
        console.error('Error fetching maps:', error);
        return;
    }

    if (!maps || maps.length === 0) {
        console.log('❌ No maps found (check RLS policies or ID).');
        return;
    }

    console.log(`Found ${maps.length} map(s) to analyze.`);

    const heavyMaps = [];

    maps.forEach(map => {
        let contentStr = '';
        try {
            contentStr = JSON.stringify(map.contenido);
        } catch (e) {
            console.error(`Error stringifying map ${map.id}`, e);
            return;
        }

        // Accurate byte size
        const sizeBytes = Buffer.byteLength(contentStr, 'utf8');
        const sizeMB = sizeBytes / 1024 / 1024;

        // Check for Base64 image patterns
        const base64Matches = contentStr.match(/data:image\/[a-zA-Z]+;base64,[^"]+/g);
        const base64Count = base64Matches ? base64Matches.length : 0;

        let base64TotalSize = 0;
        if (base64Matches) {
            base64Matches.forEach(match => {
                base64TotalSize += match.length;
            });
        }
        const base64SizeMB = base64TotalSize / 1024 / 1024;

        console.log(`Map ${map.id} ("${map.nombre}"): ${sizeMB.toFixed(2)} MB (${base64Count} base64 images, ${base64SizeMB.toFixed(2)} MB)`);

        if (sizeMB > 0.5 || base64Count > 0) {
            heavyMaps.push({
                id: map.id,
                nombre: map.nombre,
                totalSizeMB: sizeMB.toFixed(2),
                base64Images: base64Count,
                base64SizeMB: base64SizeMB.toFixed(2),
                percentageBase64: sizeMB > 0 ? ((base64SizeMB / sizeMB) * 100).toFixed(1) + '%' : '0%'
            });
        }
    });

    if (heavyMaps.length === 0) {
        console.log('✅ No heavy maps found among scanned maps.');
    } else {
        console.log('⚠️  Heavy Maps Detected:');
        console.table(heavyMaps);
        console.log('\nRecommendation: Re-upload background images for these maps using Supabase Storage URLs.');
    }
}

analyzeMaps();
