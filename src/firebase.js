/**
 * Firebase Configuration
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDmUHtQDfUIUaLNHlA-aKbrNRn9QDSetWQ",
    authDomain: "video-ai-9e8b8.firebaseapp.com",
    projectId: "video-ai-9e8b8",
    storageBucket: "video-ai-9e8b8.firebasestorage.app",
    messagingSenderId: "674087703586",
    appId: "1:674087703586:web:6d5accfa08e3e839f5a67b",
    measurementId: "G-LXXW940NVQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);

export default app;
