// Strava Dashboard - Application Configuration
// Centralized state management and DOM element references

// Application State
export const state = {
    allRuns: [],
    filteredRuns: [],
    currentPage: 1,
    itemsPerPage: 12,
    chartInstance: null,
    activeChartDataset: 'distance-pace', // 'distance-pace' or 'hr-suffer'
};

// DOM Element References (populated by initElements after DOM is ready)
export let elements = {};

export function initElements() {
    elements = {
        status: document.getElementById('header-status'),
        totalDistance: document.getElementById('stat-total-distance'),
        runCount: document.getElementById('stat-run-count'),
        avgPace: document.getElementById('stat-avg-pace'),
        totalTime: document.getElementById('stat-total-time'),
        totalElevation: document.getElementById('stat-total-elevation'),
        highestElevation: document.getElementById('stat-highest-elevation'),
        totalCalories: document.getElementById('stat-total-calories'),
        avgCalories: document.getElementById('stat-avg-calories'),
        runsGrid: document.getElementById('runs-grid'),
        searchInput: document.getElementById('search-input'),
        filterDistance: document.getElementById('filter-distance'),
        sortBy: document.getElementById('sort-by'),
        btnPrev: document.getElementById('btn-prev'),
        btnNext: document.getElementById('btn-next'),
        pageInfo: document.getElementById('page-info'),
        chartCanvas: document.getElementById('performanceChart'),
        btnDatasetDistPace: document.getElementById('btn-dataset-distance-pace'),
        btnDatasetHRSuffer: document.getElementById('btn-dataset-hr-suffer'),
        
        // Modal elements
        modal: document.getElementById('run-modal'),
        modalCloseBtn: document.getElementById('modal-close-btn'),
        modalRunName: document.getElementById('modal-run-name'),
        modalRunDate: document.getElementById('modal-run-date'),
        modalStatDistance: document.getElementById('modal-stat-distance'),
        modalStatTime: document.getElementById('modal-stat-time'),
        modalStatPace: document.getElementById('modal-stat-pace'),
        modalRunDesc: document.getElementById('modal-run-desc'),
        modalDescContainer: document.getElementById('modal-desc-container'),
        modalElevGain: document.getElementById('modal-elev-gain'),
        modalElevHigh: document.getElementById('modal-elev-high'),
        modalHRAvg: document.getElementById('modal-hr-avg'),
        modalHRMax: document.getElementById('modal-hr-max'),
        modalSufferScore: document.getElementById('modal-suffer-score'),
        modalCalories: document.getElementById('modal-calories'),
        modalCadence: document.getElementById('modal-cadence'),
        modalGear: document.getElementById('modal-gear'),
        splitsTableBody: document.getElementById('splits-table-body'),
        effortsBadgesContainer: document.getElementById('efforts-badges-container')
    };
}
