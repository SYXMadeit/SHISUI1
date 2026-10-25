/* 石髓 SHISUI · Service Worker
   整体版本缓存：安装时把全部文件一次装进 "shisui-v<版本>"，运行时只从这一份缓存取，
   不会出现新 index.html 配旧 app.js 的混版本。发新版 = 改版本号 → 新 SW 装好新缓存后接管，下次打开生效。 */
const VERSION = '0.9.0';
const CACHE = 'shisui-v' + VERSION;
const ASSETS = ['./', './index.html', './css/style.css', './manifest.webmanifest',
  './js/marble.js', './js/dsp.worklet.js', './js/params.js', './js/random.js', './js/presets.js', './js/engine.js', './js/ui.js', './js/views.js', './js/guide.js', './js/code.js', './js/app.js',
  './fonts/silkscreen-400.woff2', './fonts/silkscreen-700.woff2', './fonts/qingke-huangyou-subset.woff2', './fonts/xiaowei-subset.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/icon-180.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return; const u = new URL(req.url); if (u.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true })).then((hit) => hit || fetch(req)));
});
