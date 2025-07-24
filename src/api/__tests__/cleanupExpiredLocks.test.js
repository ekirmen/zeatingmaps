import { cleanupExpiredLocks } from '../cleanupExpiredLocks';

// Mock firebase-admin/app and firebase-admin/database to avoid module not found errors
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/database', () => ({
  getDatabase: jest.fn(() => ({
    ref: jest.fn(),
    remove: jest.fn(),
    once: jest.fn(),
  })),
}));

describe('cleanupExpiredLocks API', () => {
  test('should return 200 and success message on successful cleanup', async () => {
    const req = { query: { funcionId: 'func1' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await cleanupExpiredLocks(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Expired locks cleaned up successfully' });
  });

  test('should return 400 if funcionId is missing', async () => {
    const req = { query: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    await cleanupExpiredLocks(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing funcionId parameter' });
  });

  test('should return 500 on error', async () => {
    const req = { query: { funcionId: 'func1' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Mock the cleanup function to throw error
    jest.spyOn(global, 'setTimeout').mockImplementationOnce(() => { throw new Error('Test error'); });
    await cleanupExpiredLocks(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
