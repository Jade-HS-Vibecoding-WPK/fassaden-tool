// Umgebung aus OpenStreetMap (Sitzung 23): Nachbarhäuser als schlichte helle Klötze, Straßen und Grünflächen
// als Flächen auf einer runden „Modellplatte“. Gezeigt nur in der Perspektive (die Ansichten bleiben frei).
// Daten von der Overpass-API (OpenStreetMap). Es verlässt nur der Ort (Breite/Länge) und der Umkreis das Gerät.
// Jeder Ort wird nur einmal abgefragt, das Ergebnis bleibt bis zum Neuladen der Seite gemerkt.
import * as THREE from 'three';

export const UMKREIS = 150; // Meter um den Ort
// Overpass-Server (alle mit OpenStreetMap-Daten). Der Hauptserver ist oft ausgelastet („at capacity“),
// dann wird der nächste gefragt; nach einer Runde ohne Erfolg noch einmal nach kurzer Pause.
const SERVER = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const WARTEZEIT = 20000; // so lange (ms) darf ein Server höchstens brauchen

async function abfragen(abfrage) {
  let letzterFehler;
  for (let runde = 0; runde < 2; runde++) {
    if (runde > 0) await new Promise((weiter) => setTimeout(weiter, 3000));
    for (const adresse of SERVER) {
      const abbruch = new AbortController();
      const uhr = setTimeout(() => abbruch.abort(), WARTEZEIT);
      try {
        const antwort = await fetch(adresse, { method: 'POST', body: new URLSearchParams({ data: abfrage }), signal: abbruch.signal });
        if (!antwort.ok) throw new Error(`${adresse}: Antwort ${antwort.status}`);
        return await antwort.json();
      } catch (fehler) {
        letzterFehler = fehler;
      } finally {
        clearTimeout(uhr);
      }
    }
  }
  throw letzterFehler;
}
const GESCHOSS = 3; // Meter je Geschoss, wenn OSM nur die Geschosszahl kennt
const STANDARD_HOEHE = 6; // Meter, wenn OSM gar nichts zur Höhe weiß (zwei Geschosse)

const gemerkt = new Map(); // „Breite|Länge“ → Versprechen auf die OSM-Antwort

// Daten vom Server holen (einmal je Ort)
export function umgebungLaden(breite, laenge) {
  const schluessel = `${breite.toFixed(5)}|${laenge.toFixed(5)}`;
  if (!gemerkt.has(schluessel)) {
    const um = `(around:${UMKREIS},${breite.toFixed(6)},${laenge.toFixed(6)})`;
    const abfrage = `[out:json][timeout:25];(
      way["building"]${um};
      way["highway"]${um};
      way["landuse"~"^(grass|meadow|forest|recreation_ground|village_green|allotments|orchard|cemetery)$"]${um};
      way["leisure"~"^(park|garden|pitch|playground)$"]${um};
      way["natural"~"^(wood|grassland|scrub|heath|water)$"]${um};
      way["waterway"="riverbank"]${um};
    );out geom;`;
    const versprechen = abfragen(abfrage);
    versprechen.catch(() => gemerkt.delete(schluessel)); // bei Fehler später nochmal versuchen dürfen
    gemerkt.set(schluessel, versprechen);
  }
  return gemerkt.get(schluessel);
}

// Längen- und Breitengrad → Meter ab dem Ort (x = Osten, n = Norden)
function inMeter(punkt, breite, laenge) {
  return {
    x: (punkt.lon - laenge) * 111320 * Math.cos(THREE.MathUtils.degToRad(breite)),
    n: (punkt.lat - breite) * 110540,
  };
}

// Höhe eines Hauses aus den OSM-Angaben „height“ bzw. „building:levels“, sonst Standardwert
function hausHoehe(merkmale) {
  const hoehe = parseFloat(String(merkmale.height ?? '').replace(',', '.'));
  if (Number.isFinite(hoehe) && hoehe > 0) return Math.min(hoehe, 200);
  const geschosse = parseFloat(merkmale['building:levels']);
  if (Number.isFinite(geschosse) && geschosse > 0) return Math.min(geschosse, 60) * GESCHOSS + 1; // + Dach/Sockel
  if (['garage', 'garages', 'shed', 'carport', 'hut', 'kiosk'].includes(merkmale.building)) return 3;
  return STANDARD_HOEHE;
}

// Breite einer Straße in Metern (geschätzt nach Straßenart)
function strassenBreite(art) {
  if (['motorway', 'trunk', 'primary'].includes(art)) return 12;
  if (['secondary', 'tertiary'].includes(art)) return 9;
  if (['residential', 'unclassified', 'living_street', 'pedestrian', 'road'].includes(art)) return 6;
  if (art === 'service') return 4;
  return 2; // Fußweg, Radweg, Pfad, Treppe …
}

// Grünfläche oder Wasser?
function flaechenArt(m) {
  if (m.natural === 'water' || m.waterway === 'riverbank') return 'wasser';
  return 'gruen';
}

// Farben der Umgebung: zurückhaltend, damit das eigene Haus die Hauptsache bleibt
const FARBE = { platte: 0xeeede8, gruen: 0xd3dfc3, wasser: 0xc6d6e4, strasse: 0xdcdcd8, haus: 0xf2f1ee, kante: 0xb9bcc2 };

// Material für flache Flächen: leicht nach vorne geschoben, damit sie sich nicht mit der Platte streiten
function flaechenMaterial(farbe, stufe) {
  return new THREE.MeshLambertMaterial({ color: farbe, polygonOffset: true, polygonOffsetFactor: -stufe, polygonOffsetUnits: -stufe * 4 });
}

// Ein Umriss aus OSM (Liste von Punkten) als THREE.Shape in Metern; null, wenn er kein richtiger Umriss ist
function umriss(geometrie, breite, laenge) {
  if (!geometrie || geometrie.length < 4) return null;
  const punkte = geometrie.map((p) => inMeter(p, breite, laenge));
  const erster = punkte[0], letzter = punkte[punkte.length - 1];
  if (Math.hypot(erster.x - letzter.x, erster.n - letzter.n) < 0.01) punkte.pop(); // OSM wiederholt den ersten Punkt am Ende
  const form = new THREE.Shape(punkte.map((p) => new THREE.Vector2(p.x, p.n)));
  return { form, punkte };
}

// Liegt der Punkt (x, n) im Umriss?
function imUmriss(x, n, punkte) {
  let drin = false;
  for (let i = 0, j = punkte.length - 1; i < punkte.length; j = i++) {
    const a = punkte[i], b = punkte[j];
    if ((a.n > n) !== (b.n > n) && x < ((b.x - a.x) * (n - a.n)) / (b.n - a.n) + a.x) drin = !drin;
  }
  return drin;
}

/**
 * Baut die Umgebung als eine Gruppe. Ihr Ursprung ist der Ort, x = Osten, -z = Norden (wie in der Szene).
 * Jedes Nachbarhaus merkt sich seinen Umriss (userData.punkte), damit man es ausblenden kann,
 * wenn das eigene Haus darauf steht (s. hausFreistellen).
 */
export function umgebungBauen(daten, breite, laenge) {
  const gruppe = new THREE.Group();
  gruppe.name = 'Umgebung';
  // Flach liegende Formen: Shape (x, Norden) → Szene (x, -z); Extrusion zeigt nach oben
  const flach = (geometrie) => geometrie.rotateX(-Math.PI / 2);

  // Runde Modellplatte als Boden
  const platte = new THREE.Mesh(flach(new THREE.CircleGeometry(UMKREIS, 96)), flaechenMaterial(FARBE.platte, 0));
  platte.receiveShadow = true;
  gruppe.add(platte);

  const material = {
    gruen: flaechenMaterial(FARBE.gruen, 1),
    wasser: flaechenMaterial(FARBE.wasser, 1),
    strasse: flaechenMaterial(FARBE.strasse, 2),
    haus: new THREE.MeshLambertMaterial({ color: FARBE.haus }),
    kante: new THREE.LineBasicMaterial({ color: FARBE.kante }),
  };
  // Berührt das Teil die Platte? (Rechteck um alle Punkte schneidet den Kreis – reicht auch für lange Straßen
  // und große Flächen, deren Eckpunkte alle draußen liegen; den Rest schneidet der runde Rand ab)
  const imKreis = (punkte) => {
    const xs = punkte.map((p) => p.x), ns = punkte.map((p) => p.n);
    const dx = Math.max(Math.min(...xs), 0, -Math.max(...xs)); // Abstand der Mitte zum Rechteck, waagerecht
    const dn = Math.max(Math.min(...ns), 0, -Math.max(...ns));
    return Math.hypot(dx, dn) < UMKREIS;
  };

  for (const teil of daten.elements ?? []) {
    const m = teil.tags ?? {};
    if (m.building) {
      const u = umriss(teil.geometry, breite, laenge);
      if (!u || !imKreis(u.punkte)) continue;
      const hoehe = hausHoehe(m);
      const geometrie = flach(new THREE.ExtrudeGeometry(u.form, { depth: hoehe, bevelEnabled: false }));
      const haus = new THREE.Mesh(geometrie, material.haus);
      // Nachbarn werfen (noch) keinen Schatten: der Schattenbereich ist nur aufs eigene Haus eingestellt,
      // sonst kämen halbe, abgeschnittene Schatten heraus. Sie empfangen aber den Schatten des Hauses.
      haus.receiveShadow = true;
      haus.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometrie, 30), material.kante));
      haus.userData.punkte = u.punkte;
      haus.userData.nachbar = true;
      gruppe.add(haus);
    } else if (m.highway) {
      if (!teil.geometry || teil.geometry.length < 2 || m.area === 'yes') continue;
      const breiteStrasse = strassenBreite(m.highway);
      const punkte = teil.geometry.map((p) => inMeter(p, breite, laenge));
      if (!imKreis(punkte)) continue;
      gruppe.add(strasseBauen(punkte, breiteStrasse, material.strasse));
    } else {
      const u = umriss(teil.geometry, breite, laenge);
      if (!u || !imKreis(u.punkte)) continue;
      const flaeche = new THREE.Mesh(flach(new THREE.ShapeGeometry(u.form)), material[flaechenArt(m)]);
      flaeche.receiveShadow = true;
      gruppe.add(flaeche);
    }
  }
  // Alles, was über die Platte hinausragt, abschneiden (runder Rand wie bei einem Modell; lange Straßen
  // kommen sonst weit über den Umkreis hinaus). 32 senkrechte Schnittebenen rund um die Platte:
  // three.js schneidet weg, was außerhalb auch nur einer Ebene liegt – übrig bleibt das 32-Eck.
  const schnitt = [];
  for (let i = 0; i < 32; i++) {
    const w = (i / 32) * Math.PI * 2;
    schnitt.push(new THREE.Plane(new THREE.Vector3(-Math.cos(w), 0, -Math.sin(w)), UMKREIS));
  }
  for (const mat of Object.values(material)) mat.clippingPlanes = schnitt;
  gruppe.userData.schnitt = schnitt;
  return gruppe;
}

// Umgebung an eine Stelle der Szene legen (x/z = Lage des Orts in der Szene, y = Bodenhöhe).
// Die Schnittebenen gelten in der Szene, nicht in der Gruppe, deshalb wandern sie mit.
export function umgebungLegen(gruppe, x, y, z) {
  gruppe.position.set(x, y, z);
  const mitte = new THREE.Vector3(x, 0, z);
  for (const ebene of gruppe.userData.schnitt) ebene.constant = UMKREIS - ebene.normal.dot(mitte);
}

// Eine Straße als flaches Band: je Abschnitt ein Rechteck, an den Knicken ein Kreis (runde Ecken)
function strasseBauen(punkte, breite, material) {
  const teile = [];
  const halb = breite / 2;
  for (let i = 0; i < punkte.length - 1; i++) {
    const a = punkte[i], b = punkte[i + 1];
    const laenge = Math.hypot(b.x - a.x, b.n - a.n);
    if (laenge < 0.01) continue;
    const q = { x: (-(b.n - a.n) / laenge) * halb, n: ((b.x - a.x) / laenge) * halb }; // quer zur Straße
    teile.push(
      a.x + q.x, a.n + q.n, b.x + q.x, b.n + q.n, b.x - q.x, b.n - q.n,
      a.x + q.x, a.n + q.n, b.x - q.x, b.n - q.n, a.x - q.x, a.n - q.n,
    );
  }
  for (const p of punkte) { // runde Knicke und Enden
    const stuecke = 12;
    for (let k = 0; k < stuecke; k++) {
      const w1 = (k / stuecke) * Math.PI * 2, w2 = ((k + 1) / stuecke) * Math.PI * 2;
      teile.push(p.x, p.n, p.x + Math.cos(w1) * halb, p.n + Math.sin(w1) * halb, p.x + Math.cos(w2) * halb, p.n + Math.sin(w2) * halb);
    }
  }
  // Alle Dreiecke gegen den Uhrzeigersinn drehen (von oben gesehen), sonst sind sie von oben „Rückseite“ und zu dunkel
  for (let i = 0; i < teile.length; i += 6) {
    const kreuz = (teile[i + 2] - teile[i]) * (teile[i + 5] - teile[i + 1]) - (teile[i + 3] - teile[i + 1]) * (teile[i + 4] - teile[i]);
    if (kreuz < 0) {
      [teile[i + 2], teile[i + 4]] = [teile[i + 4], teile[i + 2]];
      [teile[i + 3], teile[i + 5]] = [teile[i + 5], teile[i + 3]];
    }
  }
  // (x, Norden) → Szene (x, 0, -Norden)
  const lage = new Float32Array((teile.length / 2) * 3);
  for (let i = 0, j = 0; i < teile.length; i += 2, j += 3) { lage[j] = teile[i]; lage[j + 1] = 0; lage[j + 2] = -teile[i + 1]; }
  const geometrie = new THREE.BufferGeometry();
  geometrie.setAttribute('position', new THREE.BufferAttribute(lage, 3));
  const oben = new Float32Array(lage.length);
  for (let i = 1; i < oben.length; i += 3) oben[i] = 1; // alle Flächen zeigen nach oben
  geometrie.setAttribute('normal', new THREE.BufferAttribute(oben, 3));
  const strasse = new THREE.Mesh(geometrie, material);
  strasse.receiveShadow = true;
  return strasse;
}

/**
 * Nachbarhäuser ausblenden, die dort stehen, wo das eigene Haus steht (oft das alte Gebäude auf dem Grundstück).
 * box = Grundriss des eigenen Hauses in Metern ab dem Ort { minX, maxX, minN, maxN }.
 */
export function hausFreistellen(gruppe, box) {
  const ecken = [[box.minX, box.minN], [box.maxX, box.minN], [box.maxX, box.maxN], [box.minX, box.maxN],
    [(box.minX + box.maxX) / 2, (box.minN + box.maxN) / 2]];
  for (const haus of gruppe.children) {
    if (!haus.userData.nachbar) continue;
    const punkte = haus.userData.punkte;
    const ueberlappt = punkte.some((p) => p.x > box.minX && p.x < box.maxX && p.n > box.minN && p.n < box.maxN)
      || ecken.some(([x, n]) => imUmriss(x, n, punkte));
    haus.visible = !ueberlappt;
  }
}
