const CACHE_NAME = "time-pilot-v5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./pwa/",
  "./pwa/index.html",
  "./assets/app.css",
  "./assets/main.js",
  "./pwa-apple-touch-180.png",
  "./pwa-icon-192.png",
  "./pwa-icon-512.png",
  "./pwa-icon.svg",
  "./pwa-maskable-192.png",
  "./pwa-maskable-512.png",
  "./pwa-maskable.svg",
  "./screenshots/time-pilot-gameplay-achievement.png",
  "./screenshots/time-pilot-preroll-flyby.png",
  "./screenshots/time-pilot-root-menu.png",
];
const GAME_ASSETS = [
  "./fonts/font.ttf",
  "./music/level1.ogg",
  "./music/level2.ogg",
  "./music/level3.ogg",
  "./music/level4.ogg",
  "./music/level5.ogg",
  "./music/game_start.wav",
  "./music/main_menu.ogg",
  "./sprites/bonuses/parachute.png",
  "./sprites/enemies/basic/explosion.png",
  "./sprites/enemies/basic/level1.png",
  "./sprites/enemies/basic/level2.png",
  "./sprites/enemies/basic/level3.png",
  "./sprites/enemies/basic/level4.png",
  "./sprites/enemies/basic/level5.png",
  "./sprites/enemies/boss/explosion.png",
  "./sprites/enemies/boss/level1.png",
  "./sprites/enemies/boss/level2.png",
  "./sprites/enemies/boss/level3.png",
  "./sprites/enemies/boss/level4.png",
  "./sprites/enemies/boss/level5.png",
  "./sprites/enemies/projectiles/bomb.png",
  "./sprites/enemies/projectiles/bomb_explosion.png",
  "./sprites/enemies/projectiles/plasma.png",
  "./sprites/enemies/projectiles/plasma_explosion.png",
  "./sprites/enemies/projectiles/rocket.png",
  "./sprites/enemies/projectiles/rocket_explosion.png",
  "./sprites/enemies/special/explosion.png",
  "./sprites/enemies/special/level2.png",
  "./sprites/player/explosion.png",
  "./sprites/player/player.png",
  "./sprites/player/timewarp.png",
  "./sprites/props/asteroid1.png",
  "./sprites/props/asteroid2.png",
  "./sprites/props/asteroid3.png",
  "./sprites/props/cloud1.png",
  "./sprites/props/cloud2.png",
  "./sprites/props/cloud3.png",
  "./sounds/enemies/basic/bullet.wav",
  "./sounds/enemies/basic/explosion.wav",
  "./sounds/enemies/basic/rocket_explode.wav",
  "./sounds/enemies/basic/rocket_fly.wav",
  "./sounds/enemies/basic/rocket_launch.wav",
  "./sounds/enemies/basic/wave_start.wav",
  "./sounds/enemies/boss/boss1.wav",
  "./sounds/enemies/boss/boss2.wav",
  "./sounds/enemies/boss/boss3.wav",
  "./sounds/enemies/boss/boss4.wav",
  "./sounds/enemies/boss/explosion.wav",
  "./sounds/enemies/special/bomb.wav",
  "./sounds/enemies/special/explosion.wav",
  "./sounds/player/bullet.mp3",
  "./sounds/player/explosion.mp3",
  "./sounds/player/extra_life.wav",
  "./sounds/player/timewarp.wav",
  "./sounds/ui/coindrop.wav",
  "./sounds/ui/next_level.wav",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([...APP_SHELL, ...GAME_ASSETS]))
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

const cacheResponse = async (request, response) => {
  const url = new URL(request.url);

  if (
    !response ||
    response.status !== 200 ||
    response.type === "opaque" ||
    url.origin !== self.location.origin ||
    !["http:", "https:"].includes(url.protocol)
  ) {
    return response;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
};

const networkFirst = async (request) => {
  try {
    const response = await fetch(request);
    return cacheResponse(request, response);
  } catch {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw new Error(`No cached response available for ${request.url}`);
  }
};

const getLegacyEntryAssetFallback = async (request) => {
  const url = new URL(request.url);
  const fallbackPath = url.pathname.endsWith(".css")
    ? "./assets/app.css"
    : url.pathname.endsWith(".js")
      ? "./assets/main.js"
      : "";

  if (!fallbackPath || !/\/assets\/main-[^/]+\.(css|js)$/.test(url.pathname)) {
    return undefined;
  }

  const cachedResponse = await caches.match(fallbackPath);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    return await fetch(fallbackPath);
  } catch {
    return undefined;
  }
};

const networkFirstEntryAsset = async (request) => {
  const response = await networkFirst(request);

  if (response.ok) {
    return response;
  }

  return (await getLegacyEntryAssetFallback(request)) ?? response;
};

const getNavigationFallback = async (request) => {
  const url = new URL(request.url);
  const fallbackPath = url.pathname.includes("/pwa/")
    ? "./pwa/index.html"
    : "./index.html";

  return caches.match(request) ?? caches.match(fallbackPath) ?? caches.match("./");
};

const staleWhileRevalidate = async (request) => {
  const cachedResponse = await caches.match(request);
  const networkResponse = fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(() => undefined);

  const response = cachedResponse ?? (await networkResponse);

  if (response) {
    return response;
  }

  throw new Error(`No cached response available for ${request.url}`);
};

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      networkFirst(event.request).catch(async () => {
        const fallback = await getNavigationFallback(event.request);

        if (fallback) {
          return fallback;
        }

        throw new Error(`No offline page available for ${event.request.url}`);
      })
    );
    return;
  }

  if (["script", "style"].includes(event.request.destination)) {
    event.respondWith(networkFirstEntryAsset(event.request));
    return;
  }

  if (event.request.destination === "manifest") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});
