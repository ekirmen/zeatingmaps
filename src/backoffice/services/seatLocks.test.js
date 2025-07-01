import { lockSeat, unlockSeat } from './seatLocks';

jest.mock('./supabaseClient', () => {
  const fromMock = jest.fn();
  const upsertMock = jest.fn().mockResolvedValue({ error: null });
  const eqMock = jest.fn().mockResolvedValue({ error: null });
  fromMock.mockReturnValue({
    upsert: upsertMock,
    delete: jest.fn(() => ({ eq: eqMock }))
  });
  return {
    supabase: { from: fromMock },
    supabaseAdmin: { from: fromMock }
  };
});

jest.mock('../../utils/isUuid', () => ({
  isUuid: jest.fn(() => true),
  default: jest.fn(() => true)
}));

const { supabaseAdmin } = require('./supabaseClient');
const { isUuid } = require('../../utils/isUuid');

describe('seatLocks service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lockSeat calls upsert with normalized id and status', async () => {
    const from = supabaseAdmin.from;
    const upsert = from().upsert;
    await lockSeat('silla_abc', 'bloqueado');
    expect(from).toHaveBeenCalledWith('seat_locks');
    expect(upsert).toHaveBeenCalledWith(
      { seat_id: 'abc', status: 'bloqueado' },
      { onConflict: 'seat_id' }
    );
  });

  test('lockSeat throws on invalid id', async () => {
    isUuid.mockReturnValueOnce(false);
    await expect(lockSeat('bad')).rejects.toThrow('Invalid seat ID');
  });

  test('unlockSeat deletes by seat id', async () => {
    const from = supabaseAdmin.from;
    const eq = from().delete().eq;
    await unlockSeat('silla_def');
    expect(from).toHaveBeenCalledWith('seat_locks');
    expect(eq).toHaveBeenCalledWith('seat_id', 'def');
  });
});
