import handler from '../../../api/mapas/[salaId]/save';

// Mock Supabase admin client
const upsertMock = jest.fn(async () => ({ error: null }));
const maybeSingleMock = jest.fn(async () => ({ data: { sala_id: '7', contenido: [] }, error: null }));
const selectMock = jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: maybeSingleMock })) }));
const selectFuncionesMock = jest.fn(() => ({ eq: jest.fn(() => ({ data: [], error: null })) }));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: (table) => {
      if (table === 'mapas') {
        return {
          upsert: upsertMock,
          select: selectMock,
        };
      }
      if (table === 'funciones') {
        return { select: jest.fn(() => ({ eq: jest.fn(() => ({ data: [], error: null })) })) };
      }
      if (table === 'seats') {
        return { select: jest.fn(() => ({ eq: jest.fn(async () => ({ data: [], error: null })) })), upsert: jest.fn(async () => ({ error: null })) };
      }
      return {};
    },
  })),
}));

function createRes() {
  return {
    _status: 0,
    headers: {},
    body: null,
    setHeader: function (k, v) { this.headers[k] = v; },
    status: function (s) { this._status = s; return this; },
    json: function (b) { this.body = b; return this; },
    end: function () { return this; },
  };
}

beforeAll(() => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
});

test('OPTIONS responde 204 y headers CORS', async () => {
  const req = { method: 'OPTIONS', query: {} };
  const res = createRes();
  await handler(req, res);
  expect(res._status).toBe(204);
  expect(res.headers['Access-Control-Allow-Methods']).toContain('POST');
});

test('Method not allowed para GET', async () => {
  const req = { method: 'GET', query: {} };
  const res = createRes();
  await handler(req, res);
  expect(res._status).toBe(405);
});

test('POST sin salaId -> 400', async () => {
  const req = { method: 'POST', query: {}, body: { contenido: [] } };
  const res = createRes();
  await handler(req, res);
  expect(res._status).toBe(400);
});

test('POST con salaId y contenido vacío hace upsert y devuelve 200', async () => {
  const req = { method: 'POST', query: { salaId: '7' }, body: { contenido: [] } };
  const res = createRes();
  await handler(req, res);
  expect(res._status).toBe(200);
  expect(upsertMock).toHaveBeenCalled();
  expect(res.body?.success).toBe(true);
});


