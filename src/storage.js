/**
 * Local Storage Manager for Video History
 */

const STORAGE_KEY = 'videoai_history';
const SETTINGS_KEY = 'videoai_settings';
const MAX_HISTORY_ITEMS = 20;

/**
 * Save generated video to history
 */
export function saveToHistory(videoData) {
    const history = getHistory();

    const newItem = {
        id: generateId(),
        prompt: videoData.prompt,
        videoUrl: videoData.videoUrl,
        model: videoData.model,
        aspectRatio: videoData.aspectRatio || '16:9',
        createdAt: new Date().toISOString()
    };

    // Add to beginning of array
    history.unshift(newItem);

    // Limit history size
    if (history.length > MAX_HISTORY_ITEMS) {
        history.pop();
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
        console.warn('Failed to save to localStorage:', error);
    }

    return newItem;
}

/**
 * Get video history
 */
export function getHistory() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return [];
    }
}

/**
 * Delete item from history
 */
export function deleteFromHistory(id) {
    const history = getHistory();
    const filtered = history.filter(item => item.id !== id);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.warn('Failed to update localStorage:', error);
    }

    return filtered;
}

/**
 * Clear all history
 */
export function clearHistory() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn('Failed to clear localStorage:', error);
    }
}

/**
 * Save settings
 */
export function saveSettings(settings) {
    try {
        const current = getSettings();
        const updated = { ...current, ...settings };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        return updated;
    } catch (error) {
        console.warn('Failed to save settings:', error);
        return settings;
    }
}

/**
 * Get settings
 */
export function getSettings() {
    try {
        const data = localStorage.getItem(SETTINGS_KEY);
        return data ? JSON.parse(data) : {
            hfToken: '',
            defaultModel: 'ltx-video',
            defaultRatio: '16:9'
        };
    } catch (error) {
        console.warn('Failed to read settings:', error);
        return {
            hfToken: '',
            defaultModel: 'ltx-video',
            defaultRatio: '16:9'
        };
    }
}

/**
 * Generate unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Format date for display
 */
export function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60 * 1000) {
        return 'Vừa xong';
    }

    // Less than 1 hour
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes} phút trước`;
    }

    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours} giờ trước`;
    }

    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days} ngày trước`;
    }

    // Format as date
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
