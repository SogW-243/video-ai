/**
 * VideoAI - Text to Video AI Generator
 * Main Application Entry Point
 */

import './index.css';
import { initUI } from './ui.js';
import { initAuth, signInWithGoogle, logout, onAuthChange, syncToCloud } from './auth.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 VideoAI - Initializing...');

    // Initialize authentication
    initAuth();

    // Initialize UI
    initUI();

    // Setup auth UI handlers
    setupAuthUI();

    console.log('✅ VideoAI - Ready!');
});

// Setup authentication UI
function setupAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userProfile = document.getElementById('userProfile');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');

    // Login button click
    loginBtn?.addEventListener('click', async () => {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Đang đăng nhập...';

        const result = await signInWithGoogle();

        if (!result.success) {
            alert('Đăng nhập thất bại: ' + result.error);
        }

        loginBtn.disabled = false;
        loginBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Đăng nhập
        `;
    });

    // Logout button click
    logoutBtn?.addEventListener('click', async () => {
        if (confirm('Bạn có chắc muốn đăng xuất?')) {
            await logout();
        }
    });

    // Listen for auth state changes
    onAuthChange((user) => {
        if (user) {
            // User is signed in
            loginBtn.style.display = 'none';
            userProfile.style.display = 'flex';
            userAvatar.src = user.photoURL || '';
            userName.textContent = user.displayName || user.email;
        } else {
            // User is signed out
            loginBtn.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    });
}

// Sync to cloud before page unload
window.addEventListener('beforeunload', () => {
    syncToCloud();
});

// Handle errors
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
});

// Service Worker for offline support (optional, for future)
if ('serviceWorker' in navigator) {
    // Could register service worker here for PWA support
}
