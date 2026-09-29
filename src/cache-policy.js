export const CACHE_NAME='pocket-english-v1';
export const ASSETS=['./','index.html','manifest.webmanifest','assets/icon.svg','assets/icon-192.png','assets/icon-512.png','assets/apple-touch-icon.png','src/app.js','src/views.js','src/styles.css','src/content.js','src/learning.js','src/activities.js','src/storage.js','src/speech.js','src/offline.js','src/cache-policy.js'];
export const resourceURLs=base=>ASSETS.map(p=>new URL(p,base).href);
export async function installCache(caches,base){const cache=await caches.open(CACHE_NAME);await cache.addAll(resourceURLs(base));}
export async function activateCache(caches){for(const key of await caches.keys())if(key.startsWith('pocket-english-')&&key!==CACHE_NAME)await caches.delete(key);}
