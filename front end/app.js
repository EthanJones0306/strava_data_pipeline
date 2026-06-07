// Strava Dashboard Application Logic
document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const state = {
        allRuns: [],
        filteredRuns: [],
        currentPage: 1,
        itemsPerPage: 12,
        chartInstance: null,
        activeChartDataset: 'distance-pace', // 'distance-pace' or 'hr-suffer'
    };

    // DOM Elements
    const elements = {
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

    // Initialize Application
    init();

    async function init() {
        showStatus('Loading run history database...', true);
        try {
            // Fetch CSV data. Path is relative to the "front end" directory.
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
            setupEventListeners();
            
            showStatus(`<i class="fa-solid fa-check"></i> ${state.allRuns.length} runs loaded`, false);
        } catch (error) {
            console.error(error);
            showStatus('Error loading database', false, true);
            showEmptyState(`Failed to load running logs: ${error.message}. Please make sure you are running a local web server.`);
        }
    }

    // Helper: Show/Hide Status indicator
    function showStatus(message, isLoading = false, isError = false) {
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

    // Robust CSV Parser (Quote-aware, handling commas inside quotes)
    function parseCSV(text) {
        const lines = [];
        let row = [""];
        let inQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            const next = text[i+1];
            
            if (c === '"') {
                if (inQuotes && next === '"') {
                    row[row.length - 1] += '"'; // Escaped quote inside quote
                    i++;
                } else {
                    inQuotes = !inQuotes; // Toggle quotes mode
                }
            } else if (c === ',' && !inQuotes) {
                row.push(''); // Start new cell
            } else if ((c === '\r' || c === '\n') && !inQuotes) {
                if (c === '\r' && next === '\n') {
                    i++; // Skip carriage return newline double-character
                }
                lines.push(row);
                row = [''];
            } else {
                row[row.length - 1] += c;
            }
        }
        
        // Add final row if file didn't end with newline
        if (row.length > 1 || row[0] !== '') {
            lines.push(row);
        }
        
        if (lines.length === 0) return [];
        
        // Extract headers and create object maps
        const headers = lines[0].map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const rowData = lines[i];
            if (rowData.length < headers.length) continue;
            
            const run = {};
            for (let j = 0; j < headers.length; j++) {
                run[headers[j]] = rowData[j] ? rowData[j].trim() : '';
            }
            
            // Standardize/Clean key variables
            run.distance_km = parseFloat(run.distance_km) || 0;
            run.elevation_gain_m = parseFloat(run.elevation_gain_m) || 0;
            run.highest_elevation_m = parseFloat(run.highest_elevation_m) || 0;
            run.calories = parseFloat(run.calories) || 0;
            run.average_hr = run.average_hr === 'N/A' || !run.average_hr ? null : parseFloat(run.average_hr);
            run.max_hr = run.max_hr === 'N/A' || !run.max_hr ? null : parseFloat(run.max_hr);
            run.suffer_score = run.suffer_score === 'N/A' || !run.suffer_score ? null : parseFloat(run.suffer_score);
            run.average_cadence = parseFloat(run.average_cadence) || 0;
            
            data.push(run);
        }
        return data;
    }

    // Helper: Parse duration string (e.g. "22m 4s" or "108m 50s") into decimal minutes
    function parseDurationToMinutes(durationStr) {
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

    // Helper: Parse pace string (e.g. "6:28 /km") into seconds
    function parsePaceToSeconds(paceStr) {
        if (!paceStr) return 0;
        const cleaned = paceStr.replace('/km', '').trim();
        const parts = cleaned.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return 0;
    }

    // Helper: Convert seconds back to pace string (e.g. 388 seconds -> "6:28 /km")
    function formatSecondsToPace(seconds) {
        if (!seconds || isNaN(seconds) || seconds === Infinity) return '0:00 /km';
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')} /km`;
    }

    // Calculate Summary Stats
    function calculateAndDisplayStats() {
        const runs = state.allRuns;
        const totalRuns = runs.length;
        
        let totalDist = 0;
        let totalElev = 0;
        let maxElev = 0;
        let totalCal = 0;
        let totalMinutes = 0;
        
        runs.forEach(run => {
            totalDist += run.distance_km;
            totalElev += run.elevation_gain_m;
            if (run.highest_elevation_m > maxElev) maxElev = run.highest_elevation_m;
            totalCal += run.calories;
            totalMinutes += parseDurationToMinutes(run.moving_time);
        });

        // Set values in UI
        elements.totalDistance.innerHTML = `${totalDist.toFixed(2)} <span class="unit">km</span>`;
        elements.runCount.textContent = `${totalRuns} runs logged`;
        
        // Calculate average pace (total time in seconds divided by total distance in km)
        const totalSeconds = totalMinutes * 60;
        const avgPaceSec = totalSeconds / totalDist;
        elements.avgPace.innerHTML = `${formatSecondsToPace(avgPaceSec)} <span class="unit">/km</span>`;
        
        // Total Duration Display
        const hours = Math.floor(totalMinutes / 60);
        const remainingMins = Math.round(totalMinutes % 60);
        elements.totalTime.textContent = `${hours}h ${remainingMins}m total duration`;

        elements.totalElevation.innerHTML = `${Math.round(totalElev)} <span class="unit">m</span>`;
        elements.highestElevation.textContent = `Max Alt: ${Math.round(maxElev)}m`;

        elements.totalCalories.innerHTML = `${Math.round(totalCal).toLocaleString()} <span class="unit">kcal</span>`;
        elements.avgCalories.textContent = `${Math.round(totalCal / totalRuns)} kcal avg per run`;
    }

    // Render Runs History List with Pagination, Filters & Search
    function renderRunsList() {
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

    // Filter and Sort Runs
    function filterAndSortRuns() {
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

    // Setup Event Listeners
    function setupEventListeners() {
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

        // Dataset switches
        elements.btnDatasetDistPace.addEventListener('click', () => {
            state.activeChartDataset = 'distance-pace';
            elements.btnDatasetDistPace.classList.add('active');
            elements.btnDatasetHRSuffer.classList.remove('active');
            updateChartData();
        });
        elements.btnDatasetHRSuffer.addEventListener('click', () => {
            state.activeChartDataset = 'hr-suffer';
            elements.btnDatasetDistPace.classList.remove('active');
            elements.btnDatasetHRSuffer.classList.add('active');
            updateChartData();
        });

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

    // Initialize Chart.js Chart
    function initChart() {
        // Chronological order for chart trends (oldest first)
        const chronRuns = [...state.allRuns].reverse();
        
        const ctx = elements.chartCanvas.getContext('2d');
        
        // Define glow style gradients
        const orangeGrad = ctx.createLinearGradient(0, 0, 0, 300);
        orangeGrad.addColorStop(0, 'rgba(252, 82, 0, 0.45)');
        orangeGrad.addColorStop(1, 'rgba(252, 82, 0, 0.02)');

        const blueGrad = ctx.createLinearGradient(0, 0, 0, 300);
        blueGrad.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
        blueGrad.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

        // Extract labels (dates)
        const labels = chronRuns.map(r => {
            const dateObj = new Date(r.date);
            return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        // Extracted datasets for configuration
        const distances = chronRuns.map(r => r.distance_km);
        
        // Decimal pace (e.g. 5:30 -> 5.5 min)
        const decimalPaces = chronRuns.map(r => {
            const sec = parsePaceToSeconds(r.pace);
            return sec ? sec / 60 : 0;
        });

        state.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Distance (km)',
                        data: distances,
                        type: 'bar',
                        backgroundColor: 'rgba(252, 82, 0, 0.75)',
                        borderColor: 'var(--brand-orange)',
                        borderWidth: 1.5,
                        borderRadius: 4,
                        yAxisID: 'y-distance',
                    },
                    {
                        label: 'Pace (min/km)',
                        data: decimalPaces,
                        type: 'line',
                        borderColor: '#3b82f6',
                        backgroundColor: blueGrad,
                        borderWidth: 2.5,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#0f1420',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#3b82f6',
                        pointHoverRadius: 6,
                        tension: 0.35,
                        fill: true,
                        yAxisID: 'y-pace',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Outfit', size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0f1420',
                        titleColor: '#fff',
                        bodyColor: '#e2e8f0',
                        borderColor: 'rgba(252, 82, 0, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        titleFont: { family: 'Outfit', weight: 'bold' },
                        bodyFont: { family: 'Outfit' },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.datasetIndex === 0 && state.activeChartDataset === 'distance-pace') {
                                    label += context.parsed.y.toFixed(2) + ' km';
                                } else if (context.datasetIndex === 1 && state.activeChartDataset === 'distance-pace') {
                                    // Format decimal pace back to minutes:seconds
                                    const totalSec = Math.round(context.parsed.y * 60);
                                    const mins = Math.floor(totalSec / 60);
                                    const secs = totalSec % 60;
                                    label += `${mins}:${secs.toString().padStart(2, '0')} /km`;
                                } else if (state.activeChartDataset === 'hr-suffer') {
                                    if (context.datasetIndex === 0) {
                                        label += Math.round(context.parsed.y) + ' bpm';
                                    } else {
                                        label += Math.round(context.parsed.y);
                                    }
                                } else {
                                    label += context.parsed.y;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
                    },
                    'y-distance': {
                        type: 'linear',
                        position: 'left',
                        grid: { color: 'rgba(255, 255, 255, 0.04)' },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: 'Outfit' },
                            callback: function(value) { return value + ' km'; }
                        },
                        title: {
                            display: true,
                            text: 'Distance',
                            color: 'var(--brand-orange)',
                            font: { family: 'Outfit', weight: 600 }
                        }
                    },
                    'y-pace': {
                        type: 'linear',
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: {
                            color: '#94a3b8',
                            font: { family: 'Outfit' },
                            callback: function(value) {
                                const mins = Math.floor(value);
                                const secs = Math.round((value - mins) * 60);
                                return `${mins}:${secs.toString().padStart(2, '0')}`;
                            }
                        },
                        title: {
                            display: true,
                            text: 'Pace (min/km)',
                            color: '#3b82f6',
                            font: { family: 'Outfit', weight: 600 }
                        },
                        // Reverse pace axis so smaller values (faster) are at the top
                        reverse: true
                    }
                }
            }
        });
    }

    // Toggle Chart Data Types
    function updateChartData() {
        if (!state.chartInstance) return;
        
        const chronRuns = [...state.allRuns].reverse();
        
        const ctx = elements.chartCanvas.getContext('2d');
        
        if (state.activeChartDataset === 'distance-pace') {
            const distances = chronRuns.map(r => r.distance_km);
            const decimalPaces = chronRuns.map(r => {
                const sec = parsePaceToSeconds(r.pace);
                return sec ? sec / 60 : 0;
            });

            // Adjust datasets
            state.chartInstance.data.datasets[0] = {
                label: 'Distance (km)',
                data: distances,
                type: 'bar',
                backgroundColor: 'rgba(252, 82, 0, 0.75)',
                borderColor: 'var(--brand-orange)',
                borderWidth: 1.5,
                borderRadius: 4,
                yAxisID: 'y-distance'
            };

            const blueGrad = ctx.createLinearGradient(0, 0, 0, 300);
            blueGrad.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
            blueGrad.addColorStop(1, 'rgba(59, 130, 246, 0.02)');

            state.chartInstance.data.datasets[1] = {
                label: 'Pace (min/km)',
                data: decimalPaces,
                type: 'line',
                borderColor: '#3b82f6',
                backgroundColor: blueGrad,
                borderWidth: 2.5,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#0f1420',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#3b82f6',
                tension: 0.35,
                fill: true,
                yAxisID: 'y-pace'
            };

            // Adjust scales
            state.chartInstance.options.scales = {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
                },
                'y-distance': {
                    type: 'linear',
                    position: 'left',
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) { return value + ' km'; }
                    },
                    title: { display: true, text: 'Distance', color: 'var(--brand-orange)' }
                },
                'y-pace': {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) {
                            const mins = Math.floor(value);
                            const secs = Math.round((value - mins) * 60);
                            return `${mins}:${secs.toString().padStart(2, '0')}`;
                        }
                    },
                    title: { display: true, text: 'Pace (min/km)', color: '#3b82f6' },
                    reverse: true
                }
            };
        } else {
            // Heart Rate vs Suffer Score datasets
            const hrs = chronRuns.map(r => r.average_hr || null);
            const sufferScores = chronRuns.map(r => r.suffer_score || 0);

            const purpleGrad = ctx.createLinearGradient(0, 0, 0, 300);
            purpleGrad.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
            purpleGrad.addColorStop(1, 'rgba(168, 85, 247, 0.02)');

            state.chartInstance.data.datasets[0] = {
                label: 'Avg Heart Rate (bpm)',
                data: hrs,
                type: 'line',
                borderColor: '#ef4444',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#0f1420',
                pointHoverRadius: 5,
                tension: 0.2,
                spanGaps: true,
                yAxisID: 'y-hr'
            };

            state.chartInstance.data.datasets[1] = {
                label: 'Suffer Score',
                data: sufferScores,
                type: 'bar',
                backgroundColor: 'rgba(168, 85, 247, 0.6)',
                borderColor: '#a855f7',
                borderWidth: 1,
                borderRadius: 2,
                yAxisID: 'y-suffer'
            };

            // Adjust scales
            state.chartInstance.options.scales = {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#94a3b8' }
                },
                'y-hr': {
                    type: 'linear',
                    position: 'left',
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: {
                        color: '#94a3b8',
                        callback: function(value) { return value + ' bpm'; }
                    },
                    title: { display: true, text: 'Heart Rate', color: '#ef4444' },
                    min: 100, // Reasonable zoom for heart rates
                    max: 200
                },
                'y-suffer': {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#94a3b8' },
                    title: { display: true, text: 'Suffer Score', color: '#a855f7' }
                }
            };
        }
        
        state.chartInstance.update();
    }

    // Modal Manager: Open and render Modal detailed contents
    function openRunModal(run) {
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

    function closeRunModal() {
        elements.modal.classList.remove('open');
        document.body.style.overflow = ''; // Resume background scrolling
    }

    // Splits string parsing and display
    // Example: "KM 1: 6m30s @ 6:29/km (GAP: 6:03/km) | +3.2m | 122 bpm | Zone 1"
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

    // Best efforts parsing and display
    // Example: "400m: 2m 29s | 1/2 mile: 5m 03s | 1K: 6m 16s | 1 mile: 10m 17s | 2 mile: 20m 41s"
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

    // Helper: Show Empty State in table / grid
    function showEmptyState(message) {
        elements.runsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-person-running"></i>
                <p>${message}</p>
            </div>
        `;
    }
});
