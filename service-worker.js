const CACHE_NAME = 'japan-security-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/vistoria.html',
  '/dashboard.html',
  '/css/style.css',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Instalação: Salva os arquivos essenciais no cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos se você atualizar a versão
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Intercepta as requisições: Tenta carregar do cache, se não tiver, busca na rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
