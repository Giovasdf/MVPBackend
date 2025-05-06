import { expect, test } from 'vitest';
import {pb, authAsAdmin} from '../pocketbase.js';
import PocketBase from 'pocketbase';
const PB_URL = 'https://database-mvp-production.up.railway.app';
const ADMIN_EMAIL = 'gmolina.dev@gmail.com';
const ADMIN_PASSWORD = 'giovanni123.';


// Instancia principal de PocketBase para operaciones de usuario
const pb = new PocketBase(PB_URL);
test('PA9 - crear un nuevo pedido en PocketBase', async () => {
  const adminPb = await authAsAdmin();

  const data = {
    sucursal_id: ['630sy2wl0s2el8z'], // relación como array
    nombre_cliente: 'Cliente de prueba',
    resumen: 'Pedido de prueba',
    resultado_json: JSON.stringify({
      productos: [
        { nombre: 'Paracetamol', cantidad: 2 },
        { nombre: 'Ibuprofeno', cantidad: 1 },
      ],
      total: 3500
    }),
    estado: 'pendiente' // asegúrate que este valor sea válido en tu schema
  };

  const record = await adminPb.collection('pedidos').create(data);
  expect(record).toBeDefined();
  expect(record.nombre_cliente).toBe('Cliente de prueba');
  expect(record.estado).toBe('pendiente');
});
