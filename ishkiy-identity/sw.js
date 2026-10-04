// iSHKiY Identity: works offline once it has loaded once. The app shell is
// cached on install; fonts are cached the first time they're fetched. The AI
// proxy is never cached.
const CACHE = "identity-v6";
const SHELL = ["/", "/index.html", "/dist/app.js", "/manifest.json", "/icon.svg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png",
  ...["c01","c02","c03","c04","c05","c06","c07","c08","c09","c10","c11","c12","c13","c14","c15","c16","c17"].map((c) => `/audio/calm/${c}.mp3`),
  ...["b01","b02","b03","b04","b05","b06","b07","b08","g01","g02","g03","g04","g05","g06","n01","n02","n03","n04","n05","n06","n07","pc01","pc02","pc03","pc04","pc05","pc06","pc07","pf01","pf02","pf03","pf04","pf05","pf06","pf07","q01","q02","q03","q04","q05","q06","q07","r01","r02","r03","r04","r05","r06","r07","r08","y01","y02"].map((c) => `/audio/topup/${c}.mp3`)];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) return;
  // the app itself: network first so updates land, cache when offline
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then((r) => r || caches.match("/index.html"))));
    return;
  }
  // fonts: cache first
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })));
  }
});
