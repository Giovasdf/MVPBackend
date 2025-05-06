import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.mjs';

describe('PA12 - Webhook: inicio de conversación', () => {
  it('Debe responder con términos y condiciones en el primer mensaje', async () => {
    const res = await request(app)
      .post('/webhook')
      .type('form')
      .send({
        From: 'whatsapp:+56912345678',
        Body: 'Hola'
      });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Términos y Condiciones/i);
    expect(res.text).toMatch(/Responde \*Sí\* para aceptar/i);
  });
});
