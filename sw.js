const CACHE_NAME = 'solo-system-v3';

// Lista de arquivos vitais
const PRE_CACHE = [
  './',
  './index.html',
  './manifest.json'
  // Removi o icon.png daqui propositalmente para evitar erros de nome.
  // Ele será cacheado automaticamente quando aparecer na tela.
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Tenta cachear, mas não para se der erro em um arquivo opcional
      return cache.addAll(PRE_CACHE).catch(err => console.log("Erro menor no cache:", err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  return self.clients.claim();
});

// Estratégia: Cache Primeiro, depois Rede (e salva o que vier da rede)
self.addEventListener('fetch', (event) => {
  // Ignora links externos complexos para focar no App
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Se a resposta for válida, salva no cache para a próxima vez
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se estiver offline e não tiver no cache (ex: tentou carregar algo novo)
        console.log("Offline e item não encontrado.");
      });
    })
  );
});
