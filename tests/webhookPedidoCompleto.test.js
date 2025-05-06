import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../index.mjs';
import * as pb from '../pocketbase.js';

// Mock del método `savePedido`
vi.spyOn(pb, 'authAsAdmin').mockResolvedValue({
  collection: () => ({
    create: vi.fn().mockResolvedValue({ id: 'pedido123' })
  })
});

describe('PA11 - Webhook: flujo completo de pedido', () => {
  const numero = 'whatsapp:+56922222222';

  it('Simula todo el proceso de pedido', async () => {
    await request(app).post('/webhook').type('form').send({ From: numero, Body: 'Hola' });
    await request(app).post('/webhook').type('form').send({ From: numero, Body: 'Sí' });
    await request(app).post('/webhook').type('form').send({ From: numero, Body: '1' });
    await request(app).post('/webhook').type('form').send({ From: numero, Body: 'Juan Pérez' });

    const productos = '2 amoxicilina 500\n1 paracetamol';
    await request(app).post('/webhook').type('form').send({ From: numero, Body: productos });

    await request(app).post('/webhook').type('form').send({ From: numero, Body: 'listo' });
    const res = await request(app).post('/webhook').type('form').send({ From: numero, Body: '2' });

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Resumen del pedido/i);
  });
});
