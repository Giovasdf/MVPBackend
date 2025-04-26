import PocketBase from 'pocketbase';

// Configuración directa (reemplaza con tus credenciales reales)
const PB_URL = 'http://127.0.0.1:8090';
const ADMIN_EMAIL = 'gmolina.dev@gmail.com'; 
const ADMIN_PASSWORD = 'anyand21.'; 

// Instancia principal de PocketBase para operaciones de usuario
const pb = new PocketBase(PB_URL);

// Función para autenticación admin (para operaciones de servidor)
async function authAsAdmin() {
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
  // Si es un usuario normal (no admin)
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
      isAdmin: userData.rol === 'admin', // Para compatibilidad
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
      rol: userData.rol || 'user' // Asignar rol por defecto si no viene especificado
    });
    return newUser;
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err.message);
    throw new Error('Error al registrar el usuario');
  }
}
