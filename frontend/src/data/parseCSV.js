import { csvData } from './runs';

function parsePaceToSeconds(pace) {
  if (!pace) return null;
  const match = pace.match(/(\d+):(\d+)/);
  if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
  return null;
}

function parseMovingTimeToSeconds(time) {
  if (!time) return 0;
  const m = time.match(/(\d+)m/);
  const s = time.match(/(\d+)s/);
  return (m ? parseInt(m[1]) * 60 : 0) + (s ? parseInt(s[1]) : 0);
}

function parseDate(dateStr) {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function parseSplits(splitsStr) {
  if (!splitsStr || splitsStr === 'No splits recorded.') return [];
  return splitsStr.split('||').map((s, i) => {
    s = s.trim();
    const timeMatch = s.match(/(\d+)m(\d+)s/);
    const paceMatch = s.match(/@ (\d+:\d+)\/km/);
    const gapMatch = s.match(/GAP: (\d+:\d+)\/km/);
    const elevMatch = s.match(/[+-]?\d+\.?\d*m/);
    const hrMatch = s.match(/(\d+) bpm/);
    const zoneMatch = s.match(/Zone (\d+)/);
    return {
      km: i + 1,
      moving_time_sec: timeMatch ? parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]) : 0,
      pace_sec_per_km: paceMatch ? parsePaceToSeconds(paceMatch[1]) : null,
      gap_pace_sec_per_km: gapMatch ? parsePaceToSeconds(gapMatch[1]) : null,
      elevation_diff_m: elevMatch ? parseFloat(elevMatch[0]) : 0,
      avg_hr: hrMatch ? parseInt(hrMatch[1]) : null,
      pace_zone: zoneMatch ? parseInt(zoneMatch[1]) : null,
    };
  });
}

function parseBestEfforts(beStr) {
  if (!beStr || beStr === 'No best efforts recorded.') return [];
  return beStr.split('|').map((e) => {
    e = e.trim();
    const match = e.match(/^([\d\w\s-]+?):\s*(\d+)m\s(\d+)s/);
    if (match) {
      const label = match[1].trim();
      const timeSec = parseInt(match[2]) * 60 + parseInt(match[3]);
      let distM = 0;
      if (label === '400m') distM = 400;
      else if (label === '1/2 mile') distM = 804;
      else if (label === '1K') distM = 1000;
      else if (label === '1 mile') distM = 1609;
      else if (label === '2 mile') distM = 3218;
      else if (label === '5K') distM = 5000;
      else if (label === '10K') distM = 10000;
      else if (label === '15K') distM = 15000;
      else if (label === '10 mile') distM = 16093;
      else if (label === '20K') distM = 20000;
      else if (label === 'Half-Marathon') distM = 21097;
      return { label, distance_m: distM, time_sec: timeSec, pace_sec_per_km: timeSec / (distM / 1000) };
    }
    return null;
  }).filter(Boolean);
}

export function parseCSV() {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  const runs = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = [];
    let current = '';
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { vals.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    vals.push(current.trim());
    if (vals.length < headers.length) continue;

    const r = {};
    headers.forEach((h, idx) => { r[h.trim()] = vals[idx] || ''; });

    const pace = parsePaceToSeconds(r.pace);
    const movingTime = parseMovingTimeToSeconds(r.moving_time);

    runs.push({
      id: `run-${i}`,
      name: r.run_name || 'Unknown',
      date: parseDate(r.date),
      description: r.description || '',
      distance_km: parseFloat(r.distance_km) || 0,
      moving_time_sec: movingTime,
      moving_time_display: r.moving_time,
      pace_sec_per_km: pace,
      pace_display: r.pace,
      elevation_gain_m: parseFloat(r.elevation_gain_m) || 0,
      highest_elevation_m: parseFloat(r.highest_elevation_m) || 0,
      average_watts: parseFloat(r.average_watts) || 0,
      has_power: r.device_watts === 'True',
      average_cadence: parseInt(r.average_cadence) || 0,
      average_hr: r.average_hr === 'N/A' || !r.average_hr ? null : parseFloat(r.average_hr),
      max_hr: r.max_hr === 'N/A' || !r.max_hr ? null : parseFloat(r.max_hr),
      suffer_score: r.suffer_score === 'N/A' || !r.suffer_score ? null : parseFloat(r.suffer_score),
      calories: parseFloat(r.calories) || 0,
      gear: r.gear_used || 'Unknown Gear',
      splits: parseSplits(r.splits),
      best_efforts: parseBestEfforts(r.best_efforts),
    });
  }

  runs.sort((a, b) => b.date - a.date);
  return runs;
}
