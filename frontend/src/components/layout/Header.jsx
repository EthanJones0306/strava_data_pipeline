import { format } from 'date-fns';
import { Zap, Activity } from 'lucide-react';

export default function Header({ stats, collapsed }) {
  return (
    <header
      className="glass sticky top-0 z-40 h-16 flex items-center justify-between"
      style={{
        paddingLeft: collapsed ? 88 : 256,
        paddingRight: 24,
        transition: 'padding-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base font-bold text-text-primary m-0">Dashboard</h1>
          <p className="text-[11px] text-text-muted font-medium mt-0.5">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-bg-card border border-border-primary/50">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs font-semibold text-text-secondary">
            <span className="text-text-primary">{stats?.currentStreak || 0}</span> day streak
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-bg-card border border-border-primary/50">
          <Activity size={14} className="text-strava-orange" />
          <span className="text-xs font-semibold text-text-secondary">
            <span className="text-text-primary">{stats?.totalRuns || 0}</span> total runs
          </span>
        </div>
      </div>
    </header>
  );
}
