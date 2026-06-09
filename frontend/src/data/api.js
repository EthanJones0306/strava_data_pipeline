const API_BASE = 'http://localhost:8000';

function formatPace(sec) {
  if (!sec) return '';
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')} /km`;
}

function formatMovingTime(sec) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function mapRun(run) {
  const splits = (run.splits || []).map((s) => ({
    km: s.km,
    pace_sec: s.pace_sec,
    pace_sec_per_km: s.pace_sec,
    gap_sec: s.gap_sec,
    avg_hr: s.avg_hr,
    elev_diff: s.elevation_diff_m ?? s.elev_diff ?? 0,
    elevation_diff_m: s.elevation_diff_m ?? s.elev_diff ?? 0,
  }));

  const bestEfforts = (run.best_efforts || []).map((be) => ({
    label: be.label,
    distance_m: be.distance_m ?? 0,
    time_sec: be.time_sec,
    pace_sec_per_km: be.distance_m ? Math.round(be.time_sec / (be.distance_m / 1000)) : 0,
  }));

  return {
    id: run.id,
    name: run.name,
    date: new Date(run.date),
    dateStr: run.date,
    distance_km: run.distance_km,
    moving_time_sec: run.moving_time_sec,
    moving_time_display: formatMovingTime(run.moving_time_sec),
    pace_sec_per_km: run.pace_sec_per_km,
    pace_display: formatPace(run.pace_sec_per_km),
    elevation_gain_m: run.elevation_gain_m,
    average_hr: run.average_hr ?? null,
    max_hr: run.max_hr ?? null,
    average_watts: run.average_watts ?? 0,
    has_power: run.has_power ?? false,
    splits,
    best_efforts: bestEfforts,
  };
}

export async function fetchRuns() {
  const res = await fetch(`${API_BASE}/api/runs`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.runs.map(mapRun).sort((a, b) => b.date - a.date);
}

export async function fetchLatestRun() {
  const res = await fetch(`${API_BASE}/api/runs/latest`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return {
    run: mapRun(data.run),
    analysis: data.analysis,
  };
}

export async function fetchRun(id) {
  const res = await fetch(`${API_BASE}/api/runs/${id}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return mapRun(await res.json());
}

export async function fetchAnalyses() {
  const res = await fetch(`${API_BASE}/api/analyses`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchAnalysis(id) {
  const res = await fetch(`${API_BASE}/api/analyses/${id}`);
  if (!res.ok) return null;
  return res.json();
}
