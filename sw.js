const CACHE_NAME = 'workout-tracker-v4';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/data.js',
  './js/strength-standards.js',
  './js/storage.js',
  './js/components/set-table.js',
  './js/components/data-modal.js',
  './js/components/streak.js',
  './js/components/strength-score.js',
  './js/components/progress-chart.js',
  './js/views/home.js',
  './js/views/workout.js',
  './js/views/log-exercise.js',
  './js/views/history.js',
  './js/views/calendar.js',
  './js/views/progress.js',
  './js/views/settings.js',
  './js/views/template-builder.js',
  './manifest.json',
  './icons/icon-192.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
