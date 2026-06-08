import { useState, useEffect, useRef } from 'react';

function AnimatedValue({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const numeric = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
  const isNumeric = !isNaN(parseFloat(value)) && String(value) === String(numeric);

  useEffect(() => {
    if (!isNumeric) { setDisplay(value); return; }
    const duration = 800;
    const steps = 30;
    const increment = numeric / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numeric) { setDisplay(numeric); clearInterval(timer); return; }
      setDisplay(Math.round(current * 10) / 10);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value, numeric, isNumeric]);

  const colorMap = {
    orange: { bg: 'rgba(252,76,2,0.12)', icon: '#FC4C02', glow: '0 0 20px rgba(252,76,2,0.15)' },
    green: { bg: 'rgba(34,197,94,0.12)', icon: '#22C55E', glow: '0 0 20px rgba(34,197,94,0.15)' },
    blue: { bg: 'rgba(59,130,246,0.12)', icon: '#3B82F6', glow: '0 0 20px rgba(59,130,246,0.15)' },
    purple: { bg: 'rgba(168,85,247,0.12)', icon: '#A855F7', glow: '0 0 20px rgba(168,85,247,0.15)' },
    yellow: { bg: 'rgba(234,179,8,0.12)', icon: '#EAB308', glow: '0 0 20px rgba(234,179,8,0.15)' },
  };
  const c = colorMap[color] || colorMap.orange;

  return suffix;
}

export default function StatCard({ icon: Icon, label, value, subvalue, color = 'orange', trend, decimals = 1 }) {
  const colorMap = {
    orange: { bg: 'rgba(252,76,2,0.12)', icon: '#FC4C02', border: 'rgba(252,76,2,0.2)', glow: '0 0 20px rgba(252,76,2,0.15)' },
    green: { bg: 'rgba(34,197,94,0.12)', icon: '#22C55E', border: 'rgba(34,197,94,0.2)', glow: '0 0 20px rgba(34,197,94,0.15)' },
    blue: { bg: 'rgba(59,130,246,0.12)', icon: '#3B82F6', border: 'rgba(59,130,246,0.2)', glow: '0 0 20px rgba(59,130,246,0.15)' },
    purple: { bg: 'rgba(168,85,247,0.12)', icon: '#A855F7', border: 'rgba(168,85,247,0.2)', glow: '0 0 20px rgba(168,85,247,0.15)' },
    yellow: { bg: 'rgba(234,179,8,0.12)', icon: '#EAB308', border: 'rgba(234,179,8,0.2)', glow: '0 0 20px rgba(234,179,8,0.15)' },
    red: { bg: 'rgba(239,68,68,0.12)', icon: '#EF4444', border: 'rgba(239,68,68,0.2)', glow: '0 0 20px rgba(239,68,68,0.15)' },
  };
  const c = colorMap[color] || colorMap.orange;

  return (
    <div className="stat-card group" style={{ '--stat-glow': c.glow }}>
      <div className="flex items-start justify-between mb-4">
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
      <p className="text-2xl font-bold text-text-primary mb-1 tracking-tight font-mono">{value}</p>
      <p className="text-sm text-text-muted font-medium">{label}</p>
      {subvalue && <p className="text-xs text-text-muted/60 mt-1.5">{subvalue}</p>}
    </div>
  );
}
