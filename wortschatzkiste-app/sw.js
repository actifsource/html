// Wortschatzkiste – speichert die App auf dem Handy, damit sie offline startet.
// Bei einer neuen Version die Zahl hochzählen, dann holt sich das Handy das Update.
const CACHE = "wortschatzkiste-v31";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).pathname.endsWith(".mp4")) return;   // Video nicht speichern, direkt aus dem Internet
  if(req.mode === "navigate"){
    // Seite: zuerst Internet (für Updates), sonst die gespeicherte Version
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // Standard-Gruppen: zuerst Internet (damit neue Gruppen ankommen), ohne Internet die gespeicherte Version
  if(new URL(req.url).pathname.endsWith("standard-gruppen.json")){
    const key = new URL("standard-gruppen.json", self.registration.scope).href;
    e.respondWith(fetch(req).then(r => { if(r.ok){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(key, copy)); } return r; })
      .catch(() => caches.match(key)));
    return;
  }
  // Alles andere (Symbole, Schrift): zuerst gespeicherte Version, sonst Internet und merken
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if(r.ok || r.type === "opaque"){ const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => hit)));
});
