import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { Heart, Activity, BarChart3 } from 'lucide-react';

const HR_ZONE_COLORS = ['#3B82F6', '#22C55E', '#EAB308', '#F97316', '#EF4444'];
const HR_ZONE_LABELS = ['Zone 1 (Easy)', 'Zone 2 (Moderate)', 'Zone 3 (Aerobic)', 'Zone 4 (Threshold)', 'Zone 5 (Max)'];
const HR_ZONE_RANGES = ['< 120 bpm', '120–139 bpm', '140–154 bpm', '155–169 bpm', '≥ 170 bpm'];

const DotTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card px-4 py-3" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="text-text-muted text-xs mb-1 font-medium">{d.date}</p>
      <p className="font-semibold" style={{ color: HR_ZONE_COLORS[d.zone - 1] || '#A1A1AA' }}>
        {d.hr} bpm @ {d.paceDisplay} /km
      </p>
      <p className="text-xs text-text-muted mt-0.5">{d.distance} km</p>
    </div>
  );
};

const MonthlyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="text-text-muted text-xs mb-1.5 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold text-sm">
          {p.name}: {p.name === 'Avg Pace'
            ? `${Math.floor(p.value / 60)}:${String(Math.round(p.value % 60)).padStart(2, '0')} /km`
            : `${Math.round(p.value)} bpm`}
        </p>
      ))}
    </div>
  );
};

function computeRegression(data, xKey, yKey) {
  const n = data.length;
  if (n < 2) return null;
  const sumX = data.reduce((s, d) => s + d[xKey], 0);
  const sumY = data.reduce((s, d) => s + d[yKey], 0);
  const sumXY = data.reduce((s, d) => s + d[xKey] * d[yKey], 0);
  const sumX2 = data.reduce((s, d) => s + d[xKey] * d[xKey], 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export default function HeartRateTab({ runs, stats }) {
  const hrRuns = runs.filter((r) => r.average_hr);

  const hrVsPaceData = hrRuns
    .filter((r) => r.pace_sec_per_km)
    .slice(-120)
    .map((r) => ({
      pace: Math.round(r.pace_sec_per_km),
      paceDisplay: `${Math.floor(r.pace_sec_per_km / 60)}:${String(Math.round(r.pace_sec_per_km % 60)).padStart(2, '0')}`,
      hr: Math.round(r.average_hr),
      distance: Math.round(r.distance_km * 10) / 10,
      date: format(r.date, 'MMM dd'),
      zone: r.average_hr < 120 ? 1 : r.average_hr < 140 ? 2 : r.average_hr < 155 ? 3 : r.average_hr < 170 ? 4 : 5,
    }))
    .sort((a, b) => a.pace - b.pace);

  const hrZoneData = [1, 2, 3, 4, 5].map((z) => {
    const count = stats.hrZoneCount?.[z] ?? 0;
    return {
      zone: z,
      label: HR_ZONE_LABELS[z - 1],
      range: HR_ZONE_RANGES[z - 1],
      count,
      color: HR_ZONE_COLORS[z - 1],
      pct: 0,
    };
  });
  const hrZoneTotal = hrZoneData.reduce((s, z) => s + z.count, 0);
  hrZoneData.forEach((z) => { z.pct = hrZoneTotal > 0 ? Math.round((z.count / hrZoneTotal) * 100) : 0; });

  const maxHRever = Math.max(...runs.filter((r) => r.max_hr).map((r) => r.max_hr));
  const avgHR = stats.avgHR;
  const maxPace = Math.max(...hrVsPaceData.map((d) => d.pace), 600);
  const minPace = Math.min(...hrVsPaceData.map((d) => d.pace), 240);

  const regression = computeRegression(hrVsPaceData, 'pace', 'hr');
  const trendLineData = regression
    ? [
        { pace: minPace, hr: regression.slope * minPace + regression.intercept },
        { pace: maxPace, hr: regression.slope * maxPace + regression.intercept },
      ]
    : [];

  const monthlyMap = {};
  hrRuns.filter((r) => r.pace_sec_per_km).forEach((r) => {
    const key = format(r.date, 'yyyy-MM');
    if (!monthlyMap[key]) monthlyMap[key] = { paceSum: 0, hrSum: 0, count: 0 };
    monthlyMap[key].paceSum += r.pace_sec_per_km;
    monthlyMap[key].hrSum += r.average_hr;
    monthlyMap[key].count += 1;
  });
  const monthlyData = Object.entries(monthlyMap)
    .map(([key, val]) => ({
      month: format(parseISO(key + '-01'), 'MMM yyyy'),
      monthSort: key,
      avgPace: Math.round(val.paceSum / val.count),
      avgHR: Math.round(val.hrSum / val.count),
      count: val.count,
    }))
    .sort((a, b) => a.monthSort.localeCompare(b.monthSort));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}>
            <Heart size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Avg Heart Rate</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5 font-mono">{avgHR || 'N/A'} <span className="text-sm text-text-secondary font-sans">bpm</span></p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(249,115,22,0.1)' }}>
            <Activity size={24} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Max Heart Rate</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5 font-mono">{Math.round(maxHRever)} <span className="text-sm text-text-secondary font-sans">bpm</span></p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center" style={{ boxShadow: '0 0 20px rgba(34,197,94,0.1)' }}>
            <BarChart3 size={24} className="text-green-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">HR Data Coverage</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5 font-mono">{hrRuns.length}<span className="text-sm text-text-secondary font-sans">/{runs.length}</span></p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-text-primary m-0">HR &rarr; Pace Relationship</h3>
          <p className="text-xs text-text-muted mt-0.5">Each dot is a run. Orange dashed line = trend (linear regression).</p>
        </div>
        <svg height="0" width="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id="hrDotGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        <div className="chart-container" style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" strokeOpacity={0.4} />
              <XAxis
                dataKey="pace"
                type="number"
                domain={['dataMin', 'dataMax']}
                reversed
                tick={{ fill: '#71717A', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`}
                label={{ value: 'Pace (faster → slower)', position: 'bottom', offset: 10, fill: '#71717A', fontSize: 11, style: { fontWeight: 500 } }}
              />
              <YAxis
                dataKey="hr"
                type="number"
                domain={[60, 'dataMax + 20']}
                tick={{ fill: '#71717A', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Heart Rate (bpm)', angle: -90, position: 'insideLeft', offset: 5, fill: '#71717A', fontSize: 11, style: { fontWeight: 500 } }}
              />
              <Tooltip content={<DotTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={hrVsPaceData} animationDuration={600} shape={(props) => {
                const { cx, cy, payload } = props;
                if (cx === undefined || cy === undefined) return null;
                const fill = HR_ZONE_COLORS[(payload?.zone ?? 3) - 1] || '#A1A1AA';
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={12} fill={fill} fillOpacity={0.15} filter="url(#hrDotGlow)" />
                    <circle cx={cx} cy={cy} r={7} fill={fill} fillOpacity={0.85} stroke="#18181B" strokeWidth={2} />
                  </g>
                );
              }} name="Runs" />
              {trendLineData.length > 0 && (
                <Line data={trendLineData} dataKey="hr" stroke="var(--color-strava-orange)" strokeWidth={2.5} strokeDasharray="6 4" dot={false} activeDot={false} name="Trend" />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-primary m-0">Monthly Fitness Progression</h3>
            <p className="text-xs text-text-muted mt-0.5">Pace vs HR over time — faster pace at lower HR = better fitness</p>
          </div>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 30, bottom: 15, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  yAxisId="pace"
                  reversed
                  domain={['dataMin - 15', 'dataMax + 15']}
                  tick={{ fill: 'var(--color-strava-orange)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`}
                  label={{ value: 'Pace', angle: -90, position: 'insideLeft', offset: 5, fill: 'var(--color-strava-orange)', fontSize: 10, style: { fontWeight: 500 } }}
                />
                <YAxis
                  yAxisId="hr"
                  orientation="right"
                  domain={[60, 180]}
                  tick={{ fill: '#EF4444', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'HR (bpm)', angle: 90, position: 'insideRight', offset: 5, fill: '#EF4444', fontSize: 10, style: { fontWeight: 500 } }}
                />
                <Tooltip content={<MonthlyTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, fontWeight: 600 }}
                  iconType="circle"
                  formatter={(value) => <span style={{ color: value === 'Avg Pace' ? 'var(--color-strava-orange)' : '#EF4444' }}>{value}</span>}
                />
                <Line yAxisId="pace" type="monotone" dataKey="avgPace" stroke="var(--color-strava-orange)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-strava-orange)', strokeWidth: 2, stroke: '#18181B' }} activeDot={{ r: 6 }} name="Avg Pace" animationDuration={600} />
                <Line yAxisId="hr" type="monotone" dataKey="avgHR" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#18181B' }} activeDot={{ r: 6 }} name="Avg HR" animationDuration={600} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-text-primary m-0">HR Zone Distribution</h3>
            <p className="text-xs text-text-muted mt-0.5">How your kilometres fall across HR zones</p>
          </div>
          <div className="space-y-4">
            {hrZoneData.map((z) => (
              <div key={z.zone}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ background: z.color, boxShadow: `0 0 8px ${z.color}50` }} />
                    <span className="text-xs font-semibold text-text-secondary">{z.label}</span>
                    <span className="text-xs text-text-muted font-mono">({z.range})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-muted">{z.count} km</span>
                    <span className="text-xs font-mono text-text-secondary font-semibold">{z.pct}%</span>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-bg-card overflow-hidden" style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${z.pct}%`, background: `linear-gradient(90deg, ${z.color}, ${z.color}cc)`, boxShadow: `0 0 12px ${z.color}40` }}
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
