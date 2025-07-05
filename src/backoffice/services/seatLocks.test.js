jest.mock('./supabaseClient', () => ({}));

jest.mock('../../services/firebaseClient', () => ({
  getDatabaseInstance: jest.fn(() => Promise.resolve({}))
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn((db, path) => ({ db, path })),
  set: jest.fn(() => Promise.resolve()),
  remove: jest.fn(() => Promise.resolve())
}));


import { lockSeat, unlockSeat } from './seatLocks';

describe('seatLocks service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lockSeat writes to Firebase with normalized id', async () => {
    const { set } = require('firebase/database');
    await lockSeat('silla_abc', 'bloqueado', 'func1');
    expect(set).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        status: 'bloqueado',
        timestamp: expect.any(Number),
        session_id: expect.any(String),
        expires: expect.any(Number),
      })
    );
  });


  test('unlockSeat removes path from Firebase', async () => {
    const { remove } = require('firebase/database');
    await unlockSeat('silla_def', 'func1');
    expect(remove).toHaveBeenCalledWith(expect.any(Object));
  });
});
