function renderHistory() {
  const app = document.getElementById('app');
  const logs = Storage.getLogs().sort((a, b) => new Date(b.date) - new Date(a.date));

  let html = `
    <div class="header">
      <div class="header-row">
        <button class="back-btn" id="back-btn">← Back</button>
      </div>
      <h1>History</h1>
    </div>
  `;

  if (logs.length === 0) {
    html += `<div class="empty-state">No workouts logged yet</div>`;
  } else {
    // Group by calendar date
    const groups = {};
    logs.forEach(log => {
      const dateKey = new Date(log.date).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });

    Object.entries(groups).forEach(([dateLabel, dateLogs]) => {
      html += `<div class="history-date-label">${dateLabel}</div>`;
      dateLogs.forEach(log => {
        const template = getAllTemplates().find(t => t.id === log.templateId);
        const name = template ? template.name : log.templateId;
        const exerciseCount = log.exercises.filter(e => e.sets.length > 0).length;
        const totalSets = log.exercises.reduce((sum, e) => sum + e.sets.length, 0);

        html += `
          <div class="card history-card" data-log-id="${log.id}">
            <div class="card-title">${name}</div>
            <div class="card-meta">${exerciseCount} exercises · ${totalSets} sets</div>
          </div>
        `;
      });
    });
  }

  html += `<div class="pb-32"></div>`;
  app.innerHTML = html;

  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.hash = '';
  });

  app.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.hash = `#history/${card.dataset.logId}`;
    });
  });
}

function renderHistoryDetail(logId) {
  const app = document.getElementById('app');
  const log = Storage.getLogById(logId);

  if (!log) {
    window.location.hash = '#history';
    return;
  }

  const template = getAllTemplates().find(t => t.id === log.templateId);
  const name = template ? template.name : log.templateId;
  const dateStr = new Date(log.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  const timeStr = new Date(log.date).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit'
  });

  let html = `
    <div class="header">
      <div class="header-row">
        <button class="back-btn" id="back-btn">← Back</button>
      </div>
      <h1>${name}</h1>
      <div class="header-subtitle">${dateStr} at ${timeStr}</div>
    </div>
  `;

  log.exercises.forEach(ex => {
    if (ex.sets.length === 0) return;

    const exerciseDef = EXERCISES[ex.exerciseId];
    const exerciseName = exerciseDef ? exerciseDef.name : ex.exerciseId;

    html += `
      <div class="history-exercise">
        <div class="history-exercise-name clickable-exercise" data-exercise-id="${ex.exerciseId}">
          ${exerciseName} <span class="progress-link">📈</span>
        </div>
    `;

    ex.sets.forEach((set, i) => {
      const weightStr = set.weight ? ` × ${set.weight} lbs` : '';
      html += `<div class="history-set-line">Set ${i + 1}: ${set.reps} reps${weightStr}</div>`;
    });

    if (ex.note) {
      html += `<div class="history-note">${ex.note}</div>`;
    }

    html += `</div>`;
  });

  html += `<div class="pb-32"></div>`;
  app.innerHTML = html;

  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.hash = '#history';
  });

  app.querySelectorAll('.clickable-exercise').forEach(el => {
    el.addEventListener('click', () => {
      window.location.hash = `#progress/${el.dataset.exerciseId}`;
    });
  });
}
