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
const FARBE = {
  platte: 0xeeede8, gruen: 0xd3dfc3, wasser: 0xc6d6e4, strasse: 0xdcdcd8, haus: 0xf2f1ee, kante: 0xb9bcc2,
  // für die Vorlagen (Sitzung 23b): Gehweg, Wiese/Waldboden als Platte, Lichtung, Acker, Modellbäume
  gehweg: 0xe6e5e0, wiese: 0xe2e8d5, waldboden: 0xd5ddc6, lichtung: 0xe6eadb, acker: 0xe9e4d4,
  krone: 0xb5c89e, stamm: 0xa89c8c, // etwas kräftiger grün als die Wiese
};

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
  const { gruppe, material, flach } = grundplatte(FARBE.platte);

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
      nachbarHinzufuegen(gruppe, material, geometrie, u.punkte);
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
  randAbschneiden(gruppe, material);
  return gruppe;
}

// Runde Modellplatte als Boden und die gemeinsamen Materialien (OSM und Vorlagen sehen gleich aus)
function grundplatte(plattenFarbe) {
  const gruppe = new THREE.Group();
  gruppe.name = 'Umgebung';
  const material = {
    platte: flaechenMaterial(plattenFarbe, 0),
    gruen: flaechenMaterial(FARBE.gruen, 1),
    lichtung: flaechenMaterial(FARBE.lichtung, 1),
    acker: flaechenMaterial(FARBE.acker, 1),
    wasser: flaechenMaterial(FARBE.wasser, 1),
    strasse: flaechenMaterial(FARBE.strasse, 2),
    gehweg: flaechenMaterial(FARBE.gehweg, 2),
    fahrbahn: flaechenMaterial(FARBE.strasse, 3),
    haus: new THREE.MeshLambertMaterial({ color: FARBE.haus }),
    kante: new THREE.LineBasicMaterial({ color: FARBE.kante }),
    krone: new THREE.MeshLambertMaterial({ color: FARBE.krone }),
    stamm: new THREE.MeshLambertMaterial({ color: FARBE.stamm }),
  };
  // Flach liegende Formen: Shape (x, Norden) → Szene (x, -z); Extrusion zeigt nach oben
  const flach = (geometrie) => geometrie.rotateX(-Math.PI / 2);
  const platte = new THREE.Mesh(flach(new THREE.CircleGeometry(UMKREIS, 96)), material.platte);
  platte.receiveShadow = true;
  gruppe.add(platte);
  return { gruppe, material, flach };
}

// Ein Nachbarhaus in die Gruppe legen, mit Kantenlinien; es merkt sich seinen Umriss (fürs Freistellen)
function nachbarHinzufuegen(gruppe, material, geometrie, punkte, lage) {
  const haus = new THREE.Mesh(geometrie, material.haus);
  // Nachbarn werfen (noch) keinen Schatten: der Schattenbereich ist nur aufs eigene Haus eingestellt,
  // sonst kämen halbe, abgeschnittene Schatten heraus. Sie empfangen aber den Schatten des Hauses.
  haus.receiveShadow = true;
  if (lage) { haus.position.set(lage.x, 0, -lage.n); haus.rotation.y = lage.winkel; }
  haus.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometrie, 30), material.kante));
  haus.userData.punkte = punkte;
  haus.userData.nachbar = true;
  gruppe.add(haus);
}

// Alles, was über die Platte hinausragt, abschneiden (runder Rand wie bei einem Modell; lange Straßen
// kommen sonst weit über den Umkreis hinaus). 32 senkrechte Schnittebenen rund um die Platte:
// three.js schneidet weg, was außerhalb auch nur einer Ebene liegt – übrig bleibt das 32-Eck.
function randAbschneiden(gruppe, material) {
  const schnitt = [];
  for (let i = 0; i < 32; i++) {
    const w = (i / 32) * Math.PI * 2;
    schnitt.push(new THREE.Plane(new THREE.Vector3(-Math.cos(w), 0, -Math.sin(w)), UMKREIS));
  }
  for (const mat of Object.values(material)) mat.clippingPlanes = schnitt;
  gruppe.userData.schnitt = schnitt;
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
  // Bäume der Vorlagen (Sitzung 23h, seit das Haus sich verschieben lässt): wer mit der Krone
  // über dem Haus stünde, verschwindet; alle Bäume einer Wuchsform sind ein InstancedMesh
  for (const teil of gruppe.children) {
    const liste = teil.userData.baumListe;
    if (!liste) continue;
    const lagen = teil.instanceMatrix.array, ur = teil.userData.urLagen;
    liste.forEach((b, i) => {
      const abstand = Math.hypot(Math.max(box.minX - b.x, 0, b.x - box.maxX), Math.max(box.minN - b.n, 0, b.n - box.maxN));
      const weg = abstand < b.krone * 0.8 + 0.5;
      for (let k = i * 16; k < i * 16 + 16; k++) lagen[k] = weg ? 0 : ur[k]; // Nullmatrix = unsichtbar
    });
    teil.instanceMatrix.needsUpdate = true;
  }
}

// ---------- Umgebungs-Vorlagen (Sitzung 23b) ----------
// Erfundene Umgebungen, die die App selbst baut: kein Internet, sofort da, nichts verlässt das Gerät.
// Gleicher Stil wie die OSM-Umgebung (runde Platte, helle Klötze), dazu schlichte Modellbäume (Kugel auf Stamm).
// Feste Zufallszahlen: jede Vorlage sieht jedes Mal gleich aus. Ums eigene Haus bleibt immer Platz.

export const VORLAGEN = { staedtisch: 'Städtisch', laendlich: 'Ländlich', wald: 'Wald', wiese: 'Wiese' };

// Zufallszahlen 0…1, aber immer dieselbe Folge für dieselbe Saat (Verfahren „mulberry32“)
function zufallsfolge(saat) {
  let a = saat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Baut eine Vorlage als Gruppe (wie umgebungBauen, Ursprung = Mitte des eigenen Hauses).
 * art: Schlüssel aus VORLAGEN. haus = halbe Größe des eigenen Hauses in Metern { hx (Ost–West), hn (Nord–Süd) }.
 */
export function vorlageBauen(art, haus) {
  const plattenFarbe = { staedtisch: FARBE.platte, laendlich: FARBE.wiese, wald: FARBE.waldboden, wiese: FARBE.wiese }[art];
  const { gruppe, material, flach } = grundplatte(plattenFarbe);
  const zufall = zufallsfolge({ staedtisch: 11, laendlich: 23, wald: 37, wiese: 41 }[art] ?? 1);
  const von = (a, b) => a + zufall() * (b - a);
  const hx = Math.max(haus.hx, 3), hn = Math.max(haus.hn, 3);

  // Abstand eines Punkts zum Rechteck des eigenen Hauses (0 = drin)
  const abstandZumHaus = (x, n) => Math.hypot(Math.max(Math.abs(x) - hx, 0), Math.max(Math.abs(n) - hn, 0));
  // Überlappt ein Rechteck (Mitte, halbe Größen) das Haus samt Rand?
  const stoertHaus = (x, n, ax, an, rand) => Math.abs(x) < hx + rand + ax && Math.abs(n) < hn + rand + an;
  const aufPlatte = (x, n, rand = 0) => Math.hypot(x, n) < UMKREIS - rand;

  // Bäume: { x, n, hoehe, krone (halbe Kronenbreite), form, drehung } – am Ende alle auf einmal gezeichnet.
  // Wuchsform je Vorlage gemischt (s. BAUMFORMEN): im Wald eher oval/schlank, sonst bunt gemischt.
  const formenMix = { staedtisch: ['oval', 'oval', 'schlank', 'rund'], wald: ['oval', 'schlank', 'schlank', 'oval', 'locker'] }[art]
    ?? ['rund', 'rund', 'oval', 'locker', 'schlank'];
  const baeume = [];
  const baum = (x, n, hoehe, krone, form) => {
    if (!aufPlatte(x, n, 1)) return;
    form ??= formenMix[Math.floor(zufall() * formenMix.length)];
    baeume.push({ x, n, hoehe, krone, form, drehung: zufall() * Math.PI * 2 });
  };
  const haeuser = []; // Rechtecke der schon gesetzten Häuser, damit sich keine überschneiden
  // In der Stadt dürfen Häuser aneinanderstoßen (geschlossene Reihe), sonst mindestens 1 m Abstand
  const luecke = art === 'staedtisch' ? -0.05 : 1;
  const frei = (x, n, ax, an) => !haeuser.some((h) => Math.abs(h.x - x) < h.ax + ax + luecke && Math.abs(h.n - n) < h.an + an + luecke);

  // Haus setzen: Mitte (x, n), Länge l (bei winkel 0 Ost–West), Tiefe t, Traufhöhe h, Firsthöhe über der Traufe
  const hausSetzen = (x, n, l, t, h, first = 0, winkel = 0) => {
    const ax = Math.abs(Math.cos(winkel)) * l / 2 + Math.abs(Math.sin(winkel)) * t / 2; // halbe Größe Ost–West
    const an = Math.abs(Math.sin(winkel)) * l / 2 + Math.abs(Math.cos(winkel)) * t / 2; // halbe Größe Nord–Süd
    if (stoertHaus(x, n, ax, an, 4) || !aufPlatte(x, n, -8) || !frei(x, n, ax, an)) return false;
    haeuser.push({ x, n, ax, an });
    let geometrie;
    if (first > 0) { // Satteldach: Giebel-Umriss quer, entlang der Länge gezogen; der First läuft in Längsrichtung
      const giebel = new THREE.Shape([
        new THREE.Vector2(-t / 2, 0), new THREE.Vector2(t / 2, 0), new THREE.Vector2(t / 2, h),
        new THREE.Vector2(0, h + first), new THREE.Vector2(-t / 2, h),
      ]);
      geometrie = new THREE.ExtrudeGeometry(giebel, { depth: l, bevelEnabled: false }).rotateY(Math.PI / 2).translate(-l / 2, 0, 0);
    } else {
      geometrie = new THREE.BoxGeometry(l, h, t).translate(0, h / 2, 0);
    }
    // Umriss in Metern (x = Osten, n = Norden) für hausFreistellen
    const c = Math.cos(winkel), s = Math.sin(winkel);
    const punkte = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
      const lx = (a * l) / 2, lz = (b * t) / 2;
      return { x: x + lx * c + lz * s, n: n - (-lx * s + lz * c) };
    });
    nachbarHinzufuegen(gruppe, material, geometrie, punkte, { x, n, winkel });
    return true;
  };
  // Straße/Weg als Linie aus Punkten [x, n]
  const weg = (punkte, breite, mat = material.strasse) => gruppe.add(strasseBauen(punkte.map(([x, n]) => ({ x, n })), breite, mat));
  // Fläche als Vieleck aus Punkten [x, n]
  const flaeche = (punkte, mat) => {
    const form = new THREE.Shape(punkte.map(([x, n]) => new THREE.Vector2(x, n)));
    const f = new THREE.Mesh(flach(new THREE.ShapeGeometry(form)), mat);
    f.receiveShadow = true;
    gruppe.add(f);
  };
  const rechteck = (x1, n1, x2, n2, mat) => flaeche([[x1, n1], [x2, n1], [x2, n2], [x1, n2]], mat);
  const R = UMKREIS + 20; // so weit reichen Straßen (der runde Rand schneidet ab)

  if (art === 'staedtisch') {
    // Blockrand: Straßenraster mit Gehwegen, ringsum Häuser mit 3–5 Geschossen, innen grüne Höfe.
    // Das eigene Haus steht an der Südostecke eines Blocks, gegenüber (im Südosten) liegt ein kleiner Park –
    // so verdecken die hohen Nachbarn das Haus nicht, wenn man wie üblich von Südosten schaut.
    const abstandN = Math.max(74, 2 * hn + 44), abstandX = Math.max(86, 2 * hx + 50);
    const n0 = -(hn + 11), x0 = hx + 11;
    const linienN = [], linienX = [];
    for (let k = -3; k <= 3; k++) { linienN.push(n0 + k * abstandN); linienX.push(x0 + k * abstandX); }
    for (const n of linienN) { weg([[-R, n], [R, n]], 13, material.gehweg); weg([[-R, n], [R, n]], 7, material.fahrbahn); }
    for (const x of linienX) { weg([[x, -R], [x, R]], 13, material.gehweg); weg([[x, -R], [x, R]], 7, material.fahrbahn); }
    // Straßenbäume auf den Gehwegen der Ost–West-Straßen
    for (const n of linienN) {
      for (const seite of [-1, 1]) {
        for (let x = -R; x < R; x += 15) {
          const bn = n + seite * 5;
          if (linienX.some((lx) => Math.abs(lx - x) < 9) || abstandZumHaus(x, bn) < 5) continue;
          baum(x, bn, von(8, 11), von(2.2, 3));
        }
      }
    }
    const tiefe = 12; // Haustiefe
    for (let i = 0; i < linienX.length - 1; i++) {
      for (let j = 0; j < linienN.length - 1; j++) {
        const x1 = linienX[i] + 6.5, x2 = linienX[i + 1] - 6.5, n1 = linienN[j] + 6.5, n2 = linienN[j + 1] - 6.5;
        if (!aufPlatte(Math.max(Math.min(0, x2), x1), Math.max(Math.min(0, n2), n1), -5)) continue; // Block ganz außerhalb
        if (linienX[i] === x0 && linienN[j + 1] === n0) { // Park gegenüber dem Haus: Wiese, Wege über Kreuz, Bäume am Rand
          rechteck(x1, n1, x2, n2, material.gruen);
          weg([[x1, n1], [x2, n2]], 3, material.gehweg);
          weg([[x1, n2], [x2, n1]], 3, material.gehweg);
          for (let x = x1 + 4; x < x2 - 2; x += 11) { baum(x, n1 + 4, von(9, 13), von(2.8, 3.8)); baum(x, n2 - 4, von(9, 13), von(2.8, 3.8)); }
          for (let n = n1 + 15; n < n2 - 10; n += 11) { baum(x1 + 4, n, von(9, 13), von(2.8, 3.8)); baum(x2 - 4, n, von(9, 13), von(2.8, 3.8)); }
          continue;
        }
        rechteck(x1 + tiefe, n1 + tiefe, x2 - tiefe, n2 - tiefe, material.gruen); // Hof
        const reihe = (laenge, setzen) => { // Häuser nebeneinander entlang einer Blockseite
          for (let a = 0; a < laenge - 6;) {
            const b = Math.min(von(9, 17), laenge - a);
            const geschosse = 3 + Math.floor(von(0, 3));
            setzen(a + b / 2, b - 0.02, geschosse * 3 + 1);
            a += b;
          }
        };
        reihe(x2 - x1, (m, b, h) => hausSetzen(x1 + m, n1 + tiefe / 2, b, tiefe, h)); // Südseite
        reihe(x2 - x1, (m, b, h) => hausSetzen(x1 + m, n2 - tiefe / 2, b, tiefe, h)); // Nordseite
        reihe(n2 - n1 - 2 * tiefe, (m, b, h) => hausSetzen(x1 + tiefe / 2, n1 + tiefe + m, b, tiefe, h, 0, Math.PI / 2)); // West
        reihe(n2 - n1 - 2 * tiefe, (m, b, h) => hausSetzen(x2 - tiefe / 2, n1 + tiefe + m, b, tiefe, h, 0, Math.PI / 2)); // Ost
        for (let k = 0; k < 4; k++) { // ein paar Bäume im Hof
          const bx = von(x1 + tiefe + 4, x2 - tiefe - 4), bn = von(n1 + tiefe + 4, n2 - tiefe - 4);
          if (x2 - x1 > 2 * tiefe + 8 && n2 - n1 > 2 * tiefe + 8 && abstandZumHaus(bx, bn) > 6) baum(bx, bn, von(7, 12), von(2.5, 3.5));
        }
      }
    }
  } else if (art === 'laendlich') {
    // Dorfstraße mit leichtem Schwung südlich vom Haus, ein Feldweg nach Norden, wenige Einfamilienhäuser
    // (teils mit Satteldach, Wunsch der Nutzerin), Gärten mit Bäumen, Äcker und Baumgruppen.
    const nStrasse = -(hn + 15);
    const strasseN = (x) => nStrasse + 6 * Math.sin(x / 55) * Math.min(1, Math.abs(x) / 40);
    const strasse = [];
    for (let x = -R; x <= R; x += 5) strasse.push([x, strasseN(x)]);
    weg(strasse, 6);
    const wegX = hx + 24;
    const feldweg = [];
    for (let n = nStrasse; n <= R; n += 6) feldweg.push([wegX + 3 * Math.sin((n - nStrasse) / 30), n]);
    weg(feldweg, 3, material.gehweg);
    // Äcker weiter weg (beige)
    rechteck(wegX + 8, hn + 40, wegX + 120, hn + 140, material.acker);
    rechteck(-160, hn + 55, -hx - 30, hn + 150, material.acker);
    rechteck(-150, nStrasse - 150, -60, nStrasse - 60, material.acker);
    // Häuser an der Straße, beidseitig
    for (const seite of [1, -1]) {
      for (let x = -140 + von(0, 12); x < 140;) {
        const giebelstaendig = zufall() < 0.3; // Giebel zur Straße
        const l = von(10, 13.5), t = von(8.5, 10.5);
        const sattel = zufall() < 0.65;
        const h = sattel ? von(3.2, 4.2) : von(3.2, 6.5);
        const first = sattel ? von(3.2, 4.6) : 0;
        const winkel = giebelstaendig ? Math.PI / 2 : 0;
        const halbTief = giebelstaendig ? l / 2 : t / 2;
        const n = strasseN(x) + seite * (9 + halbTief + von(0, 5));
        const imWeg = Math.abs(x - wegX) < (giebelstaendig ? t : l) / 2 + 5;
        if (!imWeg && hausSetzen(x, n, l, t, h, first, winkel)) {
          for (let k = 0, anz = 1 + Math.floor(von(0, 3)); k < anz; k++) { // Gartenbäume hinter dem Haus
            const bx = x + von(-8, 8), bn = n + seite * (halbTief + von(5, 14));
            if (abstandZumHaus(bx, bn) > 6 && Math.abs(bx - wegX) > 4) baum(bx, bn, von(6, 10), von(2.2, 3.4));
          }
          if (zufall() < 0.35) hausSetzen(x + von(-4, 4), n + seite * (halbTief + 10), 6, 4, 2.6, 0); // Schuppen
        }
        x += von(28, 42);
      }
    }
    // Ein Hof mit großer Scheune (Satteldach) im Nordwesten
    hausSetzen(-hx - 70, hn + 30, 26, 15, 5, 5.5);
    hausSetzen(-hx - 52, hn + 52, 14, 10, 3.6, 4.2, Math.PI / 2);
    // Baumgruppen
    for (const [gx, gn] of [[-hx - 40, nStrasse - 45], [wegX + 45, hn + 20], [-hx - 95, hn + 95], [wegX + 70, nStrasse - 55], [10, hn + 110]]) {
      for (let k = 0; k < 8; k++) {
        const bx = gx + von(-12, 12), bn = gn + von(-12, 12);
        if (abstandZumHaus(bx, bn) > 15) baum(bx, bn, von(9, 15), von(2.8, 4.2));
      }
    }
  } else if (art === 'wald') {
    // Dichter Wald mit einer Lichtung ums Haus, die sich nach Südosten zu einer Waldwiese öffnet
    // (von dort schaut die Perspektive meist hin, sonst verdecken die Bäume das Haus), und einem Waldweg nach Süden.
    // Am Waldrand sind die Bäume niedriger.
    const lichtung = Math.max(hx, hn) + 18;
    const inWiese = (x, n) => { // Keil nach Südosten (±32°), wird nach außen breiter
      const winkel = Math.atan2(n, x) * 180 / Math.PI; // 0° = Osten, -90° = Süden
      return Math.abs(winkel + 45) < 32;
    };
    const kreis = [];
    for (let i = 0; i < 48; i++) {
      const w = (i / 48) * Math.PI * 2, r = lichtung + 4 + 2 * Math.sin(w * 5);
      kreis.push([Math.cos(w) * r, Math.sin(w) * r]);
    }
    flaeche(kreis, material.lichtung);
    const keil = [[0, 0]];
    for (let w = -77; w <= -13; w += 4) keil.push([Math.cos(w * Math.PI / 180) * R, Math.sin(w * Math.PI / 180) * R]);
    flaeche(keil, material.lichtung);
    const wegPunkt = (n) => 6 * Math.sin(n / 35);
    const waldweg = [];
    for (let n = 0; n >= -R; n -= 6) waldweg.push([wegPunkt(n), n]);
    weg(waldweg, 3.5, material.gehweg);
    const raster = 7;
    for (let x = -UMKREIS; x <= UMKREIS; x += raster) {
      for (let n = -UMKREIS; n <= UMKREIS; n += raster) {
        const bx = x + von(-2.8, 2.8), bn = n + von(-2.8, 2.8);
        const abstand = abstandZumHaus(bx, bn);
        if (abstand < lichtung + von(0, 6) || inWiese(bx, bn)) continue;
        if (bn < 0 && Math.abs(bx - wegPunkt(bn)) < 4.5) continue;
        const rand = Math.min(1, (abstand - lichtung) / 30); // 0 am Waldrand, 1 tief im Wald
        baum(bx, bn, von(7, 10) + rand * von(5, 10), von(2.4, 3.2) + rand * 0.8);
      }
    }
  } else if (art === 'wiese') {
    // Grüne Platte mit ein paar einzelnen Bäumen, einer kleinen Gruppe und einem Feldweg zum Haus
    const feldweg = [];
    for (let n = -hn - 2; n >= -R; n -= 6) feldweg.push([4 * Math.sin(n / 25), n]);
    weg(feldweg, 3, material.gehweg);
    for (let k = 0; k < 14;) {
      const w = von(0, Math.PI * 2), r = von(Math.max(hx, hn) + 20, UMKREIS - 10);
      const bx = Math.cos(w) * r, bn = Math.sin(w) * r;
      if (bn < 0 && Math.abs(bx) < 10) continue; // nicht auf den Weg
      baum(bx, bn, von(8, 14), von(3, 4.5));
      k++;
    }
    for (let k = 0; k < 7; k++) baum(-hx - 55 + von(-10, 10), hn + 45 + von(-10, 10), von(10, 15), von(3, 4.2));
  }

  // Alle Bäume auf einmal: je Wuchsform eine Krone und ein Stamm als InstancedMesh (eine Form, viele Lagen –
  // schnell, auch bei über tausend Bäumen). Jeder Baum ist um sich selbst gedreht, damit nicht alle gleich aussehen.
  const lage = new THREE.Matrix4(), q = new THREE.Quaternion(), oben = new THREE.Vector3(0, 1, 0);
  for (const [name, form] of Object.entries(baumformen())) {
    const liste = baeume.filter((b) => b.form === name);
    if (!liste.length) continue;
    const kronen = new THREE.InstancedMesh(form.krone, material.krone, liste.length);
    const staemme = new THREE.InstancedMesh(form.stamm, material.stamm, liste.length);
    liste.forEach((b, i) => {
      const breit = b.krone / form.breite; // Form ist 1 hoch und form.breite halb so breit
      lage.compose(new THREE.Vector3(b.x, 0, -b.n), q.setFromAxisAngle(oben, b.drehung), new THREE.Vector3(breit, b.hoehe, breit));
      kronen.setMatrixAt(i, lage);
      staemme.setMatrixAt(i, lage);
    });
    for (const teil of [kronen, staemme]) {
      teil.receiveShadow = true;
      teil.frustumCulled = false;
      teil.userData.baumListe = liste; // fürs Ausblenden unter dem Haus (hausFreistellen)
      teil.userData.urLagen = teil.instanceMatrix.array.slice();
      gruppe.add(teil);
    }
  }
  gruppe.userData.baeume = baeume.length;
  randAbschneiden(gruppe, material);
  return gruppe;
}

// ---------- Modellbäume (Sitzung 23b, nach Vorbild-Silhouetten der Nutzerin) ----------
// Vereinfacht, aber „baumig“: die Krone besteht aus mehreren unregelmäßigen, kantigen Laub-Ballen statt einer Kugel.
// Vier Wuchsformen: rund (breite Linde/Eiche), oval (aufrecht), schlank (schmal, spitz zulaufend),
// locker (lichte Krone mit sichtbaren Ästen). Jede Form ist 1 hoch; „breite“ = halbe Kronenbreite.

// Mehrere Geometrien zu einer zusammenfügen (alle ohne Index, Flächen kantig wie ein Modell)
function zusammenfuegen(teile) {
  const flach = teile.map((g) => (g.index ? g.toNonIndexed() : g));
  const anzahl = flach.reduce((summe, g) => summe + g.attributes.position.count, 0);
  const lage = new Float32Array(anzahl * 3);
  let stelle = 0;
  for (const g of flach) { lage.set(g.attributes.position.array, stelle); stelle += g.attributes.position.array.length; }
  const geometrie = new THREE.BufferGeometry();
  geometrie.setAttribute('position', new THREE.BufferAttribute(lage, 3));
  geometrie.computeVertexNormals();
  return geometrie;
}

// Ein Laub-Ballen: Ikosaeder, die Ecken zufällig (aber fest) etwas nach innen/außen gezogen → unregelmäßig
function ballen(x, y, z, r, saat) {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i);
    // gleiche Ecke → gleicher Wert (die Ecken kommen mehrfach vor, sonst entstünden Löcher)
    const h = Math.sin(Math.round(vx * 100) * 12.9898 + Math.round(vy * 100) * 78.233 + Math.round(vz * 100) * 37.719 + saat * 4.13) * 43758.5453;
    const f = 0.82 + 0.36 * (h - Math.floor(h));
    p.setXYZ(i, x + vx * r * f, y + vy * r * f, z + vz * r * f);
  }
  return g;
}

// Ast oder Stamm als dünner Zylinder von Punkt a nach b
function ast(a, b, dickeUnten, dickeOben) {
  const von = new THREE.Vector3(...a), bis = new THREE.Vector3(...b);
  const laenge = von.distanceTo(bis);
  const g = new THREE.CylinderGeometry(dickeOben, dickeUnten, laenge, 6).translate(0, laenge / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), bis.clone().sub(von).normalize()));
  return g.translate(von.x, von.y, von.z);
}

let gebauteBaumformen = null;
function baumformen() {
  if (gebauteBaumformen) return gebauteBaumformen;
  const form = (breite, stamm, ballenListe) => ({
    breite,
    stamm: zusammenfuegen(stamm),
    krone: zusammenfuegen(ballenListe.map(([x, y, z, r], i) => ballen(x, y, z, r, i + 1))),
  });
  // Ring aus Ballen um die Mitte (für runde Kronen)
  const ring = (anzahl, abstand, y, r, versatz = 0) => Array.from({ length: anzahl }, (_, i) => {
    const w = (i / anzahl) * Math.PI * 2 + versatz;
    return [Math.cos(w) * abstand, y + 0.04 * Math.sin(i * 2.3), Math.sin(w) * abstand, r * (0.9 + 0.2 * ((i * 7) % 3) / 2)];
  });
  gebauteBaumformen = {
    rund: form(0.5, [ast([0, 0, 0], [0, 0.45, 0], 0.055, 0.04), ast([0, 0.3, 0], [0.16, 0.46, 0.04], 0.025, 0.014)], [
      [0, 0.62, 0, 0.28], ...ring(7, 0.3, 0.5, 0.18), ...ring(6, 0.28, 0.66, 0.2, 0.4), ...ring(4, 0.15, 0.82, 0.17, 0.8),
      [0, 0.9, 0, 0.12],
    ]),
    oval: form(0.34, [ast([0, 0, 0], [0, 0.36, 0], 0.045, 0.032)], [
      [0, 0.44, 0, 0.21], [0, 0.63, 0, 0.24], [0, 0.82, 0, 0.18], [0, 0.94, 0, 0.08],
      ...ring(5, 0.16, 0.46, 0.15, 0.3), ...ring(4, 0.16, 0.7, 0.15, 1.1),
    ]),
    schlank: form(0.22, [ast([0, 0, 0], [0, 0.5, 0], 0.032, 0.02)], [
      [0, 0.5, 0, 0.17], [0, 0.65, 0, 0.16], [0, 0.79, 0, 0.12], [0, 0.91, 0, 0.08], [0, 0.98, 0, 0.04],
      ...ring(4, 0.09, 0.58, 0.11, 0.4),
    ]),
    locker: form(0.44, [
      ast([0, 0, 0], [0.02, 0.48, 0], 0.045, 0.028), ast([0.01, 0.36, 0], [-0.24, 0.64, 0.05], 0.022, 0.01),
      ast([0.01, 0.42, 0], [0.26, 0.6, -0.05], 0.02, 0.01), ast([0.02, 0.48, 0], [0.04, 0.8, 0.02], 0.02, 0.01),
    ], [
      [-0.22, 0.7, 0.05, 0.17], [0.25, 0.66, -0.05, 0.16], [0.03, 0.86, 0.02, 0.18], [0, 0.68, 0, 0.14],
      [0.08, 0.6, 0.2, 0.12], [-0.1, 0.62, -0.2, 0.12], [-0.33, 0.58, -0.05, 0.09], [0.15, 0.94, -0.06, 0.08],
      [-0.12, 0.84, 0.12, 0.13], [0.2, 0.8, 0.12, 0.12], [0.34, 0.58, 0.06, 0.08],
    ]),
  };
  return gebauteBaumformen;
}
