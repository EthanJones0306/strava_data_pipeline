// Strava Dashboard - Modal Manager
// Handles the detailed run modal: open, close, splits, best efforts, and tabs

import { elements } from './config.js';

/**
 * Populate and open the detailed run modal for a given run object.
 */
export function openRunModal(run) {
    elements.modalRunName.textContent = run.run_name;
    elements.modalRunDate.textContent = run.date;
    
    elements.modalStatDistance.textContent = `${run.distance_km.toFixed(2)} km`;
    elements.modalStatTime.textContent = run.moving_time;
    elements.modalStatPace.textContent = run.pace;
    
    // Description
    if (run.description && run.description.trim()) {
        elements.modalRunDesc.textContent = run.description;
        elements.modalDescContainer.style.display = 'block';
    } else {
        elements.modalDescContainer.style.display = 'none';
    }

    // Mini panels
    elements.modalElevGain.textContent = `${run.elevation_gain_m} m`;
    elements.modalElevHigh.textContent = `${run.highest_elevation_m} m`;
    
    elements.modalHRAvg.textContent = run.average_hr ? `${Math.round(run.average_hr)} bpm` : 'N/A';
    elements.modalHRMax.textContent = run.max_hr ? `${Math.round(run.max_hr)} bpm` : 'N/A';
    elements.modalSufferScore.textContent = run.suffer_score || 'N/A';
    
    elements.modalCalories.textContent = run.calories ? `${Math.round(run.calories)} kcal` : 'N/A';
    elements.modalCadence.textContent = run.average_cadence ? `${Math.round(run.average_cadence)} rpm` : 'N/A';
    elements.modalGear.textContent = run.gear_used || 'Unknown';

    // Render Laps/Splits
    renderSplits(run.splits);

    // Render Best Efforts
    renderBestEfforts(run.best_efforts);

    // Reset tabs to splits
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="tab-splits"]').classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-splits').classList.add('active');

    // Open modal
    elements.modal.classList.add('open');
    document.body.style.overflow = 'hidden'; // Stop background scrolling
}

/**
 * Close the run detail modal and resume scrolling.
 */
export function closeRunModal() {
    elements.modal.classList.remove('open');
    document.body.style.overflow = ''; // Resume background scrolling
}

/**
 * Parse and render splits data into the splits table.
 * Example input: "KM 1: 6m30s @ 6:29/km (GAP: 6:03/km) | +3.2m | 122 bpm | Zone 1"
 */
function renderSplits(splitsStr) {
    elements.splitsTableBody.innerHTML = '';
    
    if (!splitsStr || splitsStr.includes('No splits recorded')) {
        elements.splitsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px;">No splits recorded for this activity.</td></tr>`;
        return;
    }

    const laps = splitsStr.split('||').map(l => l.trim());
    
    laps.forEach(lapStr => {
        // Parse: "KM 1: 5m51s @ 5:49 /km (GAP: 5:52 /km) | -6.6m | 131 bpm | Zone 2"
        const parts = lapStr.split('|').map(p => p.trim());
        if (parts.length < 2) return;

        // Part 1: KM 1: 5m51s @ 5:49 /km (GAP: 5:52 /km)
        const firstPart = parts[0]; 
        const lapLabelMatch = firstPart.match(/KM\s*(\d+)\s*:/i);
        const kmLabel = lapLabelMatch ? `KM ${lapLabelMatch[1]}` : 'KM';
        
        // Extract split duration (e.g. 5m51s)
        let splitTime = 'N/A';
        const timePart = firstPart.split('@')[0];
        const timeMatch = timePart.match(/:\s*(\w+)/);
        if (timeMatch) splitTime = timeMatch[1].trim();

        // Extract pace and GAP
        let paceVal = 'N/A';
        let gapVal = 'N/A';
        const atPart = firstPart.split('@')[1];
        if (atPart) {
            // Pace is everything up to the GAP brackets or end of string
            const paceMatch = atPart.match(/([^\(]+)/);
            if (paceMatch) paceVal = paceMatch[1].trim();

            const gapMatch = atPart.match(/\(GAP:\s*([^\)]+)\)/i);
            if (gapMatch) gapVal = gapMatch[1].trim();
        }

        // Part 2: Elevation (e.g. -6.6m or +3.2m)
        const elevVal = parts[1] || 'N/A';

        // Part 3: Heart Rate (e.g. 131 bpm or No HR)
        const hrVal = parts[2] || 'N/A';

        // Part 4: Zone (e.g. Zone 2)
        const zoneVal = parts[3] || 'N/A';

        // Append Row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${kmLabel}</strong></td>
            <td>${splitTime}</td>
            <td>${paceVal}</td>
            <td>${gapVal}</td>
            <td style="color: ${elevVal.startsWith('+') ? '#10b981' : (elevVal.startsWith('-') ? '#ef4444' : 'inherit')}">${elevVal}</td>
            <td>${hrVal}</td>
            <td><span class="suffer-badge" style="background: rgba(255,255,255,0.03); color:#fff; border-color:rgba(255,255,255,0.08); font-size:10px;">${zoneVal}</span></td>
        `;
        elements.splitsTableBody.appendChild(row);
    });
}

/**
 * Parse and render best efforts badges.
 * Example input: "400m: 2m 29s | 1/2 mile: 5m 03s | 1K: 6m 16s"
 */
function renderBestEfforts(effortsStr) {
    elements.effortsBadgesContainer.innerHTML = '';
    
    if (!effortsStr || effortsStr.includes('No best efforts recorded')) {
        elements.effortsBadgesContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 24px; color: var(--text-secondary);">
                No personal best efforts calculated for this activity.
            </div>
        `;
        return;
    }

    const efforts = effortsStr.split('|').map(e => e.trim());
    
    efforts.forEach(effStr => {
        const parts = effStr.split(':').map(p => p.trim());
        if (parts.length < 2) return;

        const name = parts[0];
        const time = parts[1];

        const badge = document.createElement('div');
        badge.className = 'effort-badge';
        badge.innerHTML = `
            <span class="eb-distance">${name}</span>
            <span class="eb-time">${time}</span>
        `;
        elements.effortsBadgesContainer.appendChild(badge);
    });
}

/**
 * Wire up modal close, tab switching, and escape key listeners.
 */
export function setupModalListeners() {
    // Modal close
    elements.modalCloseBtn.addEventListener('click', closeRunModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeRunModal();
    });

    // Modal tabs logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Escape key modal closer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeRunModal();
    });
}
