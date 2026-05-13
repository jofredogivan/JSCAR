const CACHE_NAME = 'japan-v5'; // Aumentamos a versão para forçar a atualização
const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Instalação e Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Abrindo cache e adicionando arquivos');
      return cache.addAll(urlsToCache);
    })
  );
});

// Intercepta as requisições para funcionar Offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Limpa caches antigos quando o app atualiza
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});
