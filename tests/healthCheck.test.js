import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.mjs';

describe('PA5 - Verifica estado del backend (/health)', () => {
  it('Debe responder 200 con JSON de estado OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('timestamp');
  });
});
