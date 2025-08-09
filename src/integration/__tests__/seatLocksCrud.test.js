/*
  Test de integración real contra Supabase para CRUD básico en seat_locks.
  Requiere variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
  Está pensado para ejecutarse en un entorno de pruebas: usa funcion_id sintético
  y borra sus propios registros.
*/
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY;
const runIntegration = !!url && !!key;

(runIntegration ? describe : describe.skip)('Integración DB - seat_locks CRUD', () => {
  const supabase = createClient(url, key);
  const funcionId = 987654321; // ID sintético seguro; no FK
  const sessionId = `itest-session-${Date.now()}`;
  const seatId = `itest-seat-${Date.now()}`;
  let createdId = null;

  test('insert -> select', async () => {
    const now = new Date();
    const lockedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    const { data: inserted, error: insertErr } = await supabase
      .from('seat_locks')
      .insert([{
        seat_id: seatId,
        funcion_id: funcionId,
        session_id: sessionId,
        locked_at: lockedAt,
        expires_at: expiresAt,
        status: 'locked',
        lock_type: 'seat',
      }])
      .select('*')
      .single();

    expect(insertErr).toBeNull();
    expect(inserted).toBeTruthy();
    createdId = inserted?.id || null;

    const { data: fetched, error: selErr } = await supabase
      .from('seat_locks')
      .select('*')
      .eq('seat_id', seatId)
      .eq('funcion_id', funcionId)
      .single();

    expect(selErr).toBeNull();
    expect(fetched?.session_id).toBe(sessionId);
  });

  test('update -> verify', async () => {
    expect(createdId).toBeTruthy();
    const { error: updErr } = await supabase
      .from('seat_locks')
      .update({ status: 'released' })
      .eq('id', createdId);
    expect(updErr).toBeNull();

    const { data: afterUpd, error: selErr } = await supabase
      .from('seat_locks')
      .select('status')
      .eq('id', createdId)
      .single();
    expect(selErr).toBeNull();
    expect(afterUpd?.status).toBe('released');
  });

  test('delete -> verify gone', async () => {
    expect(createdId).toBeTruthy();
    const { error: delErr } = await supabase
      .from('seat_locks')
      .delete()
      .eq('id', createdId);
    expect(delErr).toBeNull();

    const { data: afterDel, error: selErr } = await supabase
      .from('seat_locks')
      .select('id')
      .eq('id', createdId)
      .maybeSingle();
    // maybeSingle devuelve null si no hay fila
    expect(selErr).toBeNull();
    expect(afterDel).toBeNull();
  });
});


