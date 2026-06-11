import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { fetchHealthData } from '../../data/api';
import { Activity, Heart, TrendingUp } from 'lucide-react';

const HealthTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="text-text-muted text-xs mb-1.5 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold text-sm">
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function HealthTab() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthData()
      .then((snapshots) => { setData(snapshots); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const strideData = useMemo(() => {
    return data
      .filter((d) => d.running_stride_length != null && d.running_stride_length > 0)
      .reverse()
      .map((d) => ({
        date: format(new Date(d.date), 'MMM dd'),
        stride: d.running_stride_length,
      }));
  }, [data]);

  const vo2Data = useMemo(() => {
    return data
      .filter((d) => d.v02_max != null && d.v02_max > 0)
      .reverse()
      .map((d) => ({
        date: format(new Date(d.date), 'MMM dd'),
        vo2: d.v02_max,
      }));
  }, [data]);

  const latestStride = strideData.length > 0 ? strideData[strideData.length - 1].stride : null;
  const latestVo2 = vo2Data.length > 0 ? vo2Data[vo2Data.length - 1].vo2 : null;

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

  const chartProps = {
    width: 500,
    height: 300,
    margin: { top: 5, right: 5, left: 5, bottom: 5 },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-primary m-0">Health Trends</h2>
          <p className="text-xs text-text-muted mt-0.5">Daily metrics from Apple Health</p>
        </div>
      </div>

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
