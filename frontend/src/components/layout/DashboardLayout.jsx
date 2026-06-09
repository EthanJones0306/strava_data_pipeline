import { useState, useMemo, useEffect } from 'react';
import { parseCSV } from '../../data/parseCSV';
import { computeStats } from '../../data/computeStats';
import { fetchRuns } from '../../data/api';
import Sidebar from './Sidebar';
import Header from './Header';
import OverviewTab from '../overview/OverviewTab';
import PaceTab from '../pace/PaceTab';
import HeartRateTab from '../heartrate/HeartRateTab';
import ElevationTab from '../elevation/ElevationTab';
import DeepDiveTab from '../deepdive/DeepDiveTab';

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [apiRuns, setApiRuns] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRuns()
      .then((runs) => {
        setApiRuns(runs);
        setLoading(false);
      })
      .catch(() => {
        setApiRuns(null);
        setLoading(false);
      });
  }, []);

  const runs = useMemo(() => {
    if (apiRuns) return apiRuns;
    if (!loading) return parseCSV();
    return [];
  }, [apiRuns, loading]);

  const stats = useMemo(() => computeStats(runs), [runs]);

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab runs={runs} stats={stats} />;
      case 'pace': return <PaceTab runs={runs} stats={stats} />;
      case 'heartrate': return <HeartRateTab runs={runs} stats={stats} />;
      case 'elevation': return <ElevationTab runs={runs} stats={stats} />;
      case 'deepdive': return <DeepDiveTab runs={runs} stats={stats} />;
      default: return <OverviewTab runs={runs} stats={stats} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-bg-primary">
      <div className="fixed left-0 top-0 bottom-0 z-50">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      <div
        className="flex-1 flex flex-col"
        style={{ marginLeft: sidebarCollapsed ? 64 : 240, transition: 'margin-left 250ms ease' }}
      >
        <Header stats={stats} collapsed={sidebarCollapsed} />
        <main className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-strava-orange border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-text-muted font-medium">Loading runs...</p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in" key={activeTab}>
              {renderTab()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
