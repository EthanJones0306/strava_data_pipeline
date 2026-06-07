// Strava Dashboard - Utility Functions
// Pure helper functions for formatting and UI feedback

import { elements } from './config.js';

/**
 * Parse duration string (e.g. "22m 4s" or "1h 08m 50s") into decimal minutes.
 */
export function parseDurationToMinutes(durationStr) {
    if (!durationStr) return 0;
    let totalSec = 0;
    
    const hMatch = durationStr.match(/(\d+)\s*h/);
    const mMatch = durationStr.match(/(\d+)\s*m/);
    const sMatch = durationStr.match(/(\d+)\s*s/);
    
    if (hMatch) totalSec += parseInt(hMatch[1]) * 3600;
    if (mMatch) totalSec += parseInt(mMatch[1]) * 60;
    if (sMatch) totalSec += parseInt(sMatch[1]);
    
    return totalSec / 60;
}

/**
 * Parse pace string (e.g. "6:28 /km") into total seconds.
 */
export function parsePaceToSeconds(paceStr) {
    if (!paceStr) return 0;
    const cleaned = paceStr.replace('/km', '').trim();
    const parts = cleaned.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
}

/**
 * Convert seconds back to pace string (e.g. 388 -> "6:28 /km").
 */
export function formatSecondsToPace(seconds) {
    if (!seconds || isNaN(seconds) || seconds === Infinity) return '0:00 /km';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

/**
 * Show/Hide the status indicator in the header.
 */
export function showStatus(message, isLoading = false, isError = false) {
    elements.status.innerHTML = message;
    if (isError) {
        elements.status.style.background = 'rgba(239, 68, 68, 0.15)';
        elements.status.style.color = '#ef4444';
        elements.status.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    } else if (isLoading) {
        elements.status.style.background = 'rgba(252, 82, 0, 0.1)';
        elements.status.style.color = 'var(--text-secondary)';
        elements.status.style.borderColor = 'rgba(252, 82, 0, 0.2)';
    } else {
        elements.status.style.background = 'rgba(16, 185, 129, 0.1)';
        elements.status.style.color = '#10b981';
        elements.status.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    }
}

/**
 * Show an empty state message in the runs grid.
 */
export function showEmptyState(message) {
    elements.runsGrid.innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-person-running"></i>
            <p>${message}</p>
        </div>
    `;
}
