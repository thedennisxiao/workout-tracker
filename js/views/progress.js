function renderProgress(exerciseId) {
  const app = document.getElementById('app');
  const exerciseDef = EXERCISES[exerciseId];
  const exerciseName = exerciseDef ? exerciseDef.name : exerciseId;
  const history = Storage.getExerciseHistory(exerciseId);

  let html = `
    <div class="header">
      <div class="header-row">
        <button class="back-btn" id="back-btn">← Back</button>
      </div>
      <h1>${exerciseName}</h1>
      <div class="header-subtitle">Progress</div>
    </div>
  `;

  if (history.length === 0) {
    html += '<div class="empty-state">No data yet for this exercise</div>';
    html += '<div class="pb-32"></div>';
    app.innerHTML = html;
    document.getElementById('back-btn').addEventListener('click', () => {
      window.history.back();
    });
    return;
  }

  // Determine if bodyweight (all weights are 0)
  const isBodyweight = history.every(h => h.maxWeight === 0);

  const latest = history[history.length - 1];
  const personalBest = isBodyweight
    ? Math.max(...history.map(h => h.maxReps))
    : Math.max(...history.map(h => h.maxWeight));
  const latestVal = isBodyweight ? latest.maxReps : latest.maxWeight;
  const unit = isBodyweight ? 'reps' : 'lbs';

  html += `
    <div class="progress-summary">
      <div class="stat-item">
        <div class="stat-value">${latestVal} <small>${unit}</small></div>
        <div class="stat-label">Latest</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${personalBest} <small>${unit}</small></div>
        <div class="stat-label">Best</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${history.length}</div>
        <div class="stat-label">Sessions</div>
      </div>
    </div>
    <div class="chart-section" id="chart-container"></div>
  `;

  // Recent sessions (last 10)
  const recent = history.slice(-10).reverse();
  html += '<h2 class="section-title">Recent Sessions</h2>';
  recent.forEach(session => {
    const d = new Date(session.date);
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const setBreakdown = session.sets.map(s => {
      const w = Number(s.weight) || 0;
      const r = Number(s.reps) || 0;
      return w > 0 ? `${r}×${w}` : `${r} reps`;
    }).join(', ');

    html += `
      <div class="progress-session">
        <div class="progress-session-date">${dateLabel}</div>
        <div class="progress-session-sets">${setBreakdown}</div>
      </div>
    `;
  });

  html += '<div class="pb-32"></div>';
  app.innerHTML = html;

  // Render chart
  const chartData = history.map(h => ({
    date: h.date,
    value: isBodyweight ? h.maxReps : h.maxWeight
  }));
  const chartEl = createProgressChart(chartData, isBodyweight ? 'Reps' : 'lbs');
  document.getElementById('chart-container').appendChild(chartEl);

  document.getElementById('back-btn').addEventListener('click', () => {
    window.history.back();
  });
}
