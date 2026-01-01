/**
 * VideoAI - Text to Video AI Generator
 * Main Application Entry Point
 */

import './index.css';
import { initUI } from './ui.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 VideoAI - Initializing...');

    initUI();

    console.log('✅ VideoAI - Ready!');
});

// Handle errors
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
});

// Service Worker for offline support (optional, for future)
if ('serviceWorker' in navigator) {
    // Could register service worker here for PWA support
}
