const CACHE_NAME = 'child-scheduler-v3'; // 캐시 버전 업데이트
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // 아이콘 이미지 파일 (경로에 따라 수정 필요)
  '/icons/icon-192x192.png', 
  '/icons/icon-512x512.png',
  // Tailwind CSS 및 Chart.js CDN (앱이 로드될 때 캐시)
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  // Tone.js CDN (v14.8.49 버전을 정확히 캐시)
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js'
];

// 서비스 워커 설치: 캐시에 필요한 모든 애셋을 추가
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 서비스 워커 활성화: 이전 버전의 캐시를 정리
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 요청 가로채기: 캐시 우선 전략 사용
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에 요청된 리소스가 있다면 캐시된 버전을 반환
        if (response) {
          return response;
        }
        // 캐시에 없다면 네트워크에서 가져와서 캐시에 저장
        return fetch(event.request).then(
          response => {
            // 응답이 유효한지 확인
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // 응답을 복제하여 캐시에 저장하고, 원본 응답은 브라우저에 반환
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});
