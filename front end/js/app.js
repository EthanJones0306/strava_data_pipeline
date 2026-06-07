// Strava Dashboard - Main Application Orchestrator
// Initializes modules and coordinates the application lifecycle
// Mirrors backend/main.py: thin entry point that imports and wires up modules

import { state, initElements } from './config.js';
import { parseCSV } from './csvParser.js';
import { showStatus, showEmptyState } from './utils.js';
import { calculateAndDisplayStats } from './statsCalculator.js';
import { initChart, setupChartListeners } from './chartManager.js';
import { renderRunsList, setupRunsListListeners } from './runsList.js';
import { setupModalListeners } from './modal.js';

// ES modules are deferred by default — DOM is fully parsed when this executes
initElements();
init();

async function init() {
    showStatus('Loading run history database...', true);
    try {
        // Fetch CSV data. Path is relative to the page (index.html).
        const response = await fetch('../backend/historical_runs.csv');
        if (!response.ok) {
            throw new Error(`Failed to load CSV: ${response.statusText}`);
        }
        const csvText = await response.text();
        
        // Parse CSV
        state.allRuns = parseCSV(csvText);
        
        if (state.allRuns.length === 0) {
            showEmptyState("No running data found in the CSV database.");
            showStatus('Database empty', false);
            return;
        }

        // Set up filtered list and run calculations
        state.filteredRuns = [...state.allRuns];
        
        calculateAndDisplayStats();
        renderRunsList();
        initChart();
        
        // Wire up all event listeners
        setupRunsListListeners();
        setupChartListeners();
        setupModalListeners();
        
        showStatus(`<i class="fa-solid fa-check"></i> ${state.allRuns.length} runs loaded`, false);
    } catch (error) {
        console.error(error);
        showStatus('Error loading database', false, true);
        showEmptyState(`Failed to load running logs: ${error.message}. Please make sure you are running a local web server.`);
    }
}
