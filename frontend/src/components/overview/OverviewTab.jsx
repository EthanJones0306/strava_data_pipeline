import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Route, Clock, Mountain, TrendingUp, Zap, Flame, Award } from 'lucide-react';
import StatCard from './StatCard';
import Heatmap from './Heatmap';

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 shadow-elevated text-sm" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="text-text-muted text-xs mb-1.5 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value} {p.name === 'Distance' ? 'km' : p.name === 'Elevation' ? 'm' : ''}
        </p>
      ))}
    </div>
  );
}

function RecentRunsTable({ runs }) {
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Distance</th>
            <th>Time</th>
            <th>Pace</th>
            <th>Elevation</th>
          </tr>
        </thead>
        <tbody>
          {runs.slice(0, 8).map((run) => (
            <tr key={run.id} className="cursor-pointer group">
              <td className="text-text-muted text-xs whitespace-nowrap font-mono">{format(run.date, 'MMM dd')}</td>
              <td className="text-white font-semibold group-hover:text-strava-orange transition-colors">{run.name}</td>
              <td className="text-text-muted font-mono text-xs">{run.distance_km.toFixed(2)} <span className="text-text-muted/60">km</span></td>
              <td className="text-text-muted font-mono text-xs">{run.moving_time_display || `${Math.floor(run.moving_time_sec / 60)}m ${run.moving_time_sec % 60}s`}</td>
              <td className="text-text-muted font-mono text-xs">{run.pace_display || `${Math.floor(run.pace_sec_per_km / 60)}:${String(Math.round(run.pace_sec_per_km % 60)).padStart(2, '0')} /km`}</td>
              <td className="text-text-muted font-mono text-xs">{run.elevation_gain_m.toFixed(0)}<span className="text-text-muted/60">m</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OverviewTab({ runs, stats }) {
  const [barView, setBarView] = useState('week');

  const weeklyData = stats.weeklyData.map((w) => ({
    ...w,
    label: format(parseISO(w.week), 'MMM dd'),
    distance: Math.round(w.distance * 10) / 10,
  }));

  const monthlyData = (stats.monthlyData || []).map((m) => ({
    ...m,
    label: format(parseISO(m.month + '-01'), 'MMM yyyy'),
    distance: Math.round(m.distance * 10) / 10,
  }));

  const yearlyData = (stats.yearlyData || []).map((y) => ({
    ...y,
    distance: Math.round(y.distance * 10) / 10,
  }));

  const barData = barView === 'week' ? weeklyData : barView === 'month' ? monthlyData : yearlyData;
  const barLabel = barView === 'week' ? 'Distance per week' : barView === 'month' ? 'Distance per month' : 'Distance per year';

  const best5k = stats.bestEfforts?.find((b) => b.label === '5K');
  const best5kPace = best5k ? `${Math.floor(best5k.time_sec / 5 / 60)}:${String(Math.round(best5k.time_sec / 5 % 60)).padStart(2, '0')} /km` : 'N/A';

  return (
    <div className="space-y-6">
      <svg height="0" width="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--color-strava-orange)' }} stopOpacity={0.9} />
            <stop offset="100%" style={{ stopColor: 'var(--color-strava-orange)' }} stopOpacity={0.3} />
          </linearGradient>
        </defs>
      </svg>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-slide-up stagger-1">
          <StatCard icon={Route} color="orange" label="Total Distance" value={`${stats.totalDistance} km`} subvalue={`${stats.totalRuns} runs logged`} sparklineData={stats.sparklineData} />
        </div>
        <div className="animate-slide-up stagger-2">
          <StatCard icon={Clock} color="blue" label="Total Time" value={stats.totalTimeDisplay} subvalue={`Avg ${stats.avgDistance} km/run`} sparklineData={stats.sparklineData} />
        </div>
        <div className="animate-slide-up stagger-3">
          <StatCard icon={Mountain} color="green" label="Total Elevation" value={`${stats.totalElevation} m`} subvalue={`${Math.round(stats.totalElevation / stats.totalRuns)} m avg/run`} sparklineData={stats.sparklineData} />
        </div>
        <div className="animate-slide-up stagger-4">
          <StatCard icon={TrendingUp} color="purple" label="Avg Pace" value={stats.avgPaceDisplay} subvalue={`Max HR: ${stats.maxHR || 'N/A'} bpm`} sparklineData={stats.sparklineData} />
        </div>
      </div>

      <div className="card p-5">
        <Heatmap runs={runs} dailyData={stats.dailyData} />
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-text-primary m-0">Volume</h3>
            <p className="text-xs text-text-muted mt-0.5">{barLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-0.5 rounded-lg bg-bg-card border border-border-primary/50">
              {['week', 'month', 'year'].map((v) => (
                <button key={v} onClick={() => setBarView(v)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 capitalize ${barView === v ? 'bg-strava-orange text-white shadow-glow-orange' : 'text-text-muted hover:text-text-primary'}`}>
                  {v}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card border border-border-primary/50">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'var(--color-strava-orange)' }} />
              <span className="text-[11px] font-medium text-text-muted">km</span>
            </div>
          </div>
        </div>
        <div className="chart-container" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: 'color-mix(in srgb, var(--color-strava-orange) 5%, transparent)' }} />
              <Bar dataKey="distance" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Distance" maxBarSize={barView === 'year' ? 48 : 32} animationDuration={600} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary m-0">Recent Runs</h3>
              <p className="text-xs text-text-muted mt-0.5">Last {Math.min(8, runs.length)} activities</p>
            </div>
          </div>
          <RecentRunsTable runs={runs} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-5 group cursor-default">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-strava-orange/20 to-strava-orange/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300" style={{ boxShadow: '0 0 20px color-mix(in srgb, var(--color-strava-orange) 10%, transparent)' }}>
            <Zap size={26} className="text-strava-orange" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Current Streak</p>
            <p className="text-3xl font-bold text-text-primary mt-0.5 font-mono">{stats.currentStreak} <span className="text-lg text-text-secondary font-sans">days</span></p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-5 group cursor-default">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300" style={{ boxShadow: '0 0 20px rgba(34,197,94,0.1)' }}>
            <Route size={26} className="text-green-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Longest Run</p>
            <p className="text-3xl font-bold text-text-primary mt-0.5 font-mono">{stats.longestRun?.distance_km.toFixed(1)} <span className="text-lg text-text-secondary font-sans">km</span></p>
            <p className="text-xs text-text-muted mt-0.5">{stats.longestRun?.name}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-5 group cursor-default">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300" style={{ boxShadow: '0 0 20px rgba(168,85,247,0.1)' }}>
            <Award size={26} className="text-purple-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Best 5K Pace</p>
            <p className="text-3xl font-bold text-text-primary mt-0.5 font-sans">{best5kPace}</p>
            <p className="text-xs text-text-muted mt-0.5">Personal record</p>
          </div>
        </div>
      </div>
    </div>
  );
}
