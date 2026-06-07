// Strava Dashboard - Chart Manager
// Handles Chart.js initialization and dataset toggling

import { state, elements } from './config.js';
import { parsePaceToSeconds } from './utils.js';

/**
 * Initialize the performance trends chart with Distance vs Pace data.
 */
export function initChart() {
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

/**
 * Toggle chart data between Distance/Pace and HR/Suffer Score views.
 */
export function updateChartData() {
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

/**
 * Wire up chart dataset toggle button listeners.
 */
export function setupChartListeners() {
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
}
