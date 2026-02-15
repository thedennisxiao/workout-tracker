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
    default:
      renderHome();
  }
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  route();
});
