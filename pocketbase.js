// pocketbase.js
import PocketBase from 'pocketbase';

// Configuración directa
const PB_URL = 'https://database-mvp-production.up.railway.app';
const ADMIN_EMAIL = 'gmolina.dev@gmail.com';
const ADMIN_PASSWORD = 'anyand21.';

// Instancia principal de PocketBase para operaciones de usuario
const pb = new PocketBase(PB_URL);

// Función para autenticación admin (para operaciones de servidor)
export async function authAsAdmin() {
  const adminPb = new PocketBase(PB_URL);
  try {
    await adminPb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    return adminPb;
  } catch (err) {
    console.error('❌ Error de autenticación:', err.message);
    throw new Error('Error de autenticación con PocketBase');
  }
}

// Función para iniciar sesión como usuario
export async function loginUser(email, password) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    console.log('✅ Usuario autenticado:', authData.record.email);
    return authData;
  } catch (err) {
    console.error('❌ Error de autenticación de usuario:', err.message);
    throw new Error('Credenciales incorrectas');
  }
}

// Función para cerrar sesión
export function logout() {
  pb.authStore.clear();
}

// Verificar si hay un usuario autenticado
export function isLoggedIn() {
  return pb.authStore.isValid;
}

// Obtener usuario actual con información transformada
export function currentUser() {
  if (!pb.authStore.isValid) return null;

  const userData = pb.authStore.model;
  if (userData) {
    const user = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar,
      created: userData.created,
      updated: userData.updated,
      rol: userData.rol || 'user',
      isAdmin: userData.rol === 'admin',
    };
    return user;
  }
  return null;
}

// Obtener la instancia de PocketBase
export function getPocketBase() {
  return pb;
}

// Función para registrar un nuevo usuario
export async function registerUser(userData) {
  try {
    const newUser = await pb.collection('users').create({
      ...userData,
      rol: userData.rol || 'user'
    });
    return newUser;
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err.message);
    throw new Error('Error al registrar el usuario');
  }
}

// 🛒 Función para guardar un pedido
export async function savePedido(nombre, productos, telefono, sucursalId = 'default') {
  const adminPb = await authAsAdmin();

  // Crear resumen legible
  const resumen = productos.map(p => {
    const cantidad = p.cantidad || 1;
    const dosisText = p.dosis ? ` (${p.dosis})` : '';
    return `${cantidad}x ${p.producto}${dosisText}`;
  }).join('\n');

  // Preparar datos para PocketBase
  const data = {
    nombre_cliente: nombre,
    telefono_cliente: telefono,
    sucursal_id: sucursalId,
    resumen: resumen,
    resultado_json: JSON.stringify(productos),
    estado: 'pendiente'
  };

  try {
    const record = await adminPb.collection('pedidos').create(data);
    console.log('✅ Pedido guardado:', record.id);
    return record;
  } catch (error) {
    console.error('❌ Error al guardar pedido en PocketBase:', error);
    throw error;
  }
}
