import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { Mountain, Zap, TrendingUp, Gauge } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="text-text-muted text-xs mb-1 font-medium">{label || payload[0]?.payload?.name}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value} {p.name === 'Elevation' ? 'm' : p.name === 'Watts' ? 'W' : ''}
        </p>
      ))}
    </div>
  );
};

export default function ElevationTab({ runs, stats }) {
  const elevData = runs
    .filter((r) => r.elevation_gain_m > 0)
    .slice(-40)
    .reverse()
    .map((r) => ({
      date: format(r.date, 'MMM dd'),
      elevation: Math.round(r.elevation_gain_m),
      distance: Math.round(r.distance_km * 10) / 10,
      name: r.name,
    }));

  const powerRuns = runs.filter((r) => r.has_power && r.average_watts > 0);
  const powerData = powerRuns.slice(-40).reverse().map((r) => ({
    date: format(r.date, 'MMM dd'),
    watts: Math.round(r.average_watts),
    distance: Math.round(r.distance_km * 10) / 10,
    name: r.name,
  }));

  const steepestKm = [];
  runs.forEach((r) => {
    (r.splits || []).forEach((s) => {
      if (s.elevation_diff_m > 20) {
        steepestKm.push({
          name: r.name,
          km: s.km,
          elev: Math.round(s.elevation_diff_m),
          date: format(r.date, 'MMM dd'),
        });
      }
    });
  });
  steepestKm.sort((a, b) => b.elev - a.elev);
  const topSteep = steepestKm.slice(0, 5);

  const avgElevPerRun = stats.totalElevation / stats.totalRuns;
  const avgWatts = powerData.length > 0
    ? Math.round(powerData.reduce((s, d) => s + d.watts, 0) / powerData.length)
    : 0;

  return (
    <div className="space-y-6">
      <svg height="0" width="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.2} />
          </linearGradient>
          <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EAB308" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#EAB308" stopOpacity={0.2} />
          </linearGradient>
        </defs>
      </svg>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-strava-orange/20 to-strava-orange/5 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(252,76,2,0.1)' }}>
            <Mountain size={24} className="text-strava-orange" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Avg Elevation</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5 font-mono">{Math.round(avgElevPerRun)} <span className="text-sm text-text-secondary font-sans">m/run</span></p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(59,130,246,0.1)' }}>
            <TrendingUp size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Steepest KM</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5 font-mono">
              {topSteep.length > 0 ? `${topSteep[0].elev}m` : 'N/A'}
            </p>
            <p className="text-xs text-text-muted mt-0.5">{topSteep.length > 0 ? topSteep[0].name : 'No steep climbs'}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(234,179,8,0.1)' }}>
            <Gauge size={24} className="text-yellow-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Avg Power</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5 font-mono">{avgWatts > 0 ? `${avgWatts} W` : 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-primary m-0">Elevation per Run</h3>
            <p className="text-xs text-text-muted mt-0.5">Total climbing per activity</p>
          </div>
          <div className="chart-container" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={elevData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                <Bar dataKey="elevation" fill="url(#elevGradient)" radius={[6, 6, 0, 0]} name="Elevation" maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-primary m-0">Power Output</h3>
            <p className="text-xs text-text-muted mt-0.5">Average watts per run (when available)</p>
          </div>
          <div className="chart-container" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={powerData.length > 0 ? powerData : [{ date: 'No data', watts: 0 }]} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(234,179,8,0.05)' }} />
                <Bar dataKey="watts" fill="url(#powerGradient)" radius={[6, 6, 0, 0]} name="Watts" maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
