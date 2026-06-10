import { useState, useEffect, useRef } from 'react';

function AnimatedValue({ value }) {
  const [display, setDisplay] = useState(null);
  const ref = useRef(null);
  const match = String(value).match(/^([\d.]+)(.*)$/);
  const numeric = match ? parseFloat(match[1]) : NaN;
  const suffix = match ? match[2] : '';
  const isAnimatable = !isNaN(numeric) && match[1] === String(numeric);

  useEffect(() => {
    if (!isAnimatable) { setDisplay(value); return; }
    const duration = 800;
    const steps = 30;
    const increment = numeric / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numeric) { setDisplay(numeric + suffix); clearInterval(timer); return; }
      setDisplay(Math.round(current * 10) / 10 + suffix);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, numeric, suffix, isAnimatable]);

  return <>{display ?? value}</>;
}

function MiniSparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = data.length * 10;
  const h = 32;
  const points = data.map((v, i) => `${i * 10 + 5},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return (
    <div className="mt-3" style={{ height: h }}>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="opacity-60">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function StatCard({ icon: Icon, label, value, subvalue, color = 'orange', trend, sparklineData }) {
  const colorMap = {
    orange: { bg: 'color-mix(in srgb, var(--color-strava-orange) 12%, transparent)', icon: 'var(--color-strava-orange)', border: 'color-mix(in srgb, var(--color-strava-orange) 20%, transparent)', glow: '0 0 20px color-mix(in srgb, var(--color-strava-orange) 15%, transparent)' },
    green: { bg: 'rgba(34,197,94,0.12)', icon: '#22C55E', border: 'rgba(34,197,94,0.2)', glow: '0 0 20px rgba(34,197,94,0.15)' },
    blue: { bg: 'rgba(59,130,246,0.12)', icon: '#3B82F6', border: 'rgba(59,130,246,0.2)', glow: '0 0 20px rgba(59,130,246,0.15)' },
    purple: { bg: 'rgba(168,85,247,0.12)', icon: '#A855F7', border: 'rgba(168,85,247,0.2)', glow: '0 0 20px rgba(168,85,247,0.15)' },
    yellow: { bg: 'rgba(234,179,8,0.12)', icon: '#EAB308', border: 'rgba(234,179,8,0.2)', glow: '0 0 20px rgba(234,179,8,0.15)' },
    red: { bg: 'rgba(239,68,68,0.12)', icon: '#EF4444', border: 'rgba(239,68,68,0.2)', glow: '0 0 20px rgba(239,68,68,0.15)' },
  };
  const c = colorMap[color] || colorMap.orange;

  return (
    <div className="stat-card group" style={{ '--stat-glow': c.glow }}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{ background: c.bg, color: c.icon, boxShadow: c.glow }}
        >
          {Icon && <Icon size={20} />}
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            trend >= 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[28px] font-bold text-text-primary leading-none tracking-tight font-mono">
        <AnimatedValue value={value} />
      </p>
      {subvalue && <p className="text-xs text-text-muted/60 mt-2">{subvalue}</p>}
      {sparklineData && <MiniSparkline data={sparklineData} color={c.icon} />}
    </div>
  );
}
