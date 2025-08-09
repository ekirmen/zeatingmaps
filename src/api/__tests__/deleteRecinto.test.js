// Mock supabase-js admin client BEFORE loading handler
jest.mock('@supabase/supabase-js', () => {
  const { buildClient, resetSupabaseMock, setTableHandlers } = require('../../test-utils/supabaseMock');
  resetSupabaseMock();
  setTableHandlers('eventos', { select: async () => ({ data: [{ id: 'e1' }], error: null }) });
  setTableHandlers('funciones', { select: async () => ({ data: [{ id: 'f1' }], error: null }) });
  setTableHandlers('seat_locks', { delete: async () => ({ error: null }) });
  setTableHandlers('seats', { delete: async () => ({ error: null }) });
  setTableHandlers('plantillas_productos_template', { delete: async () => ({ error: null }) });
  setTableHandlers('plantillas_productos', { delete: async () => ({ error: null }) });
  setTableHandlers('eventos', { delete: async () => ({ error: null }) });
  setTableHandlers('salas', { delete: async () => ({ error: null }) });
  setTableHandlers('recintos', { delete: async () => ({ error: null }) });
  return {
    createClient: jest.fn(() => buildClient())
  };
});

import handler from '../../../api/recintos/[id]/delete';

describe.skip('DELETE /api/recintos/[id]/delete', () => {
  test('method not allowed', async () => {
    const req = { method: 'GET', query: { id: 'r1' } };
    const json = jest.fn();
    const res = { status: jest.fn(() => ({ json })) };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  test('missing id', async () => {
    const req = { method: 'DELETE', query: {} };
    const json = jest.fn();
    const res = { status: jest.fn(() => ({ json })) };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'Missing recinto id' });
  });

  test('success path', async () => {
    const req = { method: 'DELETE', query: { id: 'r1' } };
    const json = jest.fn();
    const res = { status: jest.fn(function() { return { json }; }) };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ success: true, message: 'Recinto eliminado con cascada' });
  });
});


