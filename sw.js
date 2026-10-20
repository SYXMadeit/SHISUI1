/* 石髓 SHISUI · Service Worker：装到手机后离线可用。先回缓存、后台更新，下次打开用新版。 */
const CACHE = 'shisui-v0.7.0';
const ASSETS = ['./', './index.html', './css/style.css', './manifest.webmanifest',
  './js/marble.js', './js/dsp.worklet.js', './js/params.js', './js/random.js', './js/presets.js', './js/engine.js', './js/ui.js', './js/views.js', './js/code.js', './js/app.js',
  './fonts/silkscreen-400.woff2', './fonts/silkscreen-700.woff2', './fonts/qingke-huangyou-subset.woff2', './fonts/xiaowei-subset.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/icon-180.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return; const u = new URL(req.url); if (u.origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => {
    const net = fetch(req).then((r) => { if (r && r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; }).catch(() => hit);
    return hit || net;
  }));
});
