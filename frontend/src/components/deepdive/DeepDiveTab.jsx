import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { Search, Footprints, Clock, Route, Heart, Mountain, Flame, ChevronRight, Brain } from 'lucide-react';
import { fetchAnalysis } from '../../data/api';

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
  const isFast = avgPace < 300;
  const isSlow = avgPace > 360;
  return (
    <div className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-all ${isFast ? 'bg-green-500/5' : isSlow ? 'bg-red-500/5' : 'hover:bg-bg-card'}`}>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold font-mono w-6 ${isFast ? 'text-green-500' : isSlow ? 'text-red-500' : 'text-text-muted'}`}>KM {split.km}</span>
        <span className={`text-sm font-mono font-semibold ${isFast ? 'text-green-500' : isSlow ? 'text-red-500' : 'text-text-primary'}`}>{paceDisplay}</span>
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

export default function DeepDiveTab({ runs, stats }) {
  const [selectedRun, setSelectedRun] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const sortedRuns = useMemo(() => [...runs].sort((a, b) => new Date(b.date) - new Date(a.date)), [runs]);

  useEffect(() => {
    if (!selectedRun) {
      setAnalysis(null);
      return;
    }
    const run = sortedRuns.find((r) => r.name === selectedRun);
    if (!run) {
      setAnalysis(null);
      return;
    }
    setAnalysis(null);
    setAnalysisLoading(true);
    fetchAnalysis(run.id).then((a) => {
      setAnalysis(a);
      setAnalysisLoading(false);
    }).catch(() => setAnalysisLoading(false));
  }, [selectedRun, sortedRuns]);

  const selectedRunData = useMemo(() => {
    if (!selectedRun) return null;
    const run = sortedRuns.find((r) => r.name === selectedRun);
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
      avg_hr: s.avg_hr ? Math.round(s.avg_hr) : null,
      elev_diff: Math.round(s.elevation_diff_m || 0),
    }));

    return {
      ...run,
      paceDisplay: paceDisp,
      timeDisplay: fullTime,
      splits,
    };
  }, [selectedRun, sortedRuns]);

  const searchText = '';
  const filteredRuns = searchText
    ? sortedRuns.filter((r) => r.name.toLowerCase().includes(searchText.toLowerCase()))
    : sortedRuns;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-primary m-0">Run Detail Explorer</h2>
          <p className="text-xs text-text-muted mt-0.5">Click a run to see detailed splits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 card p-4" style={{ maxHeight: 560 }}>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-card border border-border-primary/50 mb-3">
            <Search size={14} className="text-text-muted flex-shrink-0" />
            <p className="text-xs text-text-muted truncate">Click any run to explore</p>
          </div>
          <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 470 }}>
            {filteredRuns.slice(0, 200).map((run) => (
              <button
                key={run.name}
                onClick={() => setSelectedRun(run.name)}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200 text-left ${selectedRun === run.name ? 'bg-strava-orange/10 border border-strava-orange/30' : 'hover:bg-bg-card border border-transparent'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Footprints size={14} className={`flex-shrink-0 ${selectedRun === run.name ? 'text-strava-orange' : 'text-text-muted'}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${selectedRun === run.name ? 'text-strava-orange' : 'text-text-primary'}`}>{run.name}</p>
                    <p className="text-[10px] text-text-muted font-mono mt-0.5">{format(run.date, 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-mono text-text-muted">{Math.round(run.distance_km * 10) / 10}km</span>
                  <ChevronRight size={12} className={`${selectedRun === run.name ? 'text-strava-orange' : 'text-text-muted'}`} />
                </div>
              </button>
            ))}
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
