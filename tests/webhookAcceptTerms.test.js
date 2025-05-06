import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.mjs';

describe('PA10 - Webhook: aceptar términos', () => {
  it('Debe responder con menú inicial al aceptar los términos', async () => {
    await request(app).post('/webhook').type('form').send({
      From: 'whatsapp:+56911111111',
      Body: 'hola'
    });

    const res = await request(app).post('/webhook').type('form').send({
      From: 'whatsapp:+56911111111',
      Body: 'sí'
    });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Hacer un pedido/i);
    expect(res.text).toMatch(/Hablar con un asistente/i);
  });
});
