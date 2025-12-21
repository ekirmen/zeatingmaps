require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const targetKey = serviceKey || supabaseAnonKey;
const supabase = createClient(supabaseUrl, targetKey);

// 1. Find Tables via Grep
console.log('🔍 Scanning code for tables...');
let tableNames = new Set();
try {
    // Grep for .from('...')
    const output = execSync('grep -r "\\.from(" src').toString();
    const regex = /\.from\(['"`]([a-zA-Z0-9_]+)['"`]\)/g;
    let match;
    while ((match = regex.exec(output)) !== null) {
        tableNames.add(match[1]);
    }
} catch (e) {
    console.log('Grep failed or found nothing, using defaults.');
}

// Default known tables if grep fails
const knownTables = [
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
knownTables.forEach(t => tableNames.add(t));

console.log(`Found ${tableNames.size} potential tables:`, [...tableNames]);

async function generateSchema() {
    const schemaOut = [];

    for (const table of tableNames) {
        if (table.includes(' ')) continue; // Skip invalid
        process.stdout.write(`\n📄 Analyzing table '${table}'... `);

        // Fetch 1 row to guess columns
        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            process.stdout.write(`❌ Error: ${error.message}`);
            continue;
        }

        if (!data || data.length === 0) {
            process.stdout.write(`⚠️ Empty (Columns unknown)`);
            schemaOut.push(`-- Table: ${table} (Empty, structure unknown)\nCREATE TABLE ${table} ();\n`);
            continue;
        }

        // Guess types from first row
        const row = data[0];
        const columns = Object.keys(row).map(col => {
            const val = row[col];
            let type = 'TEXT';
            if (typeof val === 'number') type = Number.isInteger(val) ? 'INTEGER' : 'FLOAT';
            if (typeof val === 'boolean') type = 'BOOLEAN';
            if (typeof val === 'object') type = 'JSONB';
            // Detect UUID/Date roughly? 
            if (typeof val === 'string') {
                if (val.match(/^\d{4}-\d{2}-\d{2}T/)) type = 'TIMESTAMP';
                else if (val.match(/^[0-9a-f]{8}-/)) type = 'UUID';
            }
            return `    ${col} ${type}`;
        });

        process.stdout.write(`✅ ${columns.length} columns`);
        schemaOut.push(`CREATE TABLE ${table} (\n${columns.join(',\n')}\n);\n`);
    }

    fs.writeFileSync('schema_dump.sql', schemaOut.join('\n'));
    console.log('\n\n✨ Schema dump saved to schema_dump.sql');
}

generateSchema();
