import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAELzaD3EmD1WjL_rLMg2xeliTmGZQPrDw",
  authDomain: "sigell-version-5.firebaseapp.com",
  projectId: "sigell-version-5",
  storageBucket: "sigell-version-5.firebasestorage.app",
  messagingSenderId: "341553251961",
  appId: "1:341553251961:web:6fda8386aa27ff5babf6a8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
