/*
  Integración: Crear datos mínimos y validar borrado en cascada con el endpoint API.
  Requiere SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY y que el endpoint /api/recintos/:id/delete esté deployado local o en Vercel.
  Para local, se puede ajustar BASE_URL al entorno que corresponda (ej. http://localhost:3000).
*/
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = process.env.INTEGRATION_BASE_URL || 'http://localhost:3000';
const runIntegration = !!url && !!key;

async function hasColumn(supabase, tableName, columnName) {
  try {
    const { error } = await supabase.from(tableName).select(columnName).limit(0);
    if (error) {
      const msg = `${error.message || ''}`;
      const code = `${error.code || ''}`;
      if (
        code === '42703' ||
        /column .* does not exist/i.test(msg) ||
        /Could not find the '.*' column/i.test(msg)
      ) {
        return false;
      }
      if (code === '42P01' || /relation ".*" does not exist/i.test(msg)) return false;
      throw error;
    }
    return true;
  } catch (err) {
    const msg = `${err.message || ''}`;
    const code = `${err.code || ''}`;
    if (code === '42P01' || /relation ".*" does not exist/i.test(msg)) return false;
    if (/Could not find the '.*' column/i.test(msg)) return false;
    throw err;
  }
}

async function setAllExistingColumns(supabase, tableName, payload, candidateColumns, value) {
  for (const c of candidateColumns) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await hasColumn(supabase, tableName, c);
    if (exists) payload[c] = value;
  }
}

async function createRecintoSalaEvento(supabase) {
  // RECINTO (nombre opcional)
  const recintoPayload = {};
  if (await hasColumn(supabase, 'recintos', 'nombre')) {
    recintoPayload.nombre = `itest-recinto-${Date.now()}`;
  }
  const { data: recinto, error: recErr } = await supabase
    .from('recintos')
    .insert([recintoPayload], { returning: 'representation' })
    .select('*')
    .single();
  if (recErr) throw recErr;

  // SALA (nombre opcional, FK a recinto flexible)
  const salaPayload = {};
  if (await hasColumn(supabase, 'salas', 'nombre')) salaPayload.nombre = 'Sala ITest';
  await setAllExistingColumns(supabase, 'salas', salaPayload, ['recinto_id', 'recinto'], recinto.id);

  const { data: sala, error: salaErr } = await supabase
    .from('salas')
    .insert([salaPayload])
    .select('*')
    .single();
  if (salaErr) throw salaErr;

  // EVENTO (nombre opcional, FK a recinto flexible, fecha/hora opcional)
  const eventoPayload = {};
  if (await hasColumn(supabase, 'eventos', 'nombre')) eventoPayload.nombre = 'Evento ITest';
  await setAllExistingColumns(supabase, 'eventos', eventoPayload, ['recinto_id', 'recinto'], recinto.id);
  await setAllExistingColumns(
    supabase,
    'eventos',
    eventoPayload,
    ['fecha_evento', 'fecha', 'fecha_celebracion', 'date'],
    '2100-01-01'
  );
  await setAllExistingColumns(
    supabase,
    'eventos',
    eventoPayload,
    ['hora_evento', 'hora', 'hora_inicio', 'time'],
    '20:00:00'
  );

  const { data: evento, error: evErr } = await supabase
    .from('eventos')
    .insert([eventoPayload])
    .select('*')
    .single();
  if (evErr) throw evErr;

  // FUNCION (nombre opcional, FKs flexibles, fecha/hora opcional y ventas)
  const funcionPayload = {};
  if (await hasColumn(supabase, 'funciones', 'nombre')) funcionPayload.nombre = 'Funcion ITest';
  await setAllExistingColumns(supabase, 'funciones', funcionPayload, ['evento_id', 'evento'], evento.id);
  await setAllExistingColumns(supabase, 'funciones', funcionPayload, ['sala_id', 'sala'], sala.id);
  await setAllExistingColumns(
    supabase,
    'funciones',
    funcionPayload,
    ['fecha', 'fecha_evento', 'fecha_celebracion', 'date'],
    '2100-01-01'
  );
  await setAllExistingColumns(
    supabase,
    'funciones',
    funcionPayload,
    ['hora', 'hora_evento', 'hora_inicio', 'time'],
    '20:00:00'
  );
  // Columnas de ventana de venta si existen
  const nowIso = new Date().toISOString();
  const laterIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await setAllExistingColumns(supabase, 'funciones', funcionPayload, ['inicio_venta', 'venta_inicio'], nowIso);
  await setAllExistingColumns(supabase, 'funciones', funcionPayload, ['fin_venta', 'venta_fin'], laterIso);

  const { data: funcion, error: fnErr } = await supabase
    .from('funciones')
    .insert([funcionPayload])
    .select('*')
    .single();
  if (fnErr) throw fnErr;

  return { recinto, sala, evento, funcion };
}

(runIntegration ? describe : describe.skip)('Integración API - borrado cascada de recinto', () => {
  const supabase = createClient(url, key);

  test('crea datos y valida borrado via endpoint', async () => {
    const { recinto, sala, evento, funcion } = await createRecintoSalaEvento(supabase);

    // Golpear endpoint de borrado
    const resp = await fetch(`${BASE_URL}/api/recintos/${recinto.id}/delete`, { method: 'DELETE' });
    const json = await resp.json();
    expect(resp.status).toBe(200);
    expect(json.success).toBe(true);

    // Verificar que se borró el recinto y entidades vinculadas
    const { data: r, error: rErr } = await supabase.from('recintos').select('id').eq('id', recinto.id).maybeSingle();
    expect(rErr).toBeNull();
    expect(r).toBeNull();

    const { data: s, error: sErr } = await supabase.from('salas').select('id').eq('id', sala.id).maybeSingle();
    expect(sErr).toBeNull();
    expect(s).toBeNull();

    const { data: e, error: eErr } = await supabase.from('eventos').select('id').eq('id', evento.id).maybeSingle();
    expect(eErr).toBeNull();
    expect(e).toBeNull();

    const { data: f, error: fErr } = await supabase.from('funciones').select('id').eq('id', funcion.id).maybeSingle();
    expect(fErr).toBeNull();
    expect(f).toBeNull();
  }, 30000);
});


