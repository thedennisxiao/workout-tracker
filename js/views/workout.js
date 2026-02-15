function renderWorkout(templateId) {
  const app = document.getElementById('app');
  const template = WORKOUT_TEMPLATES.find(t => t.id === templateId);
  if (!template) { window.location.hash = ''; return; }

  const session = Storage.getActiveSession();

  // Group exercises by superset
  const groups = [];
  const groupMap = {};

  template.exercises.forEach((ex, idx) => {
    const base = ex.group.replace(/[0-9]/g, '');
    if (!groupMap[base]) {
      groupMap[base] = { label: base, items: [] };
      groups.push(groupMap[base]);
    }
    groupMap[base].items.push({ ...ex, index: idx });
  });

  let html = `
    <div class="header">
      <div class="header-row">
        <button class="back-btn" id="back-btn">← Back</button>
      </div>
      <h1>${template.name}</h1>
      <div class="workout-timer" id="timer"></div>
    </div>
  `;

  groups.forEach(group => {
    const isSuperset = group.items.length > 1;

    if (isSuperset) {
      html += `<div class="superset-group">`;
      html += `<div class="superset-label">Superset ${group.label}</div>`;
      html += `<div class="superset-items">`;
    } else {
      html += `<div class="standalone-exercise">`;
    }

    group.items.forEach(item => {
      const exercise = EXERCISES[item.exerciseId];
      const rpeStr = item.rpe ? ` @ RPE ${item.rpe}` : '';
      const eachStr = exercise.unilateral ? ' each' : '';
      const target = `${item.sets}×${item.reps}${eachStr}${rpeStr}`;

      // Check if this exercise has logged sets in the session
      const sessionEx = session?.exercises?.[item.index];
      const hasSets = sessionEx?.sets?.length > 0 && sessionEx.sets.some(s => s.done);
      const statusClass = hasSets ? 'done' : '';
      const statusIcon = hasSets ? '✓' : '›';

      html += `
        <div class="exercise-card" data-template="${templateId}" data-index="${item.index}">
          <div>
            <div class="exercise-name">${exercise.name}</div>
            <div class="exercise-info">${item.group} &middot; ${target}</div>
          </div>
          <div class="exercise-status ${statusClass}">${statusIcon}</div>
        </div>
      `;
    });

    if (isSuperset) {
      html += `</div></div>`;
    } else {
      html += `</div>`;
    }
  });

  html += `
    <div class="mt-16 pb-32">
      <button class="btn btn-primary" id="complete-btn">Complete Workout</button>
    </div>
  `;

  app.innerHTML = html;

  // Timer
  if (session?.startTime) {
    const timerEl = document.getElementById('timer');
    function updateTimer() {
      const elapsed = Date.now() - session.startTime;
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')} elapsed`;
    }
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    // Clean up on navigation
    window._timerInterval = timerInterval;
  }

  // Handlers
  document.getElementById('back-btn').addEventListener('click', () => {
    if (confirm('Leave workout? Your progress is saved.')) {
      window.location.hash = '';
    }
  });

  app.querySelectorAll('.exercise-card').forEach(card => {
    card.addEventListener('click', () => {
      const tId = card.dataset.template;
      const idx = card.dataset.index;
      window.location.hash = `#exercise/${tId}/${idx}`;
    });
  });

  document.getElementById('complete-btn').addEventListener('click', () => {
    if (confirm('Complete workout and save?')) {
      completeWorkout(templateId);
    }
  });
}

function completeWorkout(templateId) {
  const session = Storage.getActiveSession();
  if (!session) return;

  const log = {
    id: Date.now().toString(),
    templateId: templateId,
    date: new Date().toISOString(),
    exercises: session.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      sets: (ex.sets || []).filter(s => s.done).map(s => ({
        reps: s.reps,
        weight: s.weight
      })),
      note: ex.note || undefined
    }))
  };

  Storage.saveLog(log);
  Storage.clearActiveSession();

  if (window._timerInterval) clearInterval(window._timerInterval);

  window.location.hash = '';
}
