import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { fetchHealthData } from '../../data/api';
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
    fetchHealthData()
      .then((snapshots) => { setData(snapshots); setLoading(false); })
      .catch(() => setLoading(false));
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

  const pairedHRData = useMemo(() => {
    const map = {};
    data.forEach((d) => {
      if ((d.rhr == null || d.rhr <= 0) && (d.walking_hr == null || d.walking_hr <= 0)) return;
      const dateStr = safeFormat(d.date, 'MMM dd');
      if (!map[dateStr]) map[dateStr] = { date: dateStr };
      if (d.rhr != null && d.rhr > 0) map[dateStr].rhr = d.rhr;
      if (d.walking_hr != null && d.walking_hr > 0) map[dateStr].walkingHr = d.walking_hr;
    });
    return Object.values(map).reverse();
  }, [data]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-primary m-0">Health Trends</h2>
          <p className="text-xs text-text-muted mt-0.5">Daily metrics from Apple Health</p>
        </div>
      </div>

      {/* Row 1: Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Heart size={18} className="text-red-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary m-0">Resting & Walking HR</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {latestRhr != null ? `RHR: ${latestRhr} bpm` : ''}{latestRhr != null && latestWalkingHr != null ? ' | ' : ''}{latestWalkingHr != null ? `Walking: ${latestWalkingHr} bpm` : ''}
              </p>
            </div>
          </div>
          {pairedHRData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={pairedHRData}>
                <defs>
                  <linearGradient id="rhrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="walkingHrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-strava-orange)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="var(--color-strava-orange)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border-primary)" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} width={32} />
                <Tooltip content={<HealthTooltip />} />
                <Line type="monotone" dataKey="rhr" stroke="#EF4444" strokeWidth={2} dot={{ r: 2, fill: '#EF4444' }} activeDot={{ r: 4 }} name="RHR" />
                <Line type="monotone" dataKey="walkingHr" stroke="var(--color-strava-orange)" strokeWidth={2} dot={{ r: 2, fill: 'var(--color-strava-orange)' }} activeDot={{ r: 4 }} name="Walking HR" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 200 }}>
              <p className="text-xs text-text-muted">No HR data yet</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Thermometer size={18} className="text-cyan-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary m-0">Wrist Temperature</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {latestWristTemp != null ? `Latest: ${latestWristTemp.toFixed(1)}°C` : 'No data available'}
              </p>
            </div>
          </div>
          {wristTempData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={wristTempData}>
                <CartesianGrid stroke="var(--color-border-primary)" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={(v) => v.toFixed(1)} width={36} />
                <Tooltip content={<HealthTooltip />} />
                <Line type="monotone" dataKey="temp" stroke="#06B6D4" strokeWidth={2} dot={{ r: 2, fill: '#06B6D4' }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 200 }}>
              <p className="text-xs text-text-muted">No temperature data yet</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Activity size={18} className="text-green-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary m-0">Cardio Recovery</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {latestCardioRecovery != null ? `Latest: ${latestCardioRecovery.toFixed(1)}` : 'No data available'}
              </p>
            </div>
          </div>
          {cardioRecoveryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cardioRecoveryData}>
                <CartesianGrid stroke="var(--color-border-primary)" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} domain={[0, 'auto']} width={32} />
                <Tooltip content={<HealthTooltip />} />
                <Line type="monotone" dataKey="recovery" stroke="#22C55E" strokeWidth={2} dot={{ r: 2, fill: '#22C55E' }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 200 }}>
              <p className="text-xs text-text-muted">No cardio recovery data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Footprints size={18} className="text-strava-orange" />
            <div>
              <h3 className="text-sm font-bold text-text-primary m-0">Steps</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {latestSteps != null ? `Latest: ${latestSteps.toLocaleString()}` : 'No data available'}
              </p>
            </div>
          </div>
          {stepsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stepsData}>
                <CartesianGrid stroke="var(--color-border-primary)" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} domain={[0, 'auto']} tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} width={32} />
                <Tooltip content={<HealthTooltip />} />
                <Line type="monotone" dataKey="steps" stroke="var(--color-strava-orange)" strokeWidth={2} dot={{ r: 2, fill: 'var(--color-strava-orange)' }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 200 }}>
              <p className="text-xs text-text-muted">No step data yet</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Zap size={18} className="text-yellow-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary m-0">Active Energy</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {latestEnergy != null ? `Latest: ${Math.round(latestEnergy)} kcal` : 'No data available'}
              </p>
            </div>
          </div>
          {activeEnergyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={activeEnergyData}>
                <CartesianGrid stroke="var(--color-border-primary)" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} domain={[0, 'auto']} width={36} />
                <Tooltip content={<HealthTooltip />} />
                <Line type="monotone" dataKey="energy" stroke="#EAB308" strokeWidth={2} dot={{ r: 2, fill: '#EAB308' }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 200 }}>
              <p className="text-xs text-text-muted">No energy data yet</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Clock size={18} className="text-purple-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary m-0">Exercise Minutes</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {latestExercise != null ? `Latest: ${latestExercise} min` : 'No data available'}
              </p>
            </div>
          </div>
          {exerciseMinutesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={exerciseMinutesData}>
                <CartesianGrid stroke="var(--color-border-primary)" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} domain={[0, 'auto']} width={32} />
                <Tooltip content={<HealthTooltip />} />
                <Line type="monotone" dataKey="minutes" stroke="#A855F7" strokeWidth={2} dot={{ r: 2, fill: '#A855F7' }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 200 }}>
              <p className="text-xs text-text-muted">No exercise minutes data yet</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <ArrowUpFromLine size={18} className="text-blue-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary m-0">Flights Climbed</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {latestFlights != null ? `Latest: ${latestFlights}` : 'No data available'}
              </p>
            </div>
          </div>
          {flightsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={flightsData}>
                <CartesianGrid stroke="var(--color-border-primary)" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} domain={[0, 'auto']} width={32} />
                <Tooltip content={<HealthTooltip />} />
                <Line type="monotone" dataKey="flights" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2, fill: '#3B82F6' }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 200 }}>
              <p className="text-xs text-text-muted">No flights data yet</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Route size={18} className="text-emerald-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary m-0">Walk / Run Distance</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {latestWalkRun != null ? `Latest: ${latestWalkRun.toFixed(2)} km` : 'No data available'}
              </p>
            </div>
          </div>
          {walkRunData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={walkRunData}>
                <CartesianGrid stroke="var(--color-border-primary)" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} domain={[0, 'auto']} width={36} />
                <Tooltip content={<HealthTooltip />} />
                <Line type="monotone" dataKey="distance" stroke="#10B981" strokeWidth={2} dot={{ r: 2, fill: '#10B981' }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 200 }}>
              <p className="text-xs text-text-muted">No walk/run distance data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <TrendingUp size={18} className="text-strava-orange" />
            <div>
              <h3 className="text-sm font-bold text-text-primary m-0">Running Stride Length</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {latestStride != null ? `Latest: ${latestStride.toFixed(2)}m` : 'No data available'}
              </p>
            </div>
          </div>
          {strideData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={strideData}>
                <defs>
                  <linearGradient id="strideGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-strava-orange)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="var(--color-strava-orange)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border-primary)" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={(v) => v.toFixed(1)} width={36} />
                <Tooltip content={<HealthTooltip />} />
                <Line type="monotone" dataKey="stride" stroke="var(--color-strava-orange)" strokeWidth={2} dot={{ r: 2, fill: 'var(--color-strava-orange)' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 240 }}>
              <p className="text-xs text-text-muted">No stride length data recorded yet</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Heart size={18} className="text-red-500" />
            <div>
              <h3 className="text-sm font-bold text-text-primary m-0">VO₂ Max</h3>
              <p className="text-[10px] text-text-muted mt-0.5">
                {latestVo2 != null ? `Latest: ${latestVo2.toFixed(1)} ml/kg/min` : 'No data available'}
              </p>
            </div>
          </div>
          {vo2Data.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={vo2Data}>
                <defs>
                  <linearGradient id="vo2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border-primary)" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} tickFormatter={(v) => v.toFixed(0)} width={30} />
                <Tooltip content={<HealthTooltip />} />
                <Line type="monotone" dataKey="vo2" stroke="#EF4444" strokeWidth={2} dot={{ r: 2, fill: '#EF4444' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 240 }}>
              <p className="text-xs text-text-muted">No VO₂ max data recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
