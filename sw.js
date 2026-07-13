const STATIC_CACHE = 'Atheer-static-v6';
const API_CACHE = 'Atheer-api-v6';
const AUDIO_CACHE = 'Atheer-audio-v6';

// ===== الملفات الأساسية التي تعمل بدون إنترنت =====
const staticAssets = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './quran-uthmani.json'
];

// ===== تثبيت الـ Service Worker =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(staticAssets))
  );
  self.skipWaiting();
});

// ===== تفعيل وحذف الكاش القديم =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== STATIC_CACHE && key !== API_CACHE && key !== AUDIO_CACHE) {
            console.log('🧹 حذف الكاش القديم:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ===== دالة معالجة طلبات Range (لتوافق iOS) =====
async function returnRangeResponse(request, cachedResponse) {
  if (!cachedResponse || !cachedResponse.body) return cachedResponse;
  
  const arrayBuffer = await cachedResponse.arrayBuffer();
  const rangeHeader = request.headers.get('range');
  const match = rangeHeader?.match(/^bytes=(\d+)-(\d*)$/);
  
  if (match) {
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : arrayBuffer.byteLength - 1;
    
    const rangeBlob = new Blob([arrayBuffer.slice(start, end + 1)], { type: 'audio/mp3' });
    return new Response(rangeBlob, {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': 'audio/mp3',
        'Content-Range': `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
        'Content-Length': rangeBlob.size
      }
    });
  }
  return cachedResponse;
}

// ===== معالجة الطلبات =====
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ===== 1. واجهة برمجة التطبيقات (API): Network First =====
  if (url.hostname.includes('api.alquran.cloud')) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache, max-age=0' }
      }).then(response => {
        const clone = response.clone();
        caches.open(API_CACHE).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'غير متصل بالإنترنت' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // ===== 2. الصوتيات (MP3): Network First + دعم Range =====
  if (url.hostname.includes('mp3quran.net') && event.request.url.endsWith('.mp3')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(AUDIO_CACHE).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) {
          // دعم Range للأجهزة التي تطلبه (iOS)
          if (event.request.headers.get('range')) {
            return returnRangeResponse(event.request, cached);
          }
          return cached;
        }
        return new Response('الصوت غير متاح حالياً', { status: 503 });
      })
    );
    return;
  }

  // ===== 3. بقية الملفات (HTML, CSS, JS, JSON): Cache First =====
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('', { status: 404 });
      });
    })
  );
});