import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { TrendingDown, Award, BarChart3, Timer } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="text-text-muted text-xs mb-1.5 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.name === 'Pace' || p.name === 'Smooth'
            ? `${Math.floor(p.value / 60)}:${String(Math.round(p.value % 60)).padStart(2, '0')} /km`
            : typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function PaceTab({ runs, stats }) {
  const [smooth, setSmooth] = useState(7);

  const paceTrendData = runs
    .filter((r) => r.pace_sec_per_km)
    .slice(-60)
    .reverse()
    .map((r, i, arr) => {
      const slice = arr.slice(Math.max(0, i - smooth + 1), i + 1);
      const avg = slice.reduce((s, x) => s + x.pace_sec_per_km, 0) / slice.length;
      return {
        date: format(r.date, 'MMM dd'),
        pace: r.pace_sec_per_km,
        smooth: Math.round(avg),
        distance: Math.round(r.distance_km * 10) / 10,
      };
    });

  const effortData = (stats.bestEfforts || []).map((be) => ({
    label: be.label,
    pace: be.distance_m ? Math.round(be.time_sec / (be.distance_m / 1000)) : 0,
    timeDisplay: be.time_sec >= 3600
      ? `${Math.floor(be.time_sec / 3600)}h ${Math.floor((be.time_sec % 3600) / 60)}m ${be.time_sec % 60}s`
      : `${Math.floor(be.time_sec / 60)}:${String(be.time_sec % 60).padStart(2, '0')}`,
    distance: be.distance_m,
  }));

  const zoneColors = ['#22C55E', '#84CC16', '#EAB308', '#F97316', '#EF4444', '#A855F7'];
  const zoneData = Object.entries(stats.paceZoneCount || {})
    .filter(([, count]) => count > 0)
    .map(([zone, count]) => ({ zone: `Zone ${zone}`, count, color: zoneColors[zone - 1] }));
  const maxZoneCount = Math.max(...zoneData.map((x) => x.count), 1);

  return (
    <div className="space-y-6">
      <svg height="0" width="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--color-strava-orange)' }} stopOpacity={0.8} />
            <stop offset="100%" style={{ stopColor: 'var(--color-strava-orange)' }} stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(34,197,94,0.1)' }}>
            <TrendingDown size={24} className="text-green-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Average Pace</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5 font-mono">{stats.avgPaceDisplay}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-strava-orange/20 to-strava-orange/5 flex items-center justify-center" style={{ boxShadow: '0 0 20px color-mix(in srgb, var(--color-strava-orange) 10%, transparent)' }}>
            <Award size={24} className="text-strava-orange" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Best Pace</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5 font-mono">{stats.fastestRun?.pace_display || 'N/A'}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(168,85,247,0.1)' }}>
            <BarChart3 size={24} className="text-purple-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">PRs Set</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5 font-mono">{stats.bestEfforts?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-text-primary m-0">Pace Trend</h3>
            <p className="text-xs text-text-muted mt-0.5">Rolling average with {smooth}-day smoothing</p>
          </div>
          <div className="flex gap-1 p-0.5 rounded-lg bg-bg-card border border-border-primary/50">
            {[3, 7, 14, 30].map((n) => (
              <button key={n} onClick={() => setSmooth(n)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${smooth === n ? 'bg-strava-orange text-white shadow-glow-orange' : 'text-text-muted hover:text-text-primary'}`}>
                {n}d
              </button>
            ))}
          </div>
        </div>
        <div className="chart-container" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paceTrendData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis reversed tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="pace" stroke="#3F3F46" strokeWidth={1.5} dot={false} name="Pace" />
              <Line type="monotone" dataKey="smooth" stroke="var(--color-strava-orange)" strokeWidth={3} dot={false} name="Smooth" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-primary m-0">Best Efforts</h3>
            <p className="text-xs text-text-muted mt-0.5">Personal records at standard distances</p>
          </div>
          <div className="space-y-2">
            {effortData.map((effort) => (
              <div key={effort.label} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-bg-card transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-strava-orange/10 flex items-center justify-center">
                    <Timer size={14} className="text-strava-orange" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{effort.label}</p>
                    <p className="text-xs text-text-muted font-mono">{effort.timeDisplay}</p>
                  </div>
                </div>
                <span className="text-sm font-mono font-bold text-strava-orange">
                  {effort.pace ? `${Math.floor(effort.pace / 60)}:${String(Math.round(effort.pace % 60)).padStart(2, '0')} /km` : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-primary m-0">Pace Zone Distribution</h3>
            <p className="text-xs text-text-muted mt-0.5">How your kms fall across intensity zones</p>
          </div>
          <div className="space-y-3.5">
            {zoneData.map((z) => (
              <div key={z.zone}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: z.color }} />
                    <span className="text-xs font-semibold text-text-secondary">{z.zone}</span>
                  </div>
                  <span className="text-xs font-mono text-text-muted">{z.count} km</span>
                </div>
                <div className="h-2.5 rounded-full bg-bg-card overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(z.count / maxZoneCount) * 100}%`, background: z.color, boxShadow: `0 0 8px ${z.color}40` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
