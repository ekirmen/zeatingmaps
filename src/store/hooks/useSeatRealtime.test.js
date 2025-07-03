import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { useSeatRealtime } from './useSeatRealtime';

jest.mock('../../supabaseClient', () => {
  // Ensure named exports work correctly with ES module interop
  return {
    __esModule: true,
    ...(() => {
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
    })(),
  };
});

const { supabase, __callback } = require('../../supabaseClient');

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

function TestComp({ fid, onSeatUpdate }) {
  useSeatRealtime({ funcionId: fid, onSeatUpdate });
  return null;
}

describe('useSeatRealtime', () => {
  test('updates seat state on payload', () => {
    const onSeatUpdate = jest.fn();
    render(<TestComp fid="fun1" onSeatUpdate={onSeatUpdate} />);

    const cb = __callback();
    const payload = { new: { _id: 's1', status: 'reservado', bloqueado: false } };
    cb(payload);

    expect(onSeatUpdate).toHaveBeenCalledWith(payload);
  });
});
