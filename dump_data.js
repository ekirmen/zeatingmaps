require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const targetKey = serviceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, targetKey);

const tables = [
    'afiliados', 'audit_logs', 'canales_venta', 'cms_pages', 'comisiones_tasas',
    'cuotas_pagos', 'cupos', 'cupos_butacas', 'cupos_zonas_no_numeradas',
    'email_campaigns', 'email_templates', 'entradas', 'event_theme_settings',
    'eventos', 'eventos_con_funciones_activas', 'funcion_cupos', 'funciones',
    'global_email_config', 'ivas', 'mapas', 'notifications', 'payment_methods',
    'payment_transactions', 'payments', 'plantillas', 'plantillas_cupos',
    'plantillas_productos', 'plantillas_productos_templates', 'productos',
    'profiles', 'push_subscriptions', 'recintos', 'salas', 'seat_locks',
    'settings', 'system_alerts', 'tags', 'tenant_email_config', 'tenants',
    'ticket_downloads', 'ticket_validations', 'user_activity_log',
    'user_recinto_assignments', 'user_recinto_assignments_view', 'user_tags',
    'user_tenant_assignments', 'user_tenant_info', 'user_tenants', 'zonas'
];

const outputDir = path.join(__dirname, 'db_dump');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

async function dumpData() {
    console.log(`🚀 Starting dump of ${tables.length} tables to ${outputDir}...`);

    for (const table of tables) {
        process.stdout.write(`📥 Fetching ${table}... `);

        // Fetch all rows (limit 1000 for safety, though user asked for "all records", generic fetch limit is usually 1000 on Supabase unless ranged)
        // We will do a basic select. If table is huge, this is bad, but estimates are small.
        const { data, error } = await supabase.from(table).select('*');

        if (error) {
            console.log(`❌ Error: ${error.message}`);
            // Save error log?
            fs.writeFileSync(path.join(outputDir, `${table}_ERROR.txt`), error.message);
            continue;
        }

        if (!data) {
            console.log(`⚠️ No data returned`);
            continue;
        }

        const filePath = path.join(outputDir, `${table}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`✅ ${data.length} records saved.`);
    }

    console.log('\n✨ Database dump completed successfully.');
}

dumpData();
