import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { Search, X, SlidersHorizontal, Footprints, Clock, Route, Heart, Mountain, Flame, ChevronRight, Brain, Timer, Ruler, MoveVertical } from 'lucide-react';
import { fetchAnalysis, fetchWorkoutForRun } from '../../data/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="text-text-muted text-xs mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

const SplitRow = ({ split }) => {
  const avgPace = split.pace_sec;
  const paceDisplay = `${Math.floor(avgPace / 60)}:${String(avgPace % 60).padStart(2, '0')}`;
  const gapDisplay = split.gap_sec
    ? `${Math.floor(split.gap_sec / 60)}:${String(split.gap_sec % 60).padStart(2, '0')}`
    : null;
  const isFast = avgPace < 300;
  const isSlow = avgPace > 360;
  return (
    <div className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-all ${isFast ? 'bg-green-500/5' : isSlow ? 'bg-red-500/5' : 'hover:bg-bg-card'}`}>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold font-mono w-6 ${isFast ? 'text-green-500' : isSlow ? 'text-red-500' : 'text-text-muted'}`}>KM {split.km}</span>
        <span className={`text-sm font-mono font-semibold ${isFast ? 'text-green-500' : isSlow ? 'text-red-500' : 'text-text-primary'}`}>{paceDisplay}</span>
        {gapDisplay && (
          <span className="text-[10px] font-mono text-text-muted bg-bg-card px-1.5 py-0.5 rounded" title="Grade Adjusted Pace">
            GAP {gapDisplay}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" title="Heart rate">
          <Heart size={10} className="text-red-500" />
          <span className="text-xs font-mono text-text-muted">{split.avg_hr || '-'}</span>
        </div>
        <div className="flex items-center gap-1.5" title="Elevation">
          <Mountain size={10} className="text-blue-500" />
          <span className="text-xs font-mono text-text-muted">{split.elev_diff > 0 ? `+${split.elev_diff}` : split.elev_diff || '0'}m</span>
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${isFast ? 'bg-green-500' : isSlow ? 'bg-red-500' : 'bg-text-muted'}`} />
      </div>
    </div>
  );
};

export default function DeepDiveTab({ runs }) {
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [workout, setWorkout] = useState(null);
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [nameFilter, setNameFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [distMin, setDistMin] = useState('');
  const [distMax, setDistMax] = useState('');
  const [paceMin, setPaceMin] = useState('');
  const [paceMax, setPaceMax] = useState('');
  const [timeMin, setTimeMin] = useState('');
  const [timeMax, setTimeMax] = useState('');
  const [elevMin, setElevMin] = useState('');
  const [elevMax, setElevMax] = useState('');
  const [hrMin, setHrMin] = useState('');
  const [hrMax, setHrMax] = useState('');

  const SORT_OPTIONS = [
    { key: 'date', label: 'Date', defaultDir: 'desc' },
    { key: 'distance_km', label: 'Dist', defaultDir: 'desc' },
    { key: 'pace_sec_per_km', label: 'Pace', defaultDir: 'asc' },
    { key: 'moving_time_sec', label: 'Time', defaultDir: 'desc' },
    { key: 'elevation_gain_m', label: 'Elev', defaultDir: 'desc' },
    { key: 'average_hr', label: 'HR', defaultDir: 'desc' },
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      const opt = SORT_OPTIONS.find(o => o.key === field);
      setSortField(field);
      setSortDir(opt ? opt.defaultDir : 'desc');
    }
  };

  function parsePaceInput(val) {
    if (!val) return null;
    const parts = val.trim().split(':');
    if (parts.length === 2) {
      const m = parseInt(parts[0]);
      const s = parseInt(parts[1]);
      return isNaN(m) || isNaN(s) ? null : m * 60 + s;
    }
    return null;
  }

  function parseTimeInput(val) {
    if (!val) return null;
    const parts = val.trim().split(':');
    let total = 0;
    if (parts.length === 3) {
      total = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
      total = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return isNaN(total) ? null : total;
  }

  const hasActiveFilters = nameFilter || dateFrom || dateTo || distMin || distMax || paceMin || paceMax || timeMin || timeMax || elevMin || elevMax || hrMin || hrMax;

  const clearFilters = () => {
    setNameFilter('');
    setDateFrom(''); setDateTo('');
    setDistMin(''); setDistMax('');
    setPaceMin(''); setPaceMax('');
    setTimeMin(''); setTimeMax('');
    setElevMin(''); setElevMax('');
    setHrMin(''); setHrMax('');
  };

  const sortedRuns = useMemo(() => {
    let result = [...runs];

    if (nameFilter) {
      const q = nameFilter.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q));
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(r => new Date(r.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59');
      result = result.filter(r => new Date(r.date) <= to);
    }
    if (distMin !== '') {
      const min = parseFloat(distMin);
      if (!isNaN(min)) result = result.filter(r => r.distance_km >= min);
    }
    if (distMax !== '') {
      const max = parseFloat(distMax);
      if (!isNaN(max)) result = result.filter(r => r.distance_km <= max);
    }
    if (paceMin !== '') {
      const min = parsePaceInput(paceMin);
      if (min !== null) result = result.filter(r => r.pace_sec_per_km >= min);
    }
    if (paceMax !== '') {
      const max = parsePaceInput(paceMax);
      if (max !== null) result = result.filter(r => r.pace_sec_per_km <= max);
    }
    if (timeMin !== '') {
      const min = parseTimeInput(timeMin);
      if (min !== null) result = result.filter(r => r.moving_time_sec >= min);
    }
    if (timeMax !== '') {
      const max = parseTimeInput(timeMax);
      if (max !== null) result = result.filter(r => r.moving_time_sec <= max);
    }
    if (elevMin !== '') {
      const min = parseFloat(elevMin);
      if (!isNaN(min)) result = result.filter(r => r.elevation_gain_m >= min);
    }
    if (elevMax !== '') {
      const max = parseFloat(elevMax);
      if (!isNaN(max)) result = result.filter(r => r.elevation_gain_m <= max);
    }
    if (hrMin !== '') {
      const min = parseFloat(hrMin);
      if (!isNaN(min)) result = result.filter(r => r.average_hr != null && r.average_hr >= min);
    }
    if (hrMax !== '') {
      const max = parseFloat(hrMax);
      if (!isNaN(max)) result = result.filter(r => r.average_hr != null && r.average_hr <= max);
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === 'date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [runs, sortField, sortDir, nameFilter, dateFrom, dateTo, distMin, distMax, paceMin, paceMax, timeMin, timeMax, elevMin, elevMax, hrMin, hrMax]);

  useEffect(() => {
    if (!selectedRunId) {
      setAnalysis(null);
      setWorkout(null);
      return;
    }
    setAnalysis(null);
    setAnalysisLoading(true);
    fetchAnalysis(selectedRunId).then((a) => {
      setAnalysis(a);
      setAnalysisLoading(false);
    }).catch(() => setAnalysisLoading(false));

    setWorkout(null);
    setWorkoutLoading(true);
    fetchWorkoutForRun(selectedRunId).then((w) => {
      setWorkout(w);
      setWorkoutLoading(false);
    }).catch(() => setWorkoutLoading(false));
  }, [selectedRunId]);

  const selectedRunData = useMemo(() => {
    if (!selectedRunId) return null;
    const run = sortedRuns.find((r) => r.id === selectedRunId);
    if (!run) return null;

    const totalDist = run.distance_km;
    const elapsed_sec = run.elapsed_time_sec || run.moving_time_sec;
    const avgPace = run.pace_sec_per_km;
    const paceDisp = `${Math.floor(avgPace / 60)}:${String(Math.round(avgPace % 60)).padStart(2, '0')}`;
    const fullTime = elapsed_sec
      ? `${Math.floor(elapsed_sec / 3600)}h ${Math.floor((elapsed_sec % 3600) / 60)}m`
      : `${Math.floor(run.moving_time_sec / 60)}m`;

    const splits = (run.splits || []).map((s) => ({
      km: s.km,
      pace_sec: Math.round(s.pace_sec || s.moving_time_sec / (s.distance_km || 1)),
      gap_sec: s.gap_sec,
      avg_hr: s.avg_hr ? Math.round(s.avg_hr) : null,
      elev_diff: Math.round(s.elevation_diff_m || 0),
    }));

    return {
      ...run,
      paceDisplay: paceDisp,
      timeDisplay: fullTime,
      splits,
    };
  }, [selectedRunId, sortedRuns]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-primary m-0">Run Detail Explorer</h2>
          <p className="text-xs text-text-muted mt-0.5">Click a run to see detailed splits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 card p-4 flex flex-col" style={{ maxHeight: 640 }}>
          {/* Search + Filter toggle */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border-primary/50">
              <Search size={14} className="text-text-muted flex-shrink-0" />
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search runs by name..."
                className="w-full bg-transparent text-xs text-text-primary placeholder-text-muted outline-none border-none"
              />
              {nameFilter && (
                <button onClick={() => setNameFilter('')} className="text-text-muted hover:text-text-primary p-0.5">
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all border border-border-primary/50 ${showFilters ? 'bg-strava-orange/15 text-strava-orange' : 'bg-bg-card text-text-muted hover:text-text-primary'}`}
            >
              <SlidersHorizontal size={12} />
              Filters
            </button>
          </div>

          {/* Sort pills */}
          <div className="flex flex-wrap items-center gap-1 px-3 py-2 rounded-lg bg-bg-card border border-border-primary/50 mb-3">
            <span className="text-[10px] font-medium text-text-muted mr-0.5">Sort:</span>
            {SORT_OPTIONS.map(({ key, label }) => {
              const isActive = sortField === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md transition-all ${isActive ? 'bg-strava-orange/15 text-strava-orange' : 'text-text-muted hover:text-text-primary hover:bg-bg-card/50'}`}
                >
                  {label} {isActive ? (sortDir === 'asc' ? '\u2191' : '\u2193') : ''}
                </button>
              );
            })}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mb-3 p-3 rounded-lg bg-bg-card border border-border-primary/50 space-y-2">
              <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-2 gap-y-2 items-center">
                <span className="text-[10px] font-medium text-text-muted">Date</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50" />
                <span className="text-[10px] text-text-muted text-center">to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50" />

                <span className="text-[10px] font-medium text-text-muted">Dist</span>
                <input type="number" step="0.1" placeholder="min km" value={distMin} onChange={e => setDistMin(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50 placeholder-text-muted/50" />
                <span className="text-[10px] text-text-muted text-center">to</span>
                <input type="number" step="0.1" placeholder="max km" value={distMax} onChange={e => setDistMax(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50 placeholder-text-muted/50" />

                <span className="text-[10px] font-medium text-text-muted">Pace</span>
                <input type="text" placeholder="min mm:ss" value={paceMin} onChange={e => setPaceMin(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50 placeholder-text-muted/50" />
                <span className="text-[10px] text-text-muted text-center">to</span>
                <input type="text" placeholder="max mm:ss" value={paceMax} onChange={e => setPaceMax(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50 placeholder-text-muted/50" />

                <span className="text-[10px] font-medium text-text-muted">Time</span>
                <input type="text" placeholder="min h:mm:ss" value={timeMin} onChange={e => setTimeMin(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50 placeholder-text-muted/50" />
                <span className="text-[10px] text-text-muted text-center">to</span>
                <input type="text" placeholder="max h:mm:ss" value={timeMax} onChange={e => setTimeMax(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50 placeholder-text-muted/50" />

                <span className="text-[10px] font-medium text-text-muted">Elev</span>
                <input type="number" placeholder="min m" value={elevMin} onChange={e => setElevMin(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50 placeholder-text-muted/50" />
                <span className="text-[10px] text-text-muted text-center">to</span>
                <input type="number" placeholder="max m" value={elevMax} onChange={e => setElevMax(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50 placeholder-text-muted/50" />

                <span className="text-[10px] font-medium text-text-muted">HR</span>
                <input type="number" placeholder="min bpm" value={hrMin} onChange={e => setHrMin(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50 placeholder-text-muted/50" />
                <span className="text-[10px] text-text-muted text-center">to</span>
                <input type="number" placeholder="max bpm" value={hrMax} onChange={e => setHrMax(e.target.value)} className="bg-bg-card text-[11px] text-text-primary px-2 py-1 rounded border border-border-primary/50 placeholder-text-muted/50" />
              </div>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-[10px] text-text-muted hover:text-strava-orange transition-all mt-1">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Run list */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
            {sortedRuns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Footprints size={24} className="text-text-muted mb-2" style={{ opacity: 0.3 }} />
                <p className="text-xs text-text-muted">No runs match your filters</p>
                <button onClick={clearFilters} className="text-[11px] text-strava-orange hover:underline mt-2">Clear filters</button>
              </div>
            ) : (
              sortedRuns.slice(0, 200).map((run) => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  className={`w-full flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 text-left group ${selectedRunId === run.id ? 'bg-strava-orange/10 border border-strava-orange/30' : 'hover:bg-bg-card border border-transparent hover:border-l-strava-orange hover:border-l-2'}`}
                  style={{ borderLeftWidth: selectedRunId === run.id ? 2 : 0 }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Footprints size={14} className={`flex-shrink-0 ${selectedRunId === run.id ? 'text-strava-orange' : 'text-text-muted'}`} />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${selectedRunId === run.id ? 'text-strava-orange' : 'text-white'}`}>{run.name}</p>
                      <p className="text-[10px] text-text-muted font-mono mt-0.5">{format(run.date, 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-mono text-text-muted">{Math.round(run.distance_km * 10) / 10}km</span>
                    <ChevronRight size={12} className={`${selectedRunId === run.id ? 'text-strava-orange' : 'text-text-muted'}`} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedRunData ? (
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary m-0 leading-tight">{selectedRunData.name}</h3>
                    <p className="text-xs text-text-muted mt-1">{format(selectedRunData.date, 'EEEE, MMMM do, yyyy')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-3 mb-4">
                  <div className="col-span-1 bg-bg-card rounded-xl p-3 flex flex-col items-center">
                    <Route size={16} className="text-strava-orange mb-1" />
                    <span className="text-lg font-bold font-mono text-text-primary">{Math.round(selectedRunData.distance_km * 10) / 10}</span>
                    <span className="text-[10px] font-medium text-text-muted">km</span>
                  </div>
                  <div className="col-span-1 bg-bg-card rounded-xl p-3 flex flex-col items-center">
                    <Clock size={16} className="text-blue-500 mb-1" />
                    <span className="text-lg font-bold font-mono text-text-primary">{selectedRunData.timeDisplay}</span>
                    <span className="text-[10px] font-medium text-text-muted">time</span>
                  </div>
                  <div className="col-span-1 bg-bg-card rounded-xl p-3 flex flex-col items-center">
                    <Heart size={16} className="text-red-500 mb-1" />
                    <span className="text-lg font-bold font-mono text-text-primary">{Math.round(selectedRunData.average_hr) || '-'}</span>
                    <span className="text-[10px] font-medium text-text-muted">avg HR</span>
                  </div>
                  <div className="col-span-1 bg-bg-card rounded-xl p-3 flex flex-col items-center">
                    <Mountain size={16} className="text-blue-500 mb-1" />
                    <span className="text-lg font-bold font-mono text-text-primary">{Math.round(selectedRunData.elevation_gain_m) || '-'}</span>
                    <span className="text-[10px] font-medium text-text-muted">elev</span>
                  </div>
                  <div className="col-span-1 bg-bg-card rounded-xl p-3 flex flex-col items-center">
                    <Flame size={16} className="text-orange-500 mb-1" />
                    <span className="text-lg font-bold font-mono text-text-primary">{selectedRunData.paceDisplay}</span>
                    <span className="text-[10px] font-medium text-text-muted">pace</span>
                  </div>
                </div>
              </div>

                {workoutLoading && (
                  <div className="card p-5 flex items-center justify-center gap-3" style={{ minHeight: 60 }}>
                    <div className="w-4 h-4 border-2 border-strava-orange border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-text-muted">Loading economy data...</span>
                  </div>
                )}
                {workout && (
                  <div className="card p-5">
                    <h3 className="text-sm font-bold text-text-primary m-0 mb-3">Running Economy</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-1 bg-bg-card rounded-xl p-3 flex flex-col items-center">
                        <Footprints size={16} className="text-strava-orange mb-1" />
                        <span className="text-lg font-bold font-mono text-text-primary">{workout.cadence_spm}</span>
                        <span className="text-[10px] font-medium text-text-muted">cadence (spm)</span>
                      </div>
                      <div className="col-span-1 bg-bg-card rounded-xl p-3 flex flex-col items-center">
                        <MoveVertical size={16} className="text-blue-500 mb-1" />
                        <span className="text-lg font-bold font-mono text-text-primary">{workout.vertical_oscillation_cm}</span>
                        <span className="text-[10px] font-medium text-text-muted">vert osc (cm)</span>
                      </div>
                      <div className="col-span-1 bg-bg-card rounded-xl p-3 flex flex-col items-center">
                        <Timer size={16} className="text-green-500 mb-1" />
                        <span className="text-lg font-bold font-mono text-text-primary">{workout.ground_contact_time_ms}</span>
                        <span className="text-[10px] font-medium text-text-muted">GCT (ms)</span>
                      </div>
                      <div className="col-span-1 bg-bg-card rounded-xl p-3 flex flex-col items-center">
                        <Ruler size={16} className="text-purple-500 mb-1" />
                        <span className="text-lg font-bold font-mono text-text-primary">{workout.stride_length_m ?? '-'}</span>
                        <span className="text-[10px] font-medium text-text-muted">stride (m)</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRunData.splits.length > 0 && (
                <div className="card p-5">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-text-primary m-0">Kilometer Splits</h3>
                    <p className="text-xs text-text-muted mt-0.5">Per-km breakdown with HR and elevation</p>
                  </div>
                  <div className="space-y-1">
                    {selectedRunData.splits.map((s) => (
                      <SplitRow key={s.km} split={s} />
                    ))}
                  </div>
                </div>
              )}

              {analysisLoading && (
                <div className="card p-5 flex items-center justify-center gap-3" style={{ minHeight: 100 }}>
                  <div className="w-5 h-5 border-2 border-strava-orange border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-text-muted">Loading AI analysis...</span>
                </div>
              )}
              {analysis && (
                <div className="card p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Brain size={18} className="text-strava-orange" />
                    <h3 className="text-sm font-bold text-text-primary m-0">AI Coaching Analysis</h3>
                  </div>
                  <div className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                    {analysis.text}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card p-5 flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
              <Footprints size={48} className="text-text-muted mb-4" style={{ opacity: 0.3 }} />
              <p className="text-text-muted font-semibold text-sm">Select a run to explore</p>
              <p className="text-text-muted text-xs mt-1" style={{ opacity: 0.6 }}>Click any run from the list to see detailed split data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
