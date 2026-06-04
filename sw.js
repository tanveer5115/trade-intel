const CACHE='trade-intel-v2';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);

  // Google Sheets: always network (live data)
  if(u.hostname.includes('docs.google.com')){
    e.respondWith(fetch(e.request).catch(()=>new Response('',{status:504})));
    return;
  }

  // App page (HTML): NETWORK-FIRST so updates show immediately; cache only as offline fallback
  if(e.request.mode==='navigate' || e.request.destination==='document'){
    e.respondWith(
      fetch(e.request).then(resp=>{
        const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));
        return resp;
      }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html')))
    );
    return;
  }

  // Other static assets (icons, manifest): cache-first
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
      if(resp.ok&&e.request.method==='GET'){const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});
