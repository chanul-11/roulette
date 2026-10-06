// 처음 열 때 게임 파일을 전부 저장해 두고, 다음부터는 인터넷 없이도 열리게 한다.
// 인터넷이 되면 새 버전을 받아 저장하고, 안 되면 저장해 둔 걸 쓴다(룰렛 앱과 같은 방식).
const CACHE = 'party-games-v10';
const SHELL = ['./', 'index.html', 'ladder.html', 'pinball.html', 'roulette.html',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

// 설치할 때는 브라우저 캐시를 건너뛰고 서버에서 새로 받는다(GitHub Pages가 10분 캐시를 걸어서,
// 그냥 받으면 방금 올린 버전 대신 옛 파일이 저장될 수 있다).
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('party-games-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // 우리 파일은 매번 서버에 새 버전이 있는지 확인한다. 페이지 이동 요청을 그대로 옵션과 함께 넘기면
  // 일부 브라우저가 거부해서, 주소로 새 요청을 만든다. 글꼴 같은 다른 사이트 파일은 원래 요청 그대로.
  const req = url.origin === self.location.origin
    ? new Request(url.href, { cache: 'no-cache', credentials: 'same-origin' })
    : e.request;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
