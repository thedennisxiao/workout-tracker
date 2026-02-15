function formatVolume(v) {
  if (v >= 1000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(v);
}

function buildCalendarRows(year, month, activeDays, today) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  let html = '<div class="cal-row cal-header"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>';

  let day = 1;
  for (let row = 0; row < 6; row++) {
    if (day > daysInMonth) break;
    html += '<div class="cal-row">';
    for (let col = 0; col < 7; col++) {
      if ((row === 0 && col < firstDay) || day > daysInMonth) {
        html += '<div class="cal-day empty"></div>';
      } else {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = dateStr === todayStr;
        const hasWorkout = activeDays.has(day);
        const classes = ['cal-day'];
        if (isToday) classes.push('today');
        if (hasWorkout) classes.push('active');
        html += `<div class="${classes.join(' ')}" data-date="${dateStr}">
          <span>${day}</span>
          ${hasWorkout ? '<div class="cal-dot"></div>' : ''}
        </div>`;
        day++;
      }
    }
    html += '</div>';
  }
  return html;
}

function renderCalendar(year, month) {
  const app = document.getElementById('app');
  const now = new Date();
  if (year == null) year = now.getFullYear();
  if (month == null) month = now.getMonth();

  const logs = Storage.getLogsByMonth(year, month);

  // Compute summary stats
  const totalWorkouts = logs.length;
  let totalSets = 0;
  let totalVolume = 0;
  const trainingDays = new Set();
  const activeDays = new Set();

  logs.forEach(log => {
    const d = new Date(log.date).getDate();
    trainingDays.add(d);
    activeDays.add(d);
    log.exercises.forEach(ex => {
      totalSets += ex.sets.length;
      ex.sets.forEach(s => {
        totalVolume += (Number(s.reps) || 0) * (Number(s.weight) || 0);
      });
    });
  });

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let html = `
    <div class="header">
      <div class="header-row">
        <button class="back-btn" id="back-btn">← Back</button>
      </div>
      <h1>Calendar</h1>
    </div>

    <div class="summary-banner" id="summary-banner">
      <div class="summary-toggle" id="summary-toggle">
        <span>Monthly Summary</span>
        <span class="chevron" id="summary-chevron">▾</span>
      </div>
      <div class="summary-stats" id="summary-stats">
        <div class="stat-item">
          <div class="stat-value">${totalWorkouts}</div>
          <div class="stat-label">Workouts</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalSets}</div>
          <div class="stat-label">Total Sets</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${formatVolume(totalVolume)}</div>
          <div class="stat-label">Volume</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${trainingDays.size}</div>
          <div class="stat-label">Training Days</div>
        </div>
      </div>
    </div>

    <div class="month-nav">
      <button class="month-nav-btn" id="prev-month">‹</button>
      <span class="month-nav-label">${monthLabel}</span>
      <button class="month-nav-btn" id="next-month">›</button>
    </div>

    <div class="cal-grid">
      ${buildCalendarRows(year, month, activeDays, now)}
    </div>
    <div class="pb-32"></div>
  `;

  app.innerHTML = html;

  // Events
  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.hash = '';
  });

  document.getElementById('prev-month').addEventListener('click', () => {
    const prev = new Date(year, month - 1);
    renderCalendar(prev.getFullYear(), prev.getMonth());
  });

  document.getElementById('next-month').addEventListener('click', () => {
    const next = new Date(year, month + 1);
    renderCalendar(next.getFullYear(), next.getMonth());
  });

  document.getElementById('summary-toggle').addEventListener('click', () => {
    const stats = document.getElementById('summary-stats');
    const chevron = document.getElementById('summary-chevron');
    const collapsed = stats.style.display === 'none';
    stats.style.display = collapsed ? '' : 'none';
    chevron.textContent = collapsed ? '▾' : '▸';
  });

  app.querySelectorAll('.cal-day[data-date]').forEach(el => {
    el.addEventListener('click', () => {
      window.location.hash = `#calendar/${el.dataset.date}`;
    });
  });
}

function renderCalendarDay(dateStr) {
  const app = document.getElementById('app');
  const d = new Date(dateStr + 'T12:00:00');
  const formatted = d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  const logs = Storage.getLogsByDate(dateStr);

  let html = `
    <div class="header">
      <div class="header-row">
        <button class="back-btn" id="back-btn">← Back</button>
      </div>
      <h1>${formatted}</h1>
    </div>
  `;

  if (logs.length === 0) {
    html += '<div class="empty-state">No workouts on this day</div>';
  } else {
    logs.forEach(log => {
      const template = WORKOUT_TEMPLATES.find(t => t.id === log.templateId);
      const name = template ? template.name : log.templateId;
      html += `<div class="history-date-label">${name}</div>`;

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

        html += '</div>';
      });
    });
  }

  html += '<div class="pb-32"></div>';
  app.innerHTML = html;

  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.hash = '#calendar';
  });

  app.querySelectorAll('.clickable-exercise').forEach(el => {
    el.addEventListener('click', () => {
      window.location.hash = `#progress/${el.dataset.exerciseId}`;
    });
  });
}
