function playTimerBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'square';
      gain.gain.value = 0.3;
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.15);
    });
  } catch (e) {
    // Web Audio not available
  }
}

function renderLogExercise(templateId, exerciseIndex) {
  const app = document.getElementById('app');
  const allTemplates = getAllTemplates();
  const template = allTemplates.find(t => t.id === templateId);
  if (!template) { window.location.hash = ''; return; }

  const idx = parseInt(exerciseIndex);
  const exTemplate = template.exercises[idx];
  if (!exTemplate) { window.location.hash = `#workout/${templateId}`; return; }

  const exercise = EXERCISES[exTemplate.exerciseId];
  const rpeStr = exTemplate.rpe ? ` @ RPE ${exTemplate.rpe}` : '';
  const eachStr = exercise.unilateral ? ' each' : '';
  const targetStr = `${exTemplate.sets}×${exTemplate.reps}${eachStr}${rpeStr}`;

  // Get current session data
  const session = Storage.getActiveSession();
  let currentSets = session?.exercises?.[idx]?.sets;

  // Parse default reps — extract first number from strings like '12-15' or 'AMRAP-2'
  const defaultReps = typeof exTemplate.reps === 'number'
    ? exTemplate.reps
    : parseInt(exTemplate.reps) || null;

  // Get last session entry for notes and progressive overload
  const lastEntry = Storage.getLastExerciseEntry(templateId, exTemplate.exerciseId);
  const lastSets = lastEntry ? lastEntry.sets : null;
  const lastNote = lastEntry ? lastEntry.note : null;

  // Progressive overload detection
  let overloadIncrement = 0;
  if (lastSets && lastSets.length > 0) {
    const repsStr = String(exTemplate.reps);
    const isAmrap = repsStr.toUpperCase().includes('AMRAP');
    const exerciseDef = EXERCISES[exTemplate.exerciseId];
    const isBodyweight = exerciseDef && (exerciseDef.equipment === 'Bodyweight' || exerciseDef.equipment === 'Box');
    const hadWeight = lastSets.some(s => s.weight > 0);

    if (!isAmrap && !isBodyweight && hadWeight) {
      // Parse top of rep range (e.g. "6-8" → 8, "12" → 12)
      const rangeMatch = repsStr.match(/(\d+)\s*[-–]\s*(\d+)/);
      const topOfRange = rangeMatch ? parseInt(rangeMatch[2]) : parseInt(repsStr) || null;

      if (topOfRange && lastSets.every(s => s.reps >= topOfRange)) {
        overloadIncrement = 5;
      }
    }
  }

  // If no sets logged yet, pre-fill from last session or create empty
  if (!currentSets || currentSets.length === 0) {
    if (lastSets && lastSets.length > 0) {
      // Pre-fill with last session's numbers
      currentSets = lastSets.map(s => ({
        reps: s.reps || defaultReps,
        weight: s.weight ? s.weight + overloadIncrement : s.weight,
        done: false
      }));
      // Ensure we have at least the target number of sets
      while (currentSets.length < exTemplate.sets) {
        currentSets.push({ reps: defaultReps, weight: (lastSets[0]?.weight ? lastSets[0].weight + overloadIncrement : null), done: false });
      }
    } else {
      // First time — create target number of empty sets
      currentSets = [];
      for (let i = 0; i < exTemplate.sets; i++) {
        currentSets.push({ reps: defaultReps, weight: null, done: false });
      }
    }
  }

  // Load current note from session if resuming
  let currentNote = session?.exercises?.[idx]?.note || '';

  // Rest timer state
  const exerciseId = exTemplate.exerciseId;
  let restDuration = Storage.getRestTime(exerciseId);
  let timerInterval = null;
  let timerRemaining = 0;

  let html = `
    <div class="header">
      <div class="header-row">
        <button class="back-btn" id="back-btn">← Back</button>
      </div>
      <h1>${exercise.name}</h1>
      <div class="header-subtitle">${exercise.equipment}</div>
    </div>
    <div class="target-info">${targetStr}</div>
    ${overloadIncrement > 0 ? `<div class="overload-banner" id="overload-banner">↑ +${overloadIncrement} lbs from last session</div>` : ''}
    <div id="set-table-container"></div>
    <div class="note-section">
      <textarea class="note-input" id="exercise-note" rows="2" placeholder="${lastNote ? 'Previous: ' + lastNote : 'Add a note for this exercise...'}">${currentNote}</textarea>
    </div>
    <div class="rest-timer-section" id="rest-timer-section">
      <div class="rest-presets" id="rest-presets">
        <span class="rest-presets-label">Rest</span>
        <button class="rest-preset" data-seconds="60">1:00</button>
        <button class="rest-preset" data-seconds="90">1:30</button>
        <button class="rest-preset" data-seconds="120">2:00</button>
        <button class="rest-preset" data-seconds="180">3:00</button>
      </div>
      <div class="rest-countdown-wrap" id="rest-countdown-wrap" style="display:none">
        <div class="rest-countdown" id="rest-countdown">0:00</div>
        <div class="rest-progress-bar"><div class="rest-progress-fill" id="rest-progress-fill"></div></div>
      </div>
    </div>
    <div class="mt-12">
      <button class="btn btn-secondary" id="add-set-btn">+ Add Set</button>
    </div>
    <div class="pb-32"></div>
  `;

  app.innerHTML = html;

  // Overload banner auto-dismiss
  const overloadBanner = document.getElementById('overload-banner');
  if (overloadBanner) {
    const fadeTimeout = setTimeout(() => {
      overloadBanner.classList.add('fade-out');
      setTimeout(() => overloadBanner.remove(), 500);
    }, 5000);
    overloadBanner.addEventListener('click', () => {
      clearTimeout(fadeTimeout);
      overloadBanner.remove();
    });
  }

  // Note textarea handler
  document.getElementById('exercise-note').addEventListener('input', (e) => {
    currentNote = e.target.value;
    const s = Storage.getActiveSession();
    if (s) {
      s.exercises[idx].note = currentNote;
      Storage.saveActiveSession(s);
    }
  });

  // Highlight active rest preset
  function updatePresetHighlight() {
    document.querySelectorAll('.rest-preset').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.seconds) === restDuration);
    });
  }
  updatePresetHighlight();

  // Rest preset handlers
  document.querySelectorAll('.rest-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      restDuration = parseInt(btn.dataset.seconds);
      Storage.setRestTime(exerciseId, restDuration);
      updatePresetHighlight();
    });
  });

  // Timer functions
  function startTimer() {
    stopTimer();
    timerRemaining = restDuration;
    const totalSeconds = restDuration;
    // Store for floating timer
    window._restTimer = { endTime: Date.now() + restDuration * 1000, exerciseName: exercise.name };
    const countdownWrap = document.getElementById('rest-countdown-wrap');
    const countdownEl = document.getElementById('rest-countdown');
    const progressFill = document.getElementById('rest-progress-fill');
    countdownWrap.style.display = '';

    function tick() {
      const mins = Math.floor(timerRemaining / 60);
      const secs = timerRemaining % 60;
      countdownEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
      const pct = totalSeconds > 0 ? (timerRemaining / totalSeconds) * 100 : 0;
      progressFill.style.width = pct + '%';

      if (timerRemaining <= 0) {
        stopTimer();
        playTimerBeep();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        // Clear floating timer
        if (window._restTimer) window._restTimer = null;
        removeFloatingTimer();
        // Keep showing 0:00 briefly then hide
        setTimeout(() => {
          const wrap = document.getElementById('rest-countdown-wrap');
          if (wrap) wrap.style.display = 'none';
        }, 2000);
        return;
      }
      timerRemaining--;
    }

    tick();
    timerInterval = setInterval(tick, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Tap countdown to dismiss
  document.getElementById('rest-countdown-wrap').addEventListener('click', () => {
    stopTimer();
    document.getElementById('rest-countdown-wrap').style.display = 'none';
  });

  // Mount set table
  const tableContainer = document.getElementById('set-table-container');
  const table = createSetTable(currentSets, (updatedSets) => {
    // Save to active session on every change
    const s = Storage.getActiveSession();
    if (s) {
      s.exercises[idx].sets = updatedSets;
      Storage.saveActiveSession(s);
    }
  }, (setIndex) => {
    // onSetDone — auto-start rest timer
    startTimer();
  });
  tableContainer.appendChild(table);

  // Save initial sets to session
  const s = Storage.getActiveSession();
  if (s) {
    s.exercises[idx].sets = currentSets;
    Storage.saveActiveSession(s);
  }

  // Clean up timer on navigation
  const origHashHandler = () => {
    stopTimer();
    window.removeEventListener('hashchange', origHashHandler);
  };
  window.addEventListener('hashchange', origHashHandler);

  // Handlers
  document.getElementById('back-btn').addEventListener('click', () => {
    window.location.hash = `#workout/${templateId}`;
  });

  document.getElementById('add-set-btn').addEventListener('click', () => {
    table.addSet(defaultReps);
  });
}
