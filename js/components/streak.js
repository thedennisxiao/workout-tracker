function computeStreaks() {
  const logs = Storage.getLogs();

  if (logs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, thisWeekCount: 0 };
  }

  // Get Monday-start week key for a date
  function weekKey(date) {
    const d = new Date(date);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? 6 : day - 1; // days since Monday
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
    return monday.getFullYear() + '-' +
      String(monday.getMonth() + 1).padStart(2, '0') + '-' +
      String(monday.getDate()).padStart(2, '0');
  }

  // Collect unique week keys
  const weekSet = new Set();
  logs.forEach(log => {
    weekSet.add(weekKey(new Date(log.date)));
  });

  const weeks = Array.from(weekSet).sort();

  // Find longest consecutive run
  let longestStreak = 1;
  let currentRun = 1;
  for (let i = 1; i < weeks.length; i++) {
    const prev = new Date(weeks[i - 1]);
    const curr = new Date(weeks[i]);
    const diff = (curr - prev) / (7 * 24 * 60 * 60 * 1000);
    if (Math.abs(diff - 1) < 0.01) {
      currentRun++;
      if (currentRun > longestStreak) longestStreak = currentRun;
    } else {
      currentRun = 1;
    }
  }

  // Current streak: walk backwards from current or previous week
  const now = new Date();
  const thisWeekKey = weekKey(now);
  const lastWeekDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const lastWeekKey = weekKey(lastWeekDate);

  let currentStreak = 0;
  if (weekSet.has(thisWeekKey)) {
    currentStreak = 1;
    let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    while (weekSet.has(weekKey(checkDate))) {
      currentStreak++;
      checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate() - 7);
    }
  } else if (weekSet.has(lastWeekKey)) {
    currentStreak = 1;
    let checkDate = new Date(lastWeekDate.getFullYear(), lastWeekDate.getMonth(), lastWeekDate.getDate() - 7);
    while (weekSet.has(weekKey(checkDate))) {
      currentStreak++;
      checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate() - 7);
    }
  }

  // This week count
  const thisMonday = new Date(now);
  const day = thisMonday.getDay();
  const mondayDiff = day === 0 ? 6 : day - 1;
  thisMonday.setDate(thisMonday.getDate() - mondayDiff);
  thisMonday.setHours(0, 0, 0, 0);

  const thisWeekCount = logs.filter(log => new Date(log.date) >= thisMonday).length;

  return { currentStreak, longestStreak, thisWeekCount };
}
