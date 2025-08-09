/*
  Chequeo básico de Supabase: conectividad y columnas claves en tablas críticas.
  Usa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY del entorno.
*/
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function hasColumn(table, column) {
  // Intentar seleccionar SOLO esa columna; si no existe, PostgREST devuelve error 42703
  const { data, error } = await supabase.from(table).select(column).limit(1);
  if (error) {
    // 42703 = undefined_column
    if (error.code === '42703' || /does not exist/i.test(error.message || '')) return false;
    throw new Error(`No se pudo verificar columna ${table}.${column}: ${error.message}`);
  }
  return true;
}

async function tableExists(table) {
  const { error } = await supabase.from(table).select('*').limit(1);
  if (error) {
    // 42P01 = undefined_table
    if (error.code === '42P01' || /does not exist/i.test(error.message || '')) return false;
    // Otros errores (p.ej. RLS) siguen contando como tabla existente
  }
  return true;
}

async function checkTableHasColumns(table, columns) {
  for (const col of columns) {
    const ok = await hasColumn(table, col);
    if (!ok) throw new Error(`Tabla/columnas inválidas en ${table}: column ${table}.${col} does not exist`);
  }
  return true;
}

async function checkAnyGroupColumns(table, anyGroups, warnOnMissing = false) {
  for (const group of anyGroups) {
    let satisfied = false;
    for (const col of group) {
      // eslint-disable-next-line no-await-in-loop
      if (await hasColumn(table, col)) { satisfied = true; break; }
    }
    if (!satisfied) {
      if (warnOnMissing) {
        process.stdout.write(`AVISO: falta una de [${group.join(', ')}]; continuando... `);
        return true;
      }
      throw new Error(`Tabla/columnas inválidas en ${table}: falta una de [${group.join(', ')}]`);
    }
  }
  return true;
}

async function main() {
  const checksAll = [
    { table: 'recintos', columns: ['id', 'nombre'] },
    { table: 'salas', columns: ['id', 'recinto_id'] },
    { table: 'eventos', columns: ['id', 'recinto_id'] },
    // seats: aceptar esquemas alternativos
    { table: 'seats', columns: [], anyOf: [
      ['id', '_id', 'seat_id'],
      ['sala_id', 'sala', 'salaId', 'room_id', 'sala_uuid'],
      ['funcion_id', 'funcion', 'funcionId', 'function_id']
    ], optional: true },
    { table: 'zonas', columns: ['id', 'sala_id'] },
    { table: 'mapas', columns: ['id', 'sala_id'] },
    { table: 'plantillas_precios', columns: ['id'] },
    { table: 'zonas_precios', columns: ['id', 'plantilla_id'] },
    { table: 'plantillas_productos_template', columns: ['id', 'evento_id'] },
    { table: 'plantillas_productos', columns: ['id'] },
  ];

  for (const c of checksAll) {
    process.stdout.write(`Verificando ${c.table}... `);
    // eslint-disable-next-line no-await-in-loop
    if (!(await tableExists(c.table))) {
      process.stdout.write('(no existe, omitido)\n');
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    if (c.columns && c.columns.length) await checkTableHasColumns(c.table, c.columns);
    // eslint-disable-next-line no-await-in-loop
    if (c.anyOf && c.anyOf.length) await checkAnyGroupColumns(c.table, c.anyOf, !!c.optional);
    process.stdout.write('OK\n');
  }

  // Funciones: aceptar esquemas antiguos o nuevos
  process.stdout.write('Verificando funciones... ');
  await checkTableHasColumns('funciones', ['id']);
  await checkAnyGroupColumns('funciones', [
    ['evento_id', 'evento'],
    ['sala_id', 'sala']
  ]);
  process.stdout.write('OK\n');

  console.log('Chequeos de BD completados con éxito.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


