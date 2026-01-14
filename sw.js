const CACHE_NAME = 'solo-leveling-v6-GLOBAL'; // Mudei o nome para forçar atualização

// Arquivos vitais
const PRE_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o novo Service Worker a assumir IMEDIATAMENTE
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE).catch(err => console.log("Cache error:", err));
    })
  );
});

self.addEventListener('activate', (event) => {
  // Limpa caches antigos (Mata a versão anterior)
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
            console.log("Deletando cache antigo:", key);
            return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim(); // Controla a página imediatamente
});

self.addEventListener('fetch', (event) => {
  // Estratégia: Network First (Tenta internet primeiro, se falhar, usa cache)
  // Isso garante que você sempre veja a versão mais nova se tiver internet.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});