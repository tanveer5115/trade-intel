const CACHE='trade-intel-v1';
const ASSETS=['./','./index.html','./manifest.json'];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  // Google Sheets = always network (live data), never cache stale
  if(u.hostname.includes('docs.google.com')){
    e.respondWith(fetch(e.request).catch(()=>new Response('',{status:504})));
    return;
  }
  // app shell = cache-first, fall back to network
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
      if(resp.ok&&e.request.method==='GET'){
        const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));
      }
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});
