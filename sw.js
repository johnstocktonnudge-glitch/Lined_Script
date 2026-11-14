/* Lined Script service worker: keeps the app working with no signal.
   Change CACHE (v1 -> v2) whenever the app files change so phones pick up the new version. */
var CACHE = 'lined-script-v57';
var FONTS = 'lined-script-fonts';
var CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'pdf.js', 'pdf.worker.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== FONTS; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin === location.origin && u.searchParams.has('nocache')) return;
  if (u.origin === location.origin) {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(r, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(r).then(function (res) { if (res && res.ok) c.put(r, res.clone()); return res; });
        if (hit) { net.catch(function () {}); return hit; }
        return net.catch(function () { return r.mode === 'navigate' ? c.match('index.html') : Response.error(); });
      });
    }));
    return;
  }
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(function (c) {
      return c.match(r).then(function (hit) {
        var net = fetch(r).then(function (res) { c.put(r, res.clone()); return res; }).catch(function () { return hit; });
        return hit || net;
      });
    }));
  }
});
