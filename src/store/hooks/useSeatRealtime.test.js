import React from 'react';
import { render, cleanup } from '@testing-library/react';
import useSeatRealtime from './useSeatRealtime';

jest.mock('../../backoffice/services/supabaseClient', () => {
  let callback = null;
  let subscribeCb = null;
  const channelObj = {
    on: jest.fn((event, opts, cb) => {
      callback = cb;
      return channelObj;
    }),
    subscribe: jest.fn((cb) => {
      subscribeCb = cb;
      return channelObj;
    }),
    onError: jest.fn(),
  };
  return {
    supabase: {
      channel: jest.fn(() => channelObj),
      removeChannel: jest.fn(),
    },
    __callback: () => callback,
    __subscribe: () => subscribeCb,
    __channel: channelObj,
  };
});

const { supabase, __callback } = require('../../backoffice/services/supabaseClient');

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

function TestComp({ fid, zonas, setMapa, cartRef }) {
  useSeatRealtime(fid, zonas, setMapa, cartRef);
  return null;
}

describe('useSeatRealtime', () => {
  test('updates seat state on payload', () => {
    const setMapa = jest.fn();
    const cartRef = { current: [] };
    const zonas = [{ id: 'z1', color: 'green' }];
    render(<TestComp fid="fun1" zonas={zonas} setMapa={setMapa} cartRef={cartRef} />);

    const cb = __callback();
    const payload = { new: { _id: 's1', status: 'reservado', bloqueado: false } };
    let result;
    setMapa.mockImplementation(fn => { result = fn({
      contenido: [{ zona: 'z1', sillas: [{ _id: 's1', zona: 'z1', estado: 'disponible', color: 'green' }] }]
    }); });
    cb(payload);

    expect(result.contenido[0].sillas[0]).toMatchObject({
      estado: 'reservado',
      color: 'red',
      selected: false
    });
  });
});
