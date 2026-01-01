/**
 * Authentication Module
 * Google Sign-In with Firebase
 */
import { auth, googleProvider, db } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

let currentUser = null;
let authStateCallbacks = [];

/**
 * Initialize auth state listener
 */
export function initAuth() {
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;

        if (user) {
            console.log('User signed in:', user.displayName);
            // Sync data from Firestore
            await syncFromCloud();
        } else {
            console.log('User signed out');
        }

        // Notify all callbacks
        authStateCallbacks.forEach(cb => cb(user));
    });
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return { success: true, user: result.user };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sign out
 */
export async function logout() {
    try {
        // Save to cloud before signing out
        await syncToCloud();
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get current user
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback) {
    authStateCallbacks.push(callback);
    // Call immediately with current state
    if (currentUser !== null) {
        callback(currentUser);
    }
}

/**
 * Sync local storage to Firestore
 */
export async function syncToCloud() {
    if (!currentUser) return;

    try {
        const history = JSON.parse(localStorage.getItem('videoHistory') || '[]');
        const settings = JSON.parse(localStorage.getItem('videoSettings') || '{}');

        await setDoc(doc(db, 'users', currentUser.uid), {
            history,
            settings,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log('Data synced to cloud');
    } catch (error) {
        console.error('Sync to cloud error:', error);
    }
}

/**
 * Sync Firestore to local storage
 */
export async function syncFromCloud() {
    if (!currentUser) return;

    try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            if (data.history) {
                localStorage.setItem('videoHistory', JSON.stringify(data.history));
            }
            if (data.settings) {
                localStorage.setItem('videoSettings', JSON.stringify(data.settings));
            }

            console.log('Data synced from cloud');
        }
    } catch (error) {
        console.error('Sync from cloud error:', error);
    }
}
