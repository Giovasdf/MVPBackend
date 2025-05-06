import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.mjs';

describe('PA8 - Manejo de errores al parsear productos', () => {
  const numero = 'whatsapp:+56933333333';

  it('Debe avisar si no se entendieron los productos', async () => {
    await request(app).post('/webhook').type('form').send({ From: numero, Body: 'Hola' });
    await request(app).post('/webhook').type('form').send({ From: numero, Body: 'Sí' });
    await request(app).post('/webhook').type('form').send({ From: numero, Body: '1' });
    await request(app).post('/webhook').type('form').send({ From: numero, Body: 'Cliente Test' });

    const res = await request(app).post('/webhook').type('form').send({ From: numero, Body: 'nfdjkgnkdfg' });
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/no entendí los productos/i);
  });
});
