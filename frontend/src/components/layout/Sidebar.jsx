import { Activity, Gauge, Heart, Mountain, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'pace', label: 'Pace & Speed', icon: Gauge },
  { id: 'heartrate', label: 'Heart Rate', icon: Heart },
  { id: 'elevation', label: 'Elevation & Power', icon: Mountain },
  { id: 'deepdive', label: 'Deep Dive', icon: Search },
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggle }) {
  return (
    <aside
      className="flex flex-col border-r border-border-primary bg-bg-primary h-full"
      style={{ width: collapsed ? 68 : 240, transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      <div className="flex items-center gap-3 h-16 px-4 border-b border-border-primary flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-strava-orange flex items-center justify-center flex-shrink-0 shadow-glow-orange">
          <Activity size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="font-bold text-text-primary text-base block leading-tight">Strava Stats</span>
            <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Dashboard V2</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`sidebar-link w-full text-left ${isActive ? 'active' : ''}`}
              style={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '12px' : '11px 14px',
                marginBottom: '2px',
              }}
              title={collapsed ? tab.label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" style={{ opacity: isActive ? 1 : 0.7 }} />
              {!collapsed && <span className="text-sm font-medium">{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border-primary flex-shrink-0">
        <button
          onClick={onToggle}
          className="sidebar-link w-full text-left justify-center hover:bg-bg-card"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ padding: '10px' }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
