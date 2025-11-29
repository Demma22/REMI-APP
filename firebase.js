// Firebase Core
import { initializeApp } from "firebase/app";

// Firebase Auth (React Native Persistence)
import { 
  initializeAuth, 
  getReactNativePersistence 
} from "firebase/auth";

// AsyncStorage for persistence
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firestore
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCnl3qlauxFr0T3yKFvibeLOaek9nB11Ko",
  authDomain: "remi-1.firebaseapp.com",
  projectId: "remi-1",
  storageBucket: "remi-1.firebasestorage.app",
  messagingSenderId: "957364001002",
  appId: "1:957364001002:web:eaae92148b47cc55f25f93",
  measurementId: "G-4RWQJXMJ7P"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Auth WITH React Native persistence (important)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

export default app;
