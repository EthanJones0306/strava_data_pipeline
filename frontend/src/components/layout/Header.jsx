import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import SettingsPanel from './SettingsPanel';

function Ticker({ items }) {
  const text = items.join('  ···  ');
  return (
    <div className="overflow-hidden flex-1 min-w-0 relative" style={{ maskImage: 'linear-gradient(90deg, transparent 0%, #000 3%, #000 97%, transparent 100%)' }}>
      <div className="ticker-track whitespace-nowrap text-[11px] font-medium text-text-muted leading-none py-1">
        {text}{text}
      </div>
    </div>
  );
}

export default function Header({ stats, collapsed, runs }) {
  const latestRun = runs?.[0];

  const tickerItems = useMemo(() => {
    const items = [];
    if (latestRun) {
      const daysAgo = Math.floor((new Date() - new Date(latestRun.date)) / (1000 * 60 * 60 * 24));
      const ago = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;
      items.push(`Latest: ${latestRun.name}  ·  ${latestRun.distance_km.toFixed(1)} km  ·  ${latestRun.pace_display || ''}  ·  ${ago}`);
    }
    items.push(`${stats?.totalRuns || 0} total runs  ·  ${Math.round(stats?.totalDistance || 0)} km total  ·  ${Math.round(stats?.totalElevation || 0)} m climbed`);
    return items;
  }, [latestRun, stats]);

  return (
    <header
      className="glass sticky top-0 z-40 flex items-center gap-4"
      style={{
        height: 52,
        paddingLeft: collapsed ? 88 : 256,
        paddingRight: 24,
        transition: 'padding-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Ticker items={tickerItems} />

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card border border-border-primary/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[11px] font-semibold text-text-secondary whitespace-nowrap">
            <span className="text-text-primary">{stats?.currentStreak || 0}</span> day streak
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card border border-border-primary/50">
          <Activity size={13} className="text-strava-orange" />
          <span className="text-[11px] font-semibold text-text-secondary whitespace-nowrap">
            <span className="text-text-primary">{stats?.totalRuns || 0}</span> runs
          </span>
        </div>
        <img src="/app_logo.png" alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
        <SettingsPanel />
      </div>
    </header>
  );
}
