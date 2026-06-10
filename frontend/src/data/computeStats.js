export function computeStats(runs) {
  if (!runs || runs.length === 0) return {};

  const totalRuns = runs.length;
  const totalDistance = runs.reduce((s, r) => s + r.distance_km, 0);
  const totalTimeSec = runs.reduce((s, r) => s + r.moving_time_sec, 0);
  const totalElevation = runs.reduce((s, r) => s + r.elevation_gain_m, 0);
  const totalCalories = runs.reduce((s, r) => s + r.calories, 0);

  const runsWithHR = runs.filter((r) => r.average_hr);
  const avgHR = runsWithHR.length > 0
    ? runsWithHR.reduce((s, r) => s + r.average_hr, 0) / runsWithHR.length
    : null;

  const avgPaceSec = runs.filter((r) => r.pace_sec_per_km)
    .reduce((s, r) => s + r.pace_sec_per_km, 0) / runs.filter((r) => r.pace_sec_per_km).length;

  const hrs = Math.floor(totalTimeSec / 3600);
  const mins = Math.floor((totalTimeSec % 3600) / 60);

  const weeklyData = {};
  const monthlyData = {};
  const yearlyData = {};
  const paceZoneCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const hrZoneCount = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const weeklyKm = {};
  const bestEfforts = {};

  const dailyData = {};

  runs.forEach((run) => {
    const d = new Date(run.date);
    const dayKey = d.toISOString().slice(0, 10);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const yearKey = `${d.getFullYear()}`;

    if (!dailyData[dayKey]) {
      dailyData[dayKey] = { distance: 0, count: 0, paceSum: 0 };
    }
    dailyData[dayKey].distance += run.distance_km;
    dailyData[dayKey].count += 1;
    if (run.pace_sec_per_km) {
      dailyData[dayKey].paceSum += run.pace_sec_per_km;
    }

    weeklyKm[weekKey] = (weeklyKm[weekKey] || 0) + run.distance_km;

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { week: weekKey, runs: 0, distance: 0, time: 0, elevation: 0 };
    }
    weeklyData[weekKey].runs++;
    weeklyData[weekKey].distance += run.distance_km;
    weeklyData[weekKey].time += run.moving_time_sec;
    weeklyData[weekKey].elevation += run.elevation_gain_m;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, runs: 0, distance: 0, time: 0, elevation: 0 };
    }
    monthlyData[monthKey].runs++;
    monthlyData[monthKey].distance += run.distance_km;
    monthlyData[monthKey].time += run.moving_time_sec;
    monthlyData[monthKey].elevation += run.elevation_gain_m;

    if (!yearlyData[yearKey]) {
      yearlyData[yearKey] = { year: yearKey, label: yearKey, runs: 0, distance: 0, time: 0, elevation: 0 };
    }
    yearlyData[yearKey].runs++;
    yearlyData[yearKey].distance += run.distance_km;
    yearlyData[yearKey].time += run.moving_time_sec;
    yearlyData[yearKey].elevation += run.elevation_gain_m;

    if (run.splits) {
      run.splits.forEach((s) => {
        if (s.pace_sec) {
          let zone = 6;
          const paceThresholds = [240, 270, 300, 330, 360];
          for (let i = 0; i < paceThresholds.length; i++) {
            if (s.pace_sec <= paceThresholds[i]) {
              zone = i + 1;
              break;
            }
          }
          if (paceZoneCount[zone] !== undefined) paceZoneCount[zone]++;
        }
        if (s.avg_hr) {
          const zone = s.avg_hr < 120 ? 1 : s.avg_hr < 140 ? 2 : s.avg_hr < 155 ? 3 : s.avg_hr < 170 ? 4 : 5;
          hrZoneCount[zone]++;
        }
      });
    }

    if (run.best_efforts) {
      run.best_efforts.forEach((be) => {
        if (!bestEfforts[be.label] || be.time_sec < bestEfforts[be.label].time_sec) {
          bestEfforts[be.label] = { label: be.label, time_sec: be.time_sec, distance_m: be.distance_m, date: run.date, runName: run.name };
        }
      });
    }
  });

  const weeklyArray = Object.values(weeklyData)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-16);

  const sparklineData = weeklyArray.slice(-8).map((w) => Math.round(w.distance * 10) / 10);

  const monthlyArray = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  const yearlyArray = Object.values(yearlyData)
    .sort((a, b) => a.year.localeCompare(b.year));

  const paceTrend = runs.filter((r) => r.pace_sec_per_km)
    .slice(-30)
    .map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      pace: r.pace_sec_per_km,
      distance: r.distance_km,
    }));

  const longestRun = runs.reduce((a, b) => (a.distance_km > b.distance_km ? a : b), runs[0]);
  const fastestRun = runs.filter((r) => r.pace_sec_per_km)
    .reduce((a, b) => (a.pace_sec_per_km < b.pace_sec_per_km ? a : b), runs[0]);
  const maxHR = Math.max(...runs.filter((r) => r.max_hr).map((r) => r.max_hr));
  const avgDistance = totalDistance / totalRuns;

  let currentStreak = 0;
  let longestStreak = 0;
  const sortedRuns = [...runs].sort((a, b) => a.date - b.date);
  let tempStreak = 0;
  for (let i = 1; i < sortedRuns.length; i++) {
    const diffDays = (sortedRuns[i].date - sortedRuns[i - 1].date) / (1000 * 60 * 60 * 24);
    if (diffDays <= 2) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  const now = new Date();
  let streak = 0;
  for (let i = sortedRuns.length - 1; i >= 0; i--) {
    const diffDays = (now - sortedRuns[i].date) / (1000 * 60 * 60 * 24);
    if (diffDays <= streak + 1) streak++;
    else break;
  }
  if (streak > 0) currentStreak = streak;

  return {
    totalRuns,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalTimeHours: hrs,
    totalTimeMins: mins,
    totalTimeDisplay: `${hrs}h ${mins}m`,
    totalElevation: Math.round(totalElevation),
    totalCalories: Math.round(totalCalories),
    avgHR: avgHR ? Math.round(avgHR) : null,
    avgPaceSec: Math.round(avgPaceSec),
    avgPaceDisplay: `${Math.floor(avgPaceSec / 60)}:${String(Math.round(avgPaceSec % 60)).padStart(2, '0')} /km`,
    avgDistance: Math.round(avgDistance * 100) / 100,
    maxHR: Math.round(maxHR),
    longestRun,
    fastestRun,
    currentStreak,
    longestStreak,
    weeklyKm,
    weeklyData: weeklyArray,
    monthlyData: monthlyArray,
    yearlyData: yearlyArray,
    dailyData,
    sparklineData,
    paceTrend,
    paceZoneCount,
    hrZoneCount,
    bestEfforts: Object.values(bestEfforts).sort((a, b) => a.distance_m - b.distance_m),
  };
}
