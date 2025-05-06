import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.mjs';

describe('PA6 - Validación de conversación rota', () => {
  it('Responde con reinicio si el estado no es válido', async () => {
    const res = await request(app).post('/webhook').type('form').send({
      From: 'whatsapp:+56944444444',
      Body: 'cualquier cosa sin flujo previo'
    });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Términos y Condiciones/i);
  });
});
