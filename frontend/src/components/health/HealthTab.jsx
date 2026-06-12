import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { fetchHealthDataBootstrap, fetchHealthDataUpdate } from '../../data/api';
import { Activity, Heart, TrendingUp, Footprints, Zap, Clock, Route, Thermometer, ArrowUpFromLine } from 'lucide-react';

const HealthTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="text-text-muted text-xs mb-1.5 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold text-sm">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(p.value < 10 ? 3 : p.value < 100 ? 1 : 0) : p.value}
        </p>
      ))}
    </div>
  );
};

function safeFormat(dateStr, fmt) {
  try {
    return format(new Date(dateStr), fmt);
  } catch {
    return dateStr ? dateStr.slice(0, 7) : '??';
  }
}

function filterData(data, field) {
  return data.filter((d) => d[field] != null && d[field] > 0).reverse();
}

function latestValue(data, field) {
  const filtered = filterData(data, field);
  return filtered.length > 0 ? filtered[filtered.length - 1][field] : null;
}

export default function HealthTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthDataBootstrap()
      .then((snapshots) => { setData(snapshots); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState !== 'visible') return;
      fetchHealthDataUpdate().then((updated) => {
        if (updated) setData(updated);
      });
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const m = (d, key, label) => ({ date: safeFormat(d.date, 'MMM dd'), [label]: d[key] });
  const strideData = useMemo(() => filterData(data, 'running_stride_length').map((d) => m(d, 'running_stride_length', 'stride')), [data]);
  const vo2Data = useMemo(() => filterData(data, 'v02_max').map((d) => m(d, 'v02_max', 'vo2')), [data]);
  const stepsData = useMemo(() => filterData(data, 'steps').map((d) => m(d, 'steps', 'steps')), [data]);
  const activeEnergyData = useMemo(() => filterData(data, 'active_energy').map((d) => m(d, 'active_energy', 'energy')), [data]);
  const exerciseMinutesData = useMemo(() => filterData(data, 'exercise_minutes').map((d) => m(d, 'exercise_minutes', 'minutes')), [data]);
  const flightsData = useMemo(() => filterData(data, 'flights').map((d) => m(d, 'flights', 'flights')), [data]);
  const walkRunData = useMemo(() => filterData(data, 'walk_run_distance').map((d) => m(d, 'walk_run_distance', 'distance')), [data]);
  const wristTempData = useMemo(() => filterData(data, 'wrist_temp').map((d) => m(d, 'wrist_temp', 'temp')), [data]);
  const cardioRecoveryData = useMemo(() => filterData(data, 'cardio_recovery').map((d) => m(d, 'cardio_recovery', 'recovery')), [data]);
  const rhrData = useMemo(() => filterData(data, 'rhr').map((d) => m(d, 'rhr', 'rhr')), [data]);
  const walkingHrData = useMemo(() => filterData(data, 'walking_hr').map((d) => m(d, 'walking_hr', 'walkingHr')), [data]);

  const latestRhr = latestValue(data, 'rhr');
  const latestWalkingHr = latestValue(data, 'walking_hr');
  const latestWristTemp = latestValue(data, 'wrist_temp');
  const latestCardioRecovery = latestValue(data, 'cardio_recovery');
  const latestSteps = latestValue(data, 'steps');
  const latestEnergy = latestValue(data, 'active_energy');
  const latestExercise = latestValue(data, 'exercise_minutes');
  const latestFlights = latestValue(data, 'flights');
  const latestWalkRun = latestValue(data, 'walk_run_distance');
  const latestStride = latestValue(data, 'running_stride_length');
  const latestVo2 = latestValue(data, 'v02_max');

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
        <div className="w-6 h-6 border-2 border-strava-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
        <Activity size={48} className="text-text-muted mb-4" style={{ opacity: 0.3 }} />
        <p className="text-text-muted font-semibold text-sm">No health data yet</p>
        <p className="text-text-muted text-xs mt-1" style={{ opacity: 0.6 }}>
          Connect Apple Shortcuts to start receiving daily health snapshots
        </p>
      </div>
    );
  }

  function SectionHeader({ icon, label, color }) {
    return (
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{label}</h3>
        <div className="flex-1 h-px bg-border-primary/40" />
      </div>
    );
  }

  function ChartCard({ icon, title, subtitle, data, dataKey, color, gradientId, height = 200, yDomain, yFormatter, yWidth }) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2.5 mb-4">
          {icon}
          <div>
            <h3 className="text-sm font-bold text-text-primary m-0">{title}</h3>
            {subtitle && <p className="text-[10px] text-text-muted mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              {gradientId && (
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
              )}
              <CartesianGrid stroke="var(--color-border-primary)" strokeOpacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} domain={yDomain || [0, 'auto']} tickFormatter={yFormatter} width={yWidth || 32} />
              <Tooltip content={<HealthTooltip />} />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 2, fill: color }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-xs text-text-muted">No data yet</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-primary m-0">Health Trends</h2>
          <p className="text-xs text-text-muted mt-0.5">Daily metrics from Apple Health</p>
        </div>
      </div>

      <SectionHeader icon={<Heart size={14} className="text-red-500" />} label="Vitals" color="#EF4444" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <ChartCard icon={<Heart size={16} className="text-red-500" />} title="Resting HR" subtitle={latestRhr != null ? `Latest: ${latestRhr} bpm` : null} data={rhrData} dataKey="rhr" color="#EF4444" gradientId="rhrGrad" yDomain={['auto', 'auto']} />
        <ChartCard icon={<Heart size={16} className="text-strava-orange" />} title="Walking HR" subtitle={latestWalkingHr != null ? `Latest: ${latestWalkingHr} bpm` : null} data={walkingHrData} dataKey="walkingHr" color="var(--color-strava-orange)" gradientId="walkingHrGrad" yDomain={['auto', 'auto']} />
        <ChartCard icon={<Thermometer size={16} className="text-cyan-500" />} title="Wrist Temperature" subtitle={latestWristTemp != null ? `Latest: ${latestWristTemp.toFixed(1)}°C` : null} data={wristTempData} dataKey="temp" color="#06B6D4" gradientId="tempGrad" yDomain={['auto', 'auto']} yFormatter={(v) => v.toFixed(1)} yWidth={36} />
        <ChartCard icon={<Activity size={16} className="text-green-500" />} title="Cardio Recovery" subtitle={latestCardioRecovery != null ? `Latest: ${latestCardioRecovery.toFixed(1)}` : null} data={cardioRecoveryData} dataKey="recovery" color="#22C55E" gradientId="recoveryGrad" />
      </div>

      <SectionHeader icon={<Zap size={14} className="text-yellow-500" />} label="Activity" color="#EAB308" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard icon={<Footprints size={16} className="text-strava-orange" />} title="Steps" subtitle={latestSteps != null ? `Latest: ${latestSteps.toLocaleString()}` : null} data={stepsData} dataKey="steps" color="var(--color-strava-orange)" gradientId="stepsGrad" yFormatter={(v) => (v / 1000).toFixed(0) + 'k'} />
        <ChartCard icon={<Zap size={16} className="text-yellow-500" />} title="Active Energy" subtitle={latestEnergy != null ? `Latest: ${Math.round(latestEnergy)} kcal` : null} data={activeEnergyData} dataKey="energy" color="#EAB308" gradientId="energyGrad" yWidth={36} />
        <ChartCard icon={<Clock size={16} className="text-purple-500" />} title="Exercise Minutes" subtitle={latestExercise != null ? `Latest: ${latestExercise} min` : null} data={exerciseMinutesData} dataKey="minutes" color="#A855F7" gradientId="minutesGrad" />
        <ChartCard icon={<ArrowUpFromLine size={16} className="text-blue-500" />} title="Flights Climbed" subtitle={latestFlights != null ? `Latest: ${latestFlights}` : null} data={flightsData} dataKey="flights" color="#3B82F6" gradientId="flightsGrad" />
        <ChartCard icon={<Route size={16} className="text-emerald-500" />} title="Walk / Run Distance" subtitle={latestWalkRun != null ? `Latest: ${latestWalkRun.toFixed(2)} km` : null} data={walkRunData} dataKey="distance" color="#10B981" gradientId="distanceGrad" yWidth={36} />
      </div>

      <SectionHeader icon={<TrendingUp size={14} className="text-strava-orange" />} label="Performance" color="var(--color-strava-orange)" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard icon={<TrendingUp size={16} className="text-strava-orange" />} title="Running Stride Length" subtitle={latestStride != null ? `Latest: ${latestStride.toFixed(2)}m` : null} data={strideData} dataKey="stride" color="var(--color-strava-orange)" gradientId="strideGrad" height={240} yDomain={['auto', 'auto']} yFormatter={(v) => v.toFixed(1)} yWidth={36} />
        <ChartCard icon={<Heart size={16} className="text-red-500" />} title="VO₂ Max" subtitle={latestVo2 != null ? `Latest: ${latestVo2.toFixed(1)} ml/kg/min` : null} data={vo2Data} dataKey="vo2" color="#EF4444" gradientId="vo2Grad" height={240} yDomain={['auto', 'auto']} yFormatter={(v) => v.toFixed(0)} yWidth={30} />
      </div>
    </div>
  );
}
