const VERSION = 'ardy-shell-v1';
const shell = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache=await caches.open(VERSION);
    let assets=[];
    try {const response=await fetch('./offline-assets.json',{cache:'reload'});if(response.ok)assets=await response.json();}catch{}
    await cache.addAll([...shell,'./highlands.webp',...assets]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('ardy-shell-') && key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.pathname.includes('__ardy_private__')) return;
  if(url.origin !== self.location.origin) {
    if(url.hostname==='firebasestorage.googleapis.com' || url.hostname==='127.0.0.1' && url.port==='9199') {
      event.respondWith(fetch(event.request).catch(async()=>await (await caches.open('ardy-private-v1')).match(event.request) || Response.error()));
    }
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    if (event.request.mode === 'navigate') {
      try {
        const response = await fetch(event.request);
        if (response.ok) await cache.put('./index.html', response.clone());
        return response;
      } catch {
        return await cache.match('./index.html') || Response.error();
      }
    }
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok && ['script', 'style', 'font', 'image'].includes(event.request.destination)) await cache.put(event.request, response.clone());
      return response;
    } catch { return Response.error(); }
  })());
});
