const CACHE_NAME = 'asteroids-v1';
const BASE = '/asteroids-atari2600';

const PRECACHE = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/manifest.json`,
  `${BASE}/css/style.css`,
  `${BASE}/assets/sprite-data.json`,
  `${BASE}/assets/Atari%202600%20-%20Asteroids%20-%20Miscellaneous%20-%20Asteroids.png`,
  `${BASE}/assets/Atari%202600%20-%20Asteroids%20-%20Playable%20Characters%20-%20Spaceship.png`,
  `${BASE}/icons/icon.svg`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`,
  `${BASE}/dist/game.js`,
  `${BASE}/dist/asteroid.js`,
  `${BASE}/dist/audio.js`,
  `${BASE}/dist/bullet.js`,
  `${BASE}/dist/input.js`,
  `${BASE}/dist/interactions.js`,
  `${BASE}/dist/particle.js`,
  `${BASE}/dist/saucer.js`,
  `${BASE}/dist/ship.js`,
  `${BASE}/dist/sprites.js`,
  `${BASE}/dist/types.js`,
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
