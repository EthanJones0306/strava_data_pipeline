// Strava Dashboard - Stats Calculator
// Computes and displays summary statistics from run data

import { state, elements } from './config.js';
import { parseDurationToMinutes, formatSecondsToPace } from './utils.js';

/**
 * Calculate aggregate stats from all runs and update the stat cards in the UI.
 */
export function calculateAndDisplayStats() {
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
