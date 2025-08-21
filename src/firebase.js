// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

// Get Firebase config from localStorage or use default
const getFirebaseConfig = () => {
  try {
    const savedConfig = localStorage.getItem('firebaseConfig');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
  } catch (err) {
    console.error('Error parsing Firebase config:', err);
  }
  
  // Default/placeholder config
  return {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    databaseURL: "https://demo-project-default-rtdb.firebaseio.com/",
    projectId: "demo-project-id",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
  };
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
