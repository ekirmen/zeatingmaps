import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

import recintoRoutes from '../src/routes/recintoRoutes.js';
import Recinto from '../src/models/Recintos.js';
import Sala from '../src/models/Sala.js';

jest.mock('../src/models/Recintos.js');
jest.mock('../src/models/Sala.js');

describe('Recinto routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', recintoRoutes);
  });

  beforeEach(() => {
    Recinto.mockClear();
    Sala.mockClear();
  });

  test('POST /api/recintos creates recinto and sala', async () => {
    const recintoSave = jest.fn().mockResolvedValue(undefined);
    Recinto.mockImplementation(data => ({
      ...data,
      _id: 'recinto-id',
      salas: [],
      save: recintoSave,
    }));

    const salaSave = jest.fn().mockResolvedValue(undefined);
    Sala.mockImplementation(data => ({
      ...data,
      _id: 'sala-id',
      save: salaSave,
    }));

    const res = await request(app).post('/api/recintos').send({
      nombre: 'Test Recinto',
      direccion: '123 Street',
      capacidad: 500,
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('recinto');
    expect(res.body).toHaveProperty('sala');
  });
});
