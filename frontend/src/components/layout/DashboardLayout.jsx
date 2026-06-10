import { useState, useMemo, useEffect } from 'react';
import { parseCSV } from '../../data/parseCSV';
import { computeStats } from '../../data/computeStats';
import { fetchRuns } from '../../data/api';
import { ThemeProvider } from '../../data/theme.jsx';
import Sidebar from './Sidebar';
import Header from './Header';
import SettingsPanel from './SettingsPanel';
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeFading, setWelcomeFading] = useState(false);

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

  useEffect(() => {
    const t1 = setTimeout(() => setWelcomeFading(true), 2000);
    const t2 = setTimeout(() => setShowWelcome(false), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
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
    <ThemeProvider>
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

      {showWelcome && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg-primary"
          style={{
            opacity: welcomeFading ? 0 : 1,
            transition: 'opacity 1s ease-in-out',
          }}
        >
          <img
            src="/app_logo.png"
            alt="Strava Dashboard"
            className="w-24 h-24 mb-6"
            style={{
              animation: 'welcomePulse 2s ease-in-out',
            }}
          />
          <h1
            className="text-3xl font-bold text-text-primary mb-2"
            style={{
              animation: 'welcomeSlideUp 1s ease-out both',
            }}
          >
            Strava Dashboard
          </h1>
          <p
            className="text-sm text-strava-orange font-medium"
            style={{
              animation: 'welcomeSlideUp 1s ease-out 0.3s both',
            }}
          >
            Your running journey, visualized
          </p>
        </div>
      )}
    </div>
    </ThemeProvider>
  );
}
