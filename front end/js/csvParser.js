// Strava Dashboard - CSV Parser
// Robust, quote-aware CSV parser for historical run data

/**
 * Parses a CSV string into an array of run objects.
 * Handles quoted fields, escaped quotes, and mixed line endings.
 */
export function parseCSV(text) {
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
