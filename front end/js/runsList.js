// Strava Dashboard - Runs List Manager
// Handles rendering, filtering, sorting, and pagination of run cards

import { state, elements } from './config.js';
import { parsePaceToSeconds } from './utils.js';
import { openRunModal } from './modal.js';

/**
 * Render the paginated run cards into the grid.
 */
export function renderRunsList() {
    // Clear grid
    elements.runsGrid.innerHTML = '';
    
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedRuns = state.filteredRuns.slice(startIndex, endIndex);

    if (paginatedRuns.length === 0) {
        elements.runsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>No runs match your search filters.</p>
            </div>
        `;
        elements.pageInfo.textContent = 'Page 0 of 0';
        elements.btnPrev.disabled = true;
        elements.btnNext.disabled = true;
        return;
    }

    // Render Cards
    paginatedRuns.forEach(run => {
        const card = document.createElement('div');
        card.className = 'run-card';
        
        // Heart Rate display block
        const hrDisplay = run.average_hr ? `${Math.round(run.average_hr)} bpm` : 'N/A';
        const sufferBadge = run.suffer_score ? 
            `<span class="suffer-badge ${run.suffer_score >= 40 ? 'high' : ''}">Suffer: ${run.suffer_score}</span>` : '';

        card.innerHTML = `
            <div class="run-card-header">
                <div>
                    <div class="run-card-title" title="${run.run_name}">${run.run_name}</div>
                    <div class="run-card-date">${run.date}</div>
                </div>
                ${sufferBadge}
            </div>
            <div class="run-card-stats">
                <div class="card-stat">
                    <span class="card-stat-label">Distance</span>
                    <span class="card-stat-val">${run.distance_km.toFixed(2)} <span class="unit">km</span></span>
                </div>
                <div class="card-stat">
                    <span class="card-stat-label">Pace</span>
                    <span class="card-stat-val">${run.pace}</span>
                </div>
            </div>
            <div class="run-card-footer">
                <span><i class="fa-solid fa-heart-pulse"></i> ${hrDisplay}</span>
                <button class="btn-details">Details <i class="fa-solid fa-chevron-right"></i></button>
            </div>
        `;
        
        // Modal trigger on click
        card.addEventListener('click', () => openRunModal(run));
        elements.runsGrid.appendChild(card);
    });

    // Update pagination controls
    const totalPages = Math.ceil(state.filteredRuns.length / state.itemsPerPage);
    elements.pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
    elements.btnPrev.disabled = state.currentPage === 1;
    elements.btnNext.disabled = state.currentPage === totalPages;
}

/**
 * Apply search, distance filter, and sort order, then re-render.
 */
export function filterAndSortRuns() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    const distanceCat = elements.filterDistance.value;
    const sortOrder = elements.sortBy.value;

    // 1. Filter
    state.filteredRuns = state.allRuns.filter(run => {
        // Search filter
        const matchesSearch = run.run_name.toLowerCase().includes(searchTerm) || 
                              (run.description && run.description.toLowerCase().includes(searchTerm));
        
        // Distance category filter
        let matchesDistance = true;
        if (distanceCat === 'short') {
            matchesDistance = run.distance_km < 5.0;
        } else if (distanceCat === 'medium') {
            matchesDistance = run.distance_km >= 5.0 && run.distance_km < 10.0;
        } else if (distanceCat === 'long') {
            matchesDistance = run.distance_km >= 10.0 && run.distance_km < 21.0;
        } else if (distanceCat === 'half-full') {
            matchesDistance = run.distance_km >= 21.0;
        }

        return matchesSearch && matchesDistance;
    });

    // 2. Sort
    state.filteredRuns.sort((a, b) => {
        if (sortOrder.startsWith('date')) {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortOrder === 'date-desc' ? dateB - dateA : dateA - dateB;
        }
        if (sortOrder.startsWith('distance')) {
            return sortOrder === 'distance-desc' ? 
                b.distance_km - a.distance_km : a.distance_km - b.distance_km;
        }
        if (sortOrder.startsWith('pace')) {
            const paceA = parsePaceToSeconds(a.pace);
            const paceB = parsePaceToSeconds(b.pace);
            
            // For pace, "fastest" means smaller seconds value
            return sortOrder === 'pace-desc' ? paceA - paceB : paceB - paceA;
        }
        return 0;
    });

    // Reset page & render
    state.currentPage = 1;
    renderRunsList();
}

/**
 * Wire up search, filter, sort, and pagination listeners.
 */
export function setupRunsListListeners() {
    // Filtering & Sorting
    elements.searchInput.addEventListener('input', filterAndSortRuns);
    elements.filterDistance.addEventListener('change', filterAndSortRuns);
    elements.sortBy.addEventListener('change', filterAndSortRuns);

    // Pagination
    elements.btnPrev.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderRunsList();
        }
    });
    elements.btnNext.addEventListener('click', () => {
        const totalPages = Math.ceil(state.filteredRuns.length / state.itemsPerPage);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderRunsList();
        }
    });
}
