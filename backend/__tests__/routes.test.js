import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

import authRoutes from '../src/routes/authRoutes.js';
import eventRoutes from '../src/routes/eventRoutes.js';
import paymentRoutes from '../src/routes/paymentRoutes.js';

import User from '../src/models/User.js';
import Evento from '../src/models/Evento.js';
import Payment from '../src/models/Payment.js';

jest.mock('../src/models/User.js');
jest.mock('../src/models/Evento.js');
jest.mock('../src/models/Payment.js');

describe('API routes', () => {
  let app;
  beforeAll(() => {
    process.env.JWT_SECRET = 'testsecret';
    app = express();
    app.use(express.json());
    app.use('/api', authRoutes);
    app.use('/api/events', eventRoutes);
    app.use('/api/payments', paymentRoutes);
  });

  test('POST /api/login returns token', async () => {
    User.findOne.mockResolvedValue({
      _id: '1',
      passwordPending: true,
      toObject() { return { _id: '1', login: 'test' }; }
    });
    const res = await request(app)
      .post('/api/login')
      .send({ login: 'test', password: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('GET /api/events returns array', async () => {
    Evento.find.mockResolvedValue([]);
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/payments returns object', async () => {
    Payment.find.mockResolvedValue([]);
    Payment.countDocuments.mockResolvedValue(0);
    const res = await request(app).get('/api/payments');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('payments');
  });
});
