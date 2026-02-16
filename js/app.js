// Floating rest timer
function removeFloatingTimer() {
  const el = document.getElementById('floating-timer');
  if (el) el.remove();
}

function showFloatingTimer() {
  if (!window._restTimer) return;
  const remaining = Math.max(0, Math.ceil((window._restTimer.endTime - Date.now()) / 1000));
  if (remaining <= 0) {
    playTimerBeep();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    window._restTimer = null;
    removeFloatingTimer();
    return;
  }

  removeFloatingTimer();
  const banner = document.createElement('div');
  banner.id = 'floating-timer';
  banner.className = 'floating-timer';
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  banner.innerHTML = `<span class="floating-timer-label">Rest: ${window._restTimer.exerciseName}</span><span class="floating-timer-time">${mins}:${secs.toString().padStart(2, '0')}</span>`;
  banner.addEventListener('click', () => {
    window._restTimer = null;
    removeFloatingTimer();
  });

  const app = document.getElementById('app');
  app.insertBefore(banner, app.firstChild);

  // Update every second
  if (window._floatingTimerInterval) clearInterval(window._floatingTimerInterval);
  window._floatingTimerInterval = setInterval(() => {
    if (!window._restTimer) {
      clearInterval(window._floatingTimerInterval);
      removeFloatingTimer();
      return;
    }
    const rem = Math.max(0, Math.ceil((window._restTimer.endTime - Date.now()) / 1000));
    if (rem <= 0) {
      clearInterval(window._floatingTimerInterval);
      playTimerBeep();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      window._restTimer = null;
      removeFloatingTimer();
      return;
    }
    const el = document.getElementById('floating-timer');
    if (el) {
      const m = Math.floor(rem / 60);
      const s = rem % 60;
      el.querySelector('.floating-timer-time').textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }
  }, 1000);
}

// Card stagger animation helper
function applyCardStagger() {
  const cards = document.querySelectorAll('#app .card');
  cards.forEach((card, i) => {
    card.style.animationDelay = (i * 0.04) + 's';
  });
}

// Hash-based router
function route() {
  if (window._timerInterval) clearInterval(window._timerInterval);

  const hash = window.location.hash.slice(1) || '';
  const parts = hash.split('/');

  switch (parts[0]) {
    case 'workout':
      renderWorkout(parts[1]);
      break;
    case 'exercise':
      renderLogExercise(parts[1], parts[2]);
      break;
    case 'history':
      if (parts[1]) {
        renderHistoryDetail(parts[1]);
      } else {
        renderHistory();
      }
      break;
    case 'calendar':
      if (parts[1]) {
        renderCalendarDay(parts[1]);
      } else {
        renderCalendar();
      }
      break;
    case 'progress':
      renderProgress(parts[1]);
      break;
    case 'settings':
      renderSettings();
      break;
    case 'template':
      if (parts[1] === 'new') {
        renderTemplateBuilder();
      } else if (parts[1] === 'edit' && parts[2]) {
        renderTemplateBuilder(parts[2]);
      }
      break;
    default:
      renderHome();
  }

  // After route render, show floating timer if active and not on exercise page
  if (parts[0] !== 'exercise' && window._restTimer) {
    showFloatingTimer();
  }

  // Apply card stagger animation
  applyCardStagger();
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  route();
});
