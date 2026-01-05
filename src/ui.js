/**
 * UI Components and Event Handlers
 */

import { generateVideo, getAvailableModels } from './api.js';
import { saveToHistory, getHistory, deleteFromHistory, getSettings, saveSettings, formatDate } from './storage.js';

// DOM Elements
let elements = {};

/**
 * Initialize UI
 */
export function initUI() {
    cacheElements();
    bindEvents();
    loadSettings();
    renderGallery();
    createParticles();
}

/**
 * Cache DOM elements
 */
function cacheElements() {
    elements = {
        // Generator
        promptInput: document.getElementById('promptInput'),
        charCount: document.getElementById('charCount'),
        modelSelect: document.getElementById('modelSelect'),
        generateBtn: document.getElementById('generateBtn'),
        generatorCard: document.getElementById('generatorCard'),

        // Ratio buttons
        ratioBtns: document.querySelectorAll('.ratio-btn'),

        // States
        loadingState: document.getElementById('loadingState'),
        loadingSubtext: document.getElementById('loadingSubtext'),
        progressFill: document.getElementById('progressFill'),
        resultState: document.getElementById('resultState'),
        resultVideo: document.getElementById('resultVideo'),

        // Actions
        downloadBtn: document.getElementById('downloadBtn'),
        newVideoBtn: document.getElementById('newVideoBtn'),

        // Gallery
        galleryGrid: document.getElementById('galleryGrid'),
        galleryEmpty: document.getElementById('galleryEmpty'),

        // Settings
        settingsBtn: document.getElementById('settingsBtn'),
        settingsModal: document.getElementById('settingsModal'),
        closeSettings: document.getElementById('closeSettings'),
        hfToken: document.getElementById('hfToken'),
        saveSettingsBtn: document.getElementById('saveSettings'),

        // Particles
        particles: document.getElementById('particles')
    };
}

/**
 * Bind event listeners
 */
function bindEvents() {
    // Character count
    elements.promptInput.addEventListener('input', () => {
        const count = elements.promptInput.value.length;
        elements.charCount.textContent = count;

        if (count > 500) {
            elements.promptInput.value = elements.promptInput.value.substring(0, 500);
            elements.charCount.textContent = 500;
        }
    });

    // Generate button
    elements.generateBtn.addEventListener('click', handleGenerate);

    // Keyboard shortcut (Ctrl/Cmd + Enter)
    elements.promptInput.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleGenerate();
        }
    });

    // Ratio buttons
    elements.ratioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.ratioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Download button
    elements.downloadBtn.addEventListener('click', handleDownload);

    // New video button
    elements.newVideoBtn.addEventListener('click', resetGenerator);

    // Settings modal
    elements.settingsBtn.addEventListener('click', () => {
        elements.settingsModal.classList.remove('hidden');
    });

    elements.closeSettings.addEventListener('click', () => {
        elements.settingsModal.classList.add('hidden');
    });

    elements.settingsModal.querySelector('.modal-backdrop').addEventListener('click', () => {
        elements.settingsModal.classList.add('hidden');
    });

    elements.saveSettingsBtn.addEventListener('click', handleSaveSettings);

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.settingsModal.classList.contains('hidden')) {
            elements.settingsModal.classList.add('hidden');
        }
    });
}

/**
 * Handle video generation
 */
async function handleGenerate() {
    const prompt = elements.promptInput.value.trim();

    if (!prompt) {
        showToast('Vui lòng nhập mô tả video', 'warning');
        elements.promptInput.focus();
        return;
    }

    const model = elements.modelSelect.value;
    const aspectRatio = document.querySelector('.ratio-btn.active')?.dataset.ratio || '16:9';
    const settings = getSettings();

    // Show loading state
    showLoadingState();

    try {
        const result = await generateVideo(prompt, {
            model,
            aspectRatio,
            token: settings.hfToken || null,
            onProgress: updateProgress
        });

        // Save to history
        const historyItem = saveToHistory({
            ...result,
            aspectRatio
        });

        // Show result
        showResultState(result.videoUrl);

        // Update gallery
        renderGallery();

    } catch (error) {
        console.error('Generation failed:', error);
        showToast(`Lỗi: ${error.message}`, 'error');
        resetGenerator();
    }
}

/**
 * Show loading state
 */
function showLoadingState() {
    elements.generateBtn.disabled = true;
    elements.promptInput.disabled = true;
    elements.modelSelect.disabled = true;

    // Hide prompt container elements
    document.querySelector('.prompt-container').style.display = 'none';
    document.querySelector('.generator-header').style.display = 'none';

    elements.loadingState.classList.remove('hidden');
    elements.resultState.classList.add('hidden');
}

/**
 * Update progress
 */
function updateProgress({ status, message, progress }) {
    elements.loadingSubtext.textContent = message;

    if (progress !== undefined) {
        elements.progressFill.style.animation = 'none';
        elements.progressFill.style.width = `${progress}%`;
    }
}

/**
 * Show result state
 */
function showResultState(videoUrl) {
    elements.loadingState.classList.add('hidden');
    elements.resultState.classList.remove('hidden');
    elements.resultVideo.src = videoUrl;
    elements.resultVideo.load();
    elements.resultVideo.play();
}

/**
 * Reset generator to initial state
 */
function resetGenerator() {
    elements.generateBtn.disabled = false;
    elements.promptInput.disabled = false;
    elements.modelSelect.disabled = false;

    document.querySelector('.prompt-container').style.display = '';
    document.querySelector('.generator-header').style.display = '';

    elements.loadingState.classList.add('hidden');
    elements.resultState.classList.add('hidden');

    elements.progressFill.style.width = '0%';
    elements.progressFill.style.animation = '';

    elements.resultVideo.src = '';
    elements.promptInput.focus();
}

/**
 * Handle download
 */
async function handleDownload() {
    const videoUrl = elements.resultVideo.src;

    if (!videoUrl) {
        showToast('Không có video để tải', 'error');
        return;
    }

    try {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `video-ai-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Đang tải video...', 'success');
    } catch (error) {
        console.error('Download failed:', error);
        // Fallback: open in new tab
        window.open(videoUrl, '_blank');
    }
}

/**
 * Render gallery
 */
function renderGallery() {
    const history = getHistory();

    if (history.length === 0) {
        elements.galleryEmpty.classList.remove('hidden');
        // Remove any gallery items except empty state
        const items = elements.galleryGrid.querySelectorAll('.gallery-item');
        items.forEach(item => item.remove());
        return;
    }

    elements.galleryEmpty.classList.add('hidden');

    // Clear existing items
    const existingItems = elements.galleryGrid.querySelectorAll('.gallery-item');
    existingItems.forEach(item => item.remove());

    // Render new items
    history.forEach(item => {
        const element = createGalleryItem(item);
        elements.galleryGrid.appendChild(element);
    });
}

/**
 * Create gallery item element
 */
function createGalleryItem(item) {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.innerHTML = `
    <video src="${item.videoUrl}" muted loop playsinline></video>
    <div class="gallery-item-info">
      <p class="gallery-item-prompt">${escapeHtml(item.prompt)}</p>
      <span class="gallery-item-date">${formatDate(item.createdAt)}</span>
    </div>
    <div class="gallery-item-actions">
      <button class="btn btn-ghost btn-sm" data-action="play" title="Phát">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </button>
      <button class="btn btn-ghost btn-sm" data-action="download" title="Tải xuống">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
      <button class="btn btn-ghost btn-sm" data-action="delete" title="Xóa">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  `;

    // Hover to play
    const video = div.querySelector('video');

    // Handle expired/invalid video URLs
    video.addEventListener('error', () => {
        console.warn('Video failed to load:', item.videoUrl);
        // Replace video with placeholder
        video.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.className = 'video-expired';
        placeholder.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Video đã hết hạn</span>
        `;
        video.parentElement.insertBefore(placeholder, video);
    });

    div.addEventListener('mouseenter', () => {
        if (!video.error) video.play().catch(() => { });
    });
    div.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
    });

    // Action buttons
    div.querySelector('[data-action="play"]')?.addEventListener('click', () => {
        showResultState(item.videoUrl);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    div.querySelector('[data-action="download"]')?.addEventListener('click', async () => {
        try {
            const response = await fetch(item.videoUrl);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `video-ai-${item.id}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            window.open(item.videoUrl, '_blank');
        }
    });

    div.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        if (confirm('Xóa video này khỏi thư viện?')) {
            deleteFromHistory(item.id);
            renderGallery();
            showToast('Đã xóa video', 'success');
        }
    });

    return div;
}

/**
 * Load settings
 */
function loadSettings() {
    const settings = getSettings();
    elements.hfToken.value = settings.hfToken || '';

    if (settings.defaultModel) {
        elements.modelSelect.value = settings.defaultModel;
    }

    if (settings.defaultRatio) {
        elements.ratioBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ratio === settings.defaultRatio);
        });
    }
}

/**
 * Handle save settings
 */
function handleSaveSettings() {
    const settings = {
        hfToken: elements.hfToken.value.trim(),
        defaultModel: elements.modelSelect.value,
        defaultRatio: document.querySelector('.ratio-btn.active')?.dataset.ratio || '16:9'
    };

    saveSettings(settings);
    elements.settingsModal.classList.add('hidden');
    showToast('Đã lưu cài đặt', 'success');
}

/**
 * Create floating particles
 */
function createParticles() {
    const container = elements.particles;
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        container.appendChild(particle);
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    <button class="toast-close">&times;</button>
  `;

    toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;

    document.body.appendChild(toast);

    // Add animation keyframes if not exists
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
        document.head.appendChild(style);
    }

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
