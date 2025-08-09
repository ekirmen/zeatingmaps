// Mock Supabase admin client used inside the handler (declare BEFORE importing handler)
jest.mock('@supabase/supabase-js', () => {
  const { buildClient, resetSupabaseMock, setTableHandlers } = require('../../test-utils/supabaseMock');
  resetSupabaseMock();
  // Default handlers for payments table
  setTableHandlers('payments', {
    select: async () => ({ data: { locator: 'abc', seats: [], status: 'paid', created_at: new Date().toISOString(), funcion: 'f1' }, error: null }),
  });
  return {
    createClient: jest.fn(() => buildClient())
  };
});

import handler from '../../../api/payments/[locator]/download';


jest.mock('../../backoffice/services/supabaseClient', () => ({
  supabaseAdmin: {
    auth: {
      getUser: jest.fn(() => ({ data: { user: { id: '1' } }, error: null }))
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => ({ data: { locator: 'abc' }, error: null }))
    }))
  }
}));

jest.mock('pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn(async () => ({
      addPage: jest.fn(() => ({ drawText: jest.fn() })),
      save: jest.fn(async () => new Uint8Array([1,2,3]))
    }))
  }
}));

describe.skip('download ticket handler', () => {
  test('missing locator', async () => {
    const req = { method: 'GET', query: {}, headers: { authorization: 'Bearer t' } };
    const json = jest.fn();
    const res = { status: jest.fn(() => ({ json })), setHeader: jest.fn() };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'Missing locator' });
  });

  test('missing auth token', async () => {
    const req = { method: 'GET', query: { locator: 'abc' }, headers: {} };
    const json = jest.fn();
    const res = { status: jest.fn(() => ({ json })), setHeader: jest.fn() };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('successful pdf', async () => {
    const send = jest.fn();
    const json = jest.fn();
    const res = { status: jest.fn(() => ({ send, json })), setHeader: jest.fn() };
    const req = { method: 'GET', query: { locator: 'abc' }, headers: { authorization: 'Bearer t' } };
    await handler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalled();
  });
});
