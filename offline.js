// Offline-Speicher (Sitzung 24, „Service Worker“): macht das Fassaden-Tool installierbar und startbar ohne Internet.
// Läuft im Hintergrund des Browsers und merkt sich jede Datei, die die App einmal geladen hat.
//  - Eigene Dateien (index.html, style.css, js/ …): immer zuerst frisch aus dem Netz holen, nur ohne Internet
//    die gemerkte Fassung nehmen. So sieht man nach Änderungen nie eine alte Fassung.
//  - Bibliotheken vom CDN (three.js, web-ifc, jsPDF): haben feste Versionsnummern, ändern sich nie →
//    gleich aus dem Speicher nehmen (schneller).
//  - OpenStreetMap (Ortssuche, Umgebung): nicht anfassen, das braucht ohnehin Internet.
// Nach Änderungen an DIESER Datei die Nummer erhöhen, dann räumt der Browser den alten Speicher auf.
const SPEICHER = 'fassaden-tool-1';

// Gleich beim Installieren holen, damit IFC lesen und PDF auch offline klappen, ohne dass man es vorher benutzt hat
const BIBLIOTHEKEN = [
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/web-ifc@0.0.57/web-ifc-api.js',
  'https://cdn.jsdelivr.net/npm/web-ifc@0.0.57/web-ifc.wasm',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
];
const EIGENE = [
  './',
  'schriften/SourceSans3-Light.ttf',
  'schriften/SourceSans3-Semibold.ttf',
  'symbole/symbol-192.png',
];

self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil((async () => {
    const speicher = await caches.open(SPEICHER);
    // einzeln, damit eine fehlende Datei nicht alles abbricht
    await Promise.all([...BIBLIOTHEKEN, ...EIGENE].map(async (adresse) => {
      try {
        const antwort = await fetch(adresse, { mode: 'cors' });
        if (antwort.ok) await speicher.put(adresse, antwort);
      } catch { /* ohne Internet: kommt beim nächsten Mal */ }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name !== SPEICHER) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET') return;
  const adresse = new URL(anfrage.url);
  if (adresse.origin === self.location.origin) {
    ereignis.respondWith(zuerstNetz(anfrage));
  } else if (adresse.hostname === 'cdn.jsdelivr.net') {
    ereignis.respondWith(zuerstSpeicher(anfrage));
  }
  // alles andere (OpenStreetMap) geht ganz normal ins Netz
});

async function zuerstNetz(anfrage) {
  const speicher = await caches.open(SPEICHER);
  try {
    const antwort = await fetch(anfrage);
    if (antwort.ok) speicher.put(anfrage, antwort.clone());
    return antwort;
  } catch (fehler) {
    // offline: gemerkte Fassung; beim Start ohne Netz notfalls auch mit anderer ?v=-Nummer
    const gemerkt = await speicher.match(anfrage) ?? await speicher.match(anfrage, { ignoreSearch: true })
      ?? (anfrage.mode === 'navigate' ? await speicher.match('./') : undefined);
    if (gemerkt) return gemerkt;
    throw fehler;
  }
}

async function zuerstSpeicher(anfrage) {
  const speicher = await caches.open(SPEICHER);
  const gemerkt = await speicher.match(anfrage.url);
  if (gemerkt) return gemerkt;
  const antwort = await fetch(anfrage);
  if (antwort.ok || antwort.type === 'opaque') speicher.put(anfrage.url, antwort.clone());
  return antwort;
}
