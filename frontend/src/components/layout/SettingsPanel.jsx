import { useState } from 'react';
import { Settings, Palette } from 'lucide-react';
import { useTheme, themes } from '../../data/theme.jsx';

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-card border border-border-primary/50 hover:bg-bg-card-hover transition-all duration-200"
        title="Settings"
      >
        <Settings size={14} className="text-text-muted" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-50 card p-4"
            style={{ width: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Palette size={14} className="text-strava-orange" />
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Theme</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {Object.values(themes).map((t) => (
                <button
                  key={t.name}
                  onClick={() => { setTheme(t.name); setOpen(false); }}
                  className="flex flex-col items-center gap-1"
                  title={t.label}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110"
                    style={{
                      background: t.accent,
                      borderColor: theme === t.name ? '#FAFAFA' : 'transparent',
                      boxShadow: theme === t.name ? `0 0 12px ${t.accent}60` : 'none',
                    }}
                  />
                  <span className="text-[9px] text-text-muted font-medium">{t.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
