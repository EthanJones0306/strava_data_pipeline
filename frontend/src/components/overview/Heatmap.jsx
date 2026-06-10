import { useState, useMemo } from 'react';

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getIntensity(distance) {
  if (distance === 0) return 0;
  if (distance < 3) return 1;
  if (distance < 6) return 2;
  if (distance < 10) return 3;
  if (distance < 15) return 4;
  return 5;
}

const INTENSITY_COLORS = [
  'var(--color-bg-card)',
  'color-mix(in srgb, var(--color-strava-orange) 20%, var(--color-bg-card))',
  'color-mix(in srgb, var(--color-strava-orange) 40%, var(--color-bg-card))',
  'color-mix(in srgb, var(--color-strava-orange) 60%, var(--color-bg-card))',
  'color-mix(in srgb, var(--color-strava-orange) 80%, var(--color-bg-card))',
  'var(--color-strava-orange)',
];

export default function Heatmap({ runs, dailyData }) {
  const [tooltip, setTooltip] = useState(null);

  const { grid, totalCols, monthMarkers } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const pad = startOfYear.getDay();
    const startDate = new Date(startOfYear);
    startDate.setDate(startDate.getDate() - pad);

    const grid = [[], [], [], [], [], [], []];
    const monthMarkers = [];
    const day = new Date(startDate);
    const seenMonths = new Set();
    let totalDays = 0;

    while (day <= endOfYear || (day > endOfYear && day.getDay() !== 0)) {
      const dateStr = day.toISOString().slice(0, 10);
      const row = day.getDay();
      const col = Math.floor(totalDays / 7);

      const inYear = day.getFullYear() === year;
      const isFuture = inYear && day > now;

      let distance = 0;
      let count = 0;
      if (inYear && !isFuture && dailyData[dateStr]) {
        distance = Math.round(dailyData[dateStr].distance * 100) / 100;
        count = dailyData[dateStr].count;
      }

      const intensity = isFuture ? -1 : getIntensity(distance);

      if (inYear) {
        const month = day.getMonth();
        if (!seenMonths.has(month)) {
          seenMonths.add(month);
          monthMarkers.push({ col, label: MONTH_LABELS[month] });
        }
      }

      grid[row][col] = {
        key: dateStr,
        date: dateStr,
        distance,
        count,
        intensity,
        inYear,
        isFuture,
      };

      totalDays++;
      day.setDate(day.getDate() + 1);
    }

    const totalCols = Math.floor(totalDays / 7) + (totalDays % 7 > 0 ? 1 : 0);

    return { grid, totalCols, monthMarkers };
  }, [dailyData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary m-0">Run Calendar</h3>
          <p className="text-xs text-text-muted mt-0.5">A year of runs at a glance</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted font-medium">Less</span>
          {INTENSITY_COLORS.map((color, i) => (
            <span
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ background: color, border: '1px solid var(--color-border-secondary)' }}
            />
          ))}
          <span className="text-[10px] text-text-muted font-medium ml-0.5">More</span>
        </div>
      </div>
      <div className="overflow-x-auto scrollbar-hide pb-1">
        <div className="relative" style={{ minWidth: Math.max(totalCols * 16, 240) }}>
          <div className="ml-10 mb-1 relative" style={{ height: 12 }}>
            {monthMarkers.map((m, i) => (
              <span
                key={i}
                className="text-[9px] font-semibold text-text-muted absolute"
                style={{ left: `${m.col * 16}px`, top: 0 }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex" style={{ gap: 3 }}>
            <div className="flex flex-col mr-1" style={{ gap: 2 }}>
              {DAY_LABELS.map((label, i) => (
                <span
                  key={i}
                  className="text-[9px] font-medium text-text-muted text-right leading-none"
                  style={{ height: 14, lineHeight: '14px', width: 28 }}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="flex" style={{ gap: 2 }}>
              {Array.from({ length: totalCols }, (_, colIdx) => (
                <div key={colIdx} className="flex flex-col" style={{ gap: 2 }}>
                  {Array.from({ length: 7 }, (__, rowIdx) => {
                    const cell = grid[rowIdx]?.[colIdx];
                    if (!cell) return <div key={`${colIdx}-${rowIdx}`} style={{ width: 14, height: 14 }} />;
                    return (
                      <div
                        key={cell.key}
                        className="rounded-sm cursor-pointer transition-all duration-150 hover:scale-125"
                        style={{
                          width: 14,
                          height: 14,
                          background: cell.intensity >= 0 ? INTENSITY_COLORS[cell.intensity] : 'transparent',
                          border: cell.intensity > 0
                            ? '1px solid color-mix(in srgb, var(--color-strava-orange) 30%, transparent)'
                            : cell.intensity === 0 && cell.inYear
                              ? '1px solid var(--color-border-secondary)'
                              : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (cell.inYear && !cell.isFuture) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setTooltip({
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                              date: cell.date,
                              distance: cell.distance,
                              count: cell.count,
                            });
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {tooltip && (
        <div
          className="fixed z-50 glass-card px-3 py-2 text-xs pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-text-primary font-semibold">{tooltip.date}</p>
          <p className="text-text-muted mt-0.5">
            {tooltip.distance > 0
              ? `${tooltip.distance.toFixed(2)} km${tooltip.count > 1 ? ` (${tooltip.count} runs)` : ''}`
              : 'No run'}
          </p>
        </div>
      )}
    </div>
  );
}
