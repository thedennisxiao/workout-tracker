function getAllTemplates() {
  return [...WORKOUT_TEMPLATES, ...Storage.getCustomTemplates()];
}

function renderHome() {
  const app = document.getElementById('app');
  const streaks = computeStreaks();
  const strengthData = computeStrengthScore();

  let html = `
    <div class="header">
      <div class="header-row" style="justify-content:space-between">
        <h1>Workouts</h1>
        <div class="header-icons">
          <button class="icon-btn" id="calendar-btn" title="Calendar">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </button>
          <button class="icon-btn" id="history-btn" title="History">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </button>
          <button class="icon-btn" id="data-btn" title="Settings">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>`;

  // Strength score compact card (only if bodyweight is set)
  if (strengthData.hasData) {
    html += `<div id="strength-card-container"></div>`;
  }

  // Streak + This Week row
  html += `
    <div class="dashboard-row">
      <div class="card streak-card">
        <div class="streak-value">${streaks.currentStreak}<span class="streak-flame">🔥</span></div>
        <div class="card-meta">Week Streak</div>
      </div>
      <div class="card week-card">
        <div class="streak-value">${streaks.thisWeekCount}</div>
        <div class="card-meta">This Week</div>
      </div>
    </div>`;

  // Recent activity
  const logs = Storage.getLogs().sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentLogs = logs.slice(0, 3);
  if (recentLogs.length > 0) {
    html += `<div class="section-title">Recent Activity</div>`;
    recentLogs.forEach(log => {
      const allTemplates = getAllTemplates();
      const template = allTemplates.find(t => t.id === log.templateId);
      const name = template ? template.name : log.templateId;
      const d = new Date(log.date);
      const now = new Date();
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      let relDate;
      if (diffDays === 0) relDate = 'Today';
      else if (diffDays === 1) relDate = 'Yesterday';
      else if (diffDays < 7) relDate = `${diffDays} days ago`;
      else relDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const exerciseCount = log.exercises.filter(e => e.sets.length > 0).length;
      const totalSets = log.exercises.reduce((sum, e) => sum + e.sets.length, 0);

      html += `
        <div class="card recent-card" data-log-id="${log.id}">
          <div class="card-title">${name}</div>
          <div class="card-meta">${relDate} · ${exerciseCount} exercises · ${totalSets} sets</div>
        </div>
      `;
    });
  }

  // Start Workout section
  html += `<div class="section-title">Start Workout</div>`;

  const allTemplates = getAllTemplates();
  allTemplates.forEach(template => {
    const lastDate = Storage.getLastDate(template.id);
    const dateStr = lastDate
      ? `Last: ${new Date(lastDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : 'Not yet completed';
    const exerciseCount = template.exercises.length;

    html += `
      <div class="card" data-template="${template.id}">
        <div class="card-title">${template.name}</div>
        <div class="card-meta">${exerciseCount} exercises &middot; ${dateStr}</div>
      </div>
    `;
  });

  // Create Workout button
  html += `
    <div class="mt-12">
      <button class="btn btn-secondary" id="create-template-btn">+ Create Workout</button>
    </div>
    <div class="pb-32"></div>
  `;

  app.innerHTML = html;

  // Mount compact strength card
  if (strengthData.hasData) {
    const container = document.getElementById('strength-card-container');
    const card = createStrengthScoreCard(strengthData, true);
    card.addEventListener('click', () => {
      window.location.hash = '#settings';
    });
    container.appendChild(card);
  }

  // Tap handlers
  app.querySelectorAll('.card[data-template]').forEach(card => {
    card.addEventListener('click', () => {
      const templateId = card.dataset.template;
      startWorkout(templateId);
    });
  });

  app.querySelectorAll('.recent-card[data-log-id]').forEach(card => {
    card.addEventListener('click', () => {
      window.location.hash = `#history/${card.dataset.logId}`;
    });
  });

  document.getElementById('calendar-btn').addEventListener('click', () => {
    window.location.hash = '#calendar';
  });

  document.getElementById('history-btn').addEventListener('click', () => {
    window.location.hash = '#history';
  });

  document.getElementById('data-btn').addEventListener('click', () => {
    window.location.hash = '#settings';
  });

  document.getElementById('create-template-btn').addEventListener('click', () => {
    window.location.hash = '#template/new';
  });
}

function startWorkout(templateId) {
  const allTemplates = getAllTemplates();
  const template = allTemplates.find(t => t.id === templateId);
  if (!template) return;

  const session = {
    templateId: template.id,
    startTime: Date.now(),
    exercises: template.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      sets: []
    }))
  };

  Storage.saveActiveSession(session);
  window.location.hash = `#workout/${templateId}`;
}
