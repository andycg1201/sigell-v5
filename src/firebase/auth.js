import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './config';

// Función para crear usuario administrador
export const createAdminUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Usuario administrador creado:', userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Usuario administrador ya existe');
      return null;
    }
    throw error;
  }
};

// Función para iniciar sesión
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Función para cerrar sesión
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Función para escuchar cambios de autenticación
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
