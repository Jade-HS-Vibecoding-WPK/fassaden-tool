// Außenwände erkennen, Himmelsrichtung bestimmen, einfärben
// und die Wände mit veränderten Fensteröffnungen als eigene „Scheiben“ neu bauen
import * as THREE from 'three';
import { MATERIAL, kantenlinienHinzufuegen } from './darstellung.js?v=15';
import { fassadenMaterial } from './materialien.js?v=15';

// Reihenfolge im Uhrzeigersinn, Norden = Plan-oben = -Z in der 3D-Szene
const RICHTUNGEN = ['N', 'O', 'S', 'W'];

// Mindestabstand eines vergrößerten Fensters zur Nachbaröffnung und zum Wandrand (Meter)
const ABSTAND = 0.1;

// Neu gezeichnete Fenster (ohne Sprossen): Rahmenbreite und -tiefe in Metern
const RAHMEN_BREITE = 0.06;
const RAHMEN_TIEFE = 0.07;

// Für jede Wand entscheiden, ob sie eine Außenwand ist (userData.aussenAuto).
// Zwei Prüfungen müssen zusammenpassen:
// 1. Die IFC-Eigenschaft „IsExternal“ sagt nicht „nein“ (viele Programme setzen sie bei allen Wänden auf „ja“).
// 2. Die Lage: Von der Wand aus waagerecht nach außen geschaut, kommt auf einer Seite keine andere Wand mehr.
// Außerdem bekommt jede Wand ihre Himmelsrichtung (userData.himmelsrichtung: N, O, S oder W)
// und Texturkoordinaten, damit die Fassadenmuster im echten Maßstab darauf liegen.
export function aussenwaendeErkennen(gruppe) {
  gruppe.updateMatrixWorld(true);
  const waende = gruppe.children.filter((b) => b.userData.art === 'wand');
  const alleNetze = waende.flatMap((w) => w.children);
  const strahl = new THREE.Raycaster();
  strahl.far = 100; // Meter

  const lagen = new Map(waende.map((w) => [w, wandLage(w)]));
  const gebaeudeMitte = new THREE.Vector3();
  let anzahlLagen = 0;
  for (const lage of lagen.values()) if (lage) { gebaeudeMitte.add(lage.mitte); anzahlLagen++; }
  if (anzahlLagen) gebaeudeMitte.divideScalar(anzahlLagen);

  for (const wand of waende) {
    const lage = lagen.get(wand);
    const pruefung = lage ? wandIstAmRand(wand, lage, alleNetze, strahl) : null;
    wand.userData.aussenAuto = wand.userData.istExternIfc !== false && !!pruefung?.amRand;
    wand.userData.aussen = wand.userData.aussenAuto;
    if (!lage) continue;
    wand.userData.lage = lage;
    wand.userData.umriss = umrissBestimmen(wand, lage);

    // Außenseite = die Seite, auf der öfter keine andere Wand kam.
    // Unentschieden: die Seite, die von der Gebäudemitte wegzeigt.
    let seite = pruefung.seite;
    if (seite === 0) seite = lage.mitte.clone().sub(gebaeudeMitte).dot(lage.quer) >= 0 ? 1 : -1;
    wand.userData.aussenSeite = seite;
    wand.userData.himmelsrichtung = himmelsrichtung(lage.quer.clone().multiplyScalar(seite));
    texturKoordinatenSetzen(wand.children, lage);
  }
  return waende;
}

// Alle Eckpunkte eines Bauteils in Weltkoordinaten (nur die Original-Netze aus der IFC)
function weltPunkte(bauteil) {
  const punkte = [];
  for (const netz of bauteil.children) {
    if (netz === bauteil.userData.scheibe) continue;
    const pos = netz.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      punkte.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(netz.matrixWorld));
    }
  }
  return punkte;
}

// Mitte, Längsrichtung, Dicke und Höhe einer Wand aus ihren Eckpunkten bestimmen
function wandLage(wand) {
  const punkte = weltPunkte(wand);
  if (punkte.length < 4) return null;

  let mx = 0, mz = 0, yMin = Infinity, yMax = -Infinity;
  for (const q of punkte) { mx += q.x; mz += q.z; yMin = Math.min(yMin, q.y); yMax = Math.max(yMax, q.y); }
  mx /= punkte.length; mz /= punkte.length;

  // Grundriss (x, z): Die großen Seitenflächen der Wand zeigen quer zur Wand.
  // Ihre Richtung (nach Fläche gewichtet) ist genauer als die Streuung der Punkte,
  // die bei vielen Fensterlöchern leicht schief liegt.
  const quer = seitenflaechenRichtung(wand) ?? streuungsRichtung(punkte, mx, mz);
  const laengs = new THREE.Vector3(quer.z, 0, -quer.x);

  // Ausdehnung entlang und quer zur Wand
  let lMin = Infinity, lMax = -Infinity, qMin = Infinity, qMax = -Infinity;
  for (const q of punkte) {
    const dx = q.x - mx, dz = q.z - mz;
    const l = dx * laengs.x + dz * laengs.z;
    const s = dx * quer.x + dz * quer.z;
    lMin = Math.min(lMin, l); lMax = Math.max(lMax, l);
    qMin = Math.min(qMin, s); qMax = Math.max(qMax, s);
  }
  const mitte = new THREE.Vector3(mx, 0, mz)
    .addScaledVector(laengs, (lMin + lMax) / 2)
    .addScaledVector(quer, (qMin + qMax) / 2);
  return { mitte, laengs, quer, laenge: lMax - lMin, dicke: qMax - qMin, yMin, yMax };
}

// Alle Dreiecke eines Bauteils in Weltkoordinaten (nur die Original-Netze aus der IFC).
// auswahl: welche Netze mitzählen (z. B. nur die durchsichtigen)
function weltDreiecke(bauteil, auswahl = () => true) {
  const dreiecke = [];
  for (const netz of bauteil.children) {
    if (netz === bauteil.userData.scheibe || !auswahl(netz)) continue;
    const pos = netz.geometry.attributes.position;
    const index = netz.geometry.index;
    const anzahl = index ? index.count : pos.count;
    const ecke = (i) => new THREE.Vector3().fromBufferAttribute(pos, index ? index.getX(i) : i).applyMatrix4(netz.matrixWorld);
    for (let i = 0; i + 2 < anzahl; i += 3) dreiecke.push([ecke(i), ecke(i + 1), ecke(i + 2)]);
  }
  return dreiecke;
}

// Flächeninhalt eines Dreiecks
function dreiecksflaeche([a, b, c]) {
  return new THREE.Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a)).length() / 2;
}

// Richtung quer zur Wand: die Richtung, in die die meiste senkrechte Fläche zeigt.
// Vorder- und Rückseite zeigen entgegengesetzt, deshalb zählen Winkel nur bis 180°.
// Kleine und schräge Flächen (Laibungen, Anschläge, Stirnseiten) stören so nicht.
function seitenflaechenRichtung(wand) {
  const flaechen = []; // [Winkel 0…180°, Fläche]
  const n = new THREE.Vector3();
  for (const [a, b, c] of weltDreiecke(wand)) {
    n.crossVectors(b.clone().sub(a), c.clone().sub(a));
    const flaeche = n.length() / 2;
    if (flaeche < 1e-9 || Math.abs(n.y) > 0.05 * 2 * flaeche) continue; // nur senkrechte Flächen
    const grad = ((THREE.MathUtils.radToDeg(Math.atan2(n.z, n.x)) % 180) + 180) % 180;
    flaechen.push([grad, flaeche]);
  }
  if (flaechen.length === 0) return null;

  // Welcher Winkel hat innerhalb von ±2° die meiste Fläche?
  const abstand = (x, y) => { const d = Math.abs(x - y) % 180; return Math.min(d, 180 - d); };
  let besterWinkel = 0, besteFlaeche = -1;
  for (const [grad] of flaechen) {
    let summe = 0;
    for (const [g, f] of flaechen) if (abstand(grad, g) <= 2) summe += f;
    if (summe > besteFlaeche) { besteFlaeche = summe; besterWinkel = grad; }
  }
  // Genauer Winkel: Mittelwert dieser Flächen (mit doppeltem Winkel, damit 179° und 1° zusammenpassen)
  let summeCos = 0, summeSin = 0;
  for (const [g, f] of flaechen) {
    if (abstand(besterWinkel, g) > 2) continue;
    const rad = THREE.MathUtils.degToRad(2 * g);
    summeCos += f * Math.cos(rad);
    summeSin += f * Math.sin(rad);
  }
  const winkel = 0.5 * Math.atan2(summeSin, summeCos);
  return new THREE.Vector3(Math.cos(winkel), 0, Math.sin(winkel));
}

// Ersatz: Richtung quer zur Wand aus der Streuung der Eckpunkte
function streuungsRichtung(punkte, mx, mz) {
  let sxx = 0, szz = 0, sxz = 0;
  for (const q of punkte) {
    const dx = q.x - mx, dz = q.z - mz;
    sxx += dx * dx; szz += dz * dz; sxz += dx * dz;
  }
  const winkel = 0.5 * Math.atan2(2 * sxz, sxx - szz); // Längsrichtung
  return new THREE.Vector3(-Math.sin(winkel), 0, Math.cos(winkel));
}

// Von mehreren Punkten der Wand nach beiden Seiten schauen.
// Ist an mindestens der Hälfte der Punkte eine Seite frei, liegt die Wand am Rand des Gebäudes.
// seite sagt, welche Seite öfter frei war (1 = in Richtung quer, -1 = entgegen, 0 = unentschieden).
function wandIstAmRand(wand, lage, alleNetze, strahl) {
  const eigeneNetze = new Set(wand.children);
  let frei = 0, gesamt = 0, freiPlus = 0, freiMinus = 0;
  for (const anteilLaenge of [0.2, 0.5, 0.8]) {
    for (const anteilHoehe of [0.3, 0.6]) {
      const punkt = lage.mitte.clone().addScaledVector(lage.laengs, (anteilLaenge - 0.5) * lage.laenge);
      punkt.y = lage.yMin + anteilHoehe * (lage.yMax - lage.yMin);
      gesamt++;
      let irgendeineFrei = false;
      for (const seite of [1, -1]) {
        const richtung = lage.quer.clone().multiplyScalar(seite);
        strahl.set(punkt.clone().addScaledVector(richtung, lage.dicke / 2 + 0.02), richtung);
        const treffer = strahl.intersectObjects(alleNetze, false).filter((t) => !eigeneNetze.has(t.object));
        if (treffer.length === 0) {
          irgendeineFrei = true;
          if (seite === 1) freiPlus++; else freiMinus++;
        }
      }
      if (irgendeineFrei) frei++;
    }
  }
  return { amRand: frei >= gesamt / 2, seite: Math.sign(freiPlus - freiMinus) };
}

// Waagerechte Richtung nach außen → nächstliegende Himmelsrichtung
function himmelsrichtung(nachAussen) {
  const grad = THREE.MathUtils.radToDeg(Math.atan2(nachAussen.x, -nachAussen.z)); // 0° = Nord, 90° = Ost
  return RICHTUNGEN[((Math.round(grad / 90) % 4) + 4) % 4];
}

// Um wie viel Grad ist das Gebäude im Plan gedreht? (−45° … +45°, im Uhrzeigersinn positiv)
// Jede Außenwand zeigt in eine Richtung; ihre Abweichung von N/O/S/W wird nach Wandfläche gewichtet gemittelt.
// Mit vierfachem Winkel, damit z. B. eine Nordwand bei −2° und eine Ostwand bei 88° zusammenpassen.
// Ergebnis 0, wenn es keine Außenwände gibt.
export function hauptrichtungBestimmen(waende) {
  let summeCos = 0, summeSin = 0;
  for (const wand of waende) {
    const lage = wand.userData.lage;
    if (!wand.userData.aussen || !lage) continue;
    const nachAussen = lage.quer.clone().multiplyScalar(wand.userData.aussenSeite);
    const grad = THREE.MathUtils.radToDeg(Math.atan2(nachAussen.x, -nachAussen.z));
    const flaeche = lage.laenge * (lage.yMax - lage.yMin);
    const rad = THREE.MathUtils.degToRad(4 * grad);
    summeCos += flaeche * Math.cos(rad);
    summeSin += flaeche * Math.sin(rad);
  }
  if (summeCos === 0 && summeSin === 0) return 0;
  return THREE.MathUtils.radToDeg(Math.atan2(summeSin, summeCos)) / 4;
}

// Texturkoordinaten in Metern: waagerecht entlang der Wand, senkrecht die Höhe.
// Stirnseiten und Oberkanten der Wand bekommen passende Koordinaten, damit das Muster dort nicht verzerrt.
function texturKoordinatenSetzen(netze, lage) {
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (const netz of netze) {
    const pos = netz.geometry.attributes.position;
    const nor = netz.geometry.attributes.normal;
    const normalenMatrix = new THREE.Matrix3().getNormalMatrix(netz.matrixWorld);
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i).applyMatrix4(netz.matrixWorld);
      n.fromBufferAttribute(nor, i).applyMatrix3(normalenMatrix).normalize();
      const stirnseite = Math.abs(n.dot(lage.laengs)) > 0.7;
      const oberkante = Math.abs(n.y) > 0.7;
      uv[2 * i] = stirnseite ? p.dot(lage.quer) : p.dot(lage.laengs);
      uv[2 * i + 1] = oberkante ? p.dot(lage.quer) : p.y;
    }
    netz.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  }
}

// Wand je nach Zustand einfärben: Außenwand mit dem Material ihrer Himmelsrichtung, sonst Rohmodell.
// materialJeRichtung: z. B. { N: 'klinker-rot', O: …, S: …, W: … }
// eigenesMaterial: Material nur für diese Wand (Schalter „Einzelne Wände“), sonst gilt das der Seite
export function wandFaerben(wand, materialJeRichtung, hover = false, eigenesMaterial = null) {
  const material = wand.userData.aussen
    ? fassadenMaterial(eigenesMaterial ?? materialJeRichtung[wand.userData.himmelsrichtung ?? 'S'], hover)
    : MATERIAL[hover ? 'wandHover' : 'wand'];
  for (const netz of wand.children) netz.material = material;
}

// ---------- Stützen ----------

// Alle Stützen des Modells; bekommen Texturkoordinaten in Metern, damit das Material im echten Maßstab sitzt.
// Seitenflächen: waagerecht entlang der Fläche, senkrecht die Höhe. Ober- und Unterseite: Draufsicht.
export function stuetzenVorbereiten(gruppe) {
  gruppe.updateMatrixWorld(true);
  const stuetzen = gruppe.children.filter((b) => b.userData.art === 'stuetze');
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (const stuetze of stuetzen) {
    for (const netz of stuetze.children) {
      const pos = netz.geometry.attributes.position;
      const nor = netz.geometry.attributes.normal;
      const normalenMatrix = new THREE.Matrix3().getNormalMatrix(netz.matrixWorld);
      const uv = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i).applyMatrix4(netz.matrixWorld);
        n.fromBufferAttribute(nor, i).applyMatrix3(normalenMatrix).normalize();
        const deckflaeche = Math.abs(n.y) > 0.7;
        // Richtung entlang der Seitenfläche: waagerecht und quer zur Flächenrichtung
        uv[2 * i] = deckflaeche ? p.x : (p.x * -n.z + p.z * n.x) / Math.hypot(n.x, n.z);
        uv[2 * i + 1] = deckflaeche ? p.z : p.y;
      }
      netz.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    }
  }
  return stuetzen;
}

// Stütze mit dem gewählten Material einfärben
export function stuetzeFaerben(stuetze, materialID) {
  const material = fassadenMaterial(materialID);
  for (const netz of stuetze.children) netz.material = material;
}

// ---------- Fenster und Wandscheiben ----------

// Punkt der Welt in Wand-Koordinaten: u entlang der Wand, v = Höhe, w quer dazu (0 = Wandmitte)
function inWand(lage, p) {
  const dx = p.x - lage.mitte.x, dz = p.z - lage.mitte.z;
  return { u: dx * lage.laengs.x + dz * lage.laengs.z, v: p.y, w: dx * lage.quer.x + dz * lage.quer.z };
}

// Wand-Koordinaten zurück in einen Punkt der Welt
function inWelt(lage, u, v, w = 0) {
  return lage.mitte.clone().addScaledVector(lage.laengs, u).addScaledVector(lage.quer, w).setY(v);
}

// Umriss der beiden Wandseiten (Ansicht von vorne, in u/v) als Vieleck.
// Nur für „regelmäßige“ Wände: Der größte Teil der Fläche liegt auf Vorder- oder Rückseite
// (2 cm Spielraum). Punkte dazwischen sind egal, z. B. Stufen und Anschläge in der Fensterlaibung.
// Gebogene oder L-förmige Wände liefern null und bleiben so, wie sie in der IFC sind.
function umrissBestimmen(wand, lage) {
  const halb = lage.dicke / 2;
  const genau = Math.min(0.02, lage.dicke / 4);
  const seite = (p) => {
    const w = inWand(lage, p).w;
    return Math.abs(w + halb) < genau ? -1 : Math.abs(w - halb) < genau ? 1 : 0;
  };
  const minus = [], plus = [];
  for (const p of weltPunkte(wand)) {
    const s = seite(p);
    if (s === 0) continue;
    const { u, v } = inWand(lage, p);
    (s < 0 ? minus : plus).push([u, v]);
  }
  let flaecheSeiten = 0, flaecheGesamt = 0;
  for (const dreieck of weltDreiecke(wand)) {
    const f = dreiecksflaeche(dreieck);
    flaecheGesamt += f;
    const s = seite(dreieck[0]);
    if (s !== 0 && seite(dreieck[1]) === s && seite(dreieck[2]) === s) flaecheSeiten += f;
  }
  if (flaecheSeiten < flaecheGesamt * 0.5 || minus.length < 3 || plus.length < 3) return null;

  // Beide Seiten können verschieden lang sein (schräg abgeschnittene Ecken), haben aber meist gleich viele Ecken.
  // Dann werden die Ecken einander zugeordnet, sonst bekommen beide Seiten denselben Umriss.
  let a = huelle(minus), b = huelle(plus);
  if (a.length < 3 || b.length < 3) return null;
  if (a.length !== b.length) {
    a = b = huelle([...minus, ...plus]);
  } else {
    let besterVersatz = 0, besteSumme = Infinity;
    for (let k = 0; k < b.length; k++) {
      let summe = 0;
      for (let i = 0; i < a.length; i++) {
        const q = b[(i + k) % b.length];
        summe += (a[i][0] - q[0]) ** 2 + (a[i][1] - q[1]) ** 2;
      }
      if (summe < besteSumme) { besteSumme = summe; besterVersatz = k; }
    }
    b = a.map((_, i) => b[(i + besterVersatz) % b.length]);
  }
  return { minus: a, plus: b };
}

// Konvexe Hülle (äußerer Umriss) einer Punktwolke, gegen den Uhrzeigersinn, ohne Punkte auf geraden Kanten
function huelle(punkte) {
  const p = punkte.map(([u, v]) => [Math.round(u * 1000) / 1000, Math.round(v * 1000) / 1000])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const kreuz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const unten = [], oben = [];
  for (const q of p) {
    while (unten.length >= 2 && kreuz(unten.at(-2), unten.at(-1), q) <= 1e-4) unten.pop();
    unten.push(q);
  }
  for (const q of [...p].reverse()) {
    while (oben.length >= 2 && kreuz(oben.at(-2), oben.at(-1), q) <= 1e-4) oben.pop();
    oben.push(q);
  }
  return unten.slice(0, -1).concat(oben.slice(0, -1));
}

// Liegt der Punkt mindestens „rand“ Meter innerhalb des Umrisses?
function imUmriss(umriss, u, v, rand) {
  for (let i = 0; i < umriss.length; i++) {
    const [au, av] = umriss[i];
    const [bu, bv] = umriss[(i + 1) % umriss.length];
    const laenge = Math.hypot(bu - au, bv - av);
    if (((bu - au) * (v - av) - (bv - av) * (u - au)) / laenge < rand) return false;
  }
  return true;
}

function rechteckImUmriss(umriss, r, rand) {
  return [umriss.minus, umriss.plus].every((seite) =>
    imUmriss(seite, r.u0, r.v0, rand) && imUmriss(seite, r.u1, r.v0, rand) &&
    imUmriss(seite, r.u0, r.v1, rand) && imUmriss(seite, r.u1, r.v1, rand));
}

// Fenster und Türen ihren Wänden zuordnen. Eine Öffnung kann in mehreren Wänden sitzen
// (z. B. bei mehrschaligen Wänden außen und innen). Je Wand merkt sie sich ihr Rechteck in Wand-Koordinaten.
export function oeffnungenZuordnen(gruppe, waende) {
  const oeffnungen = gruppe.children.filter((b) => b.userData.art === 'fenster' || b.userData.art === 'tuer');
  for (const wand of waende) wand.userData.oeffnungen = [];
  const mitte = new THREE.Vector3();
  for (const oe of oeffnungen) {
    oe.userData.rechteck = new Map();
    oe.userData.waende = [];
    const punkte = weltPunkte(oe);
    if (punkte.length === 0) continue;
    mitte.set(0, 0, 0);
    for (const p of punkte) mitte.add(p);
    mitte.divideScalar(punkte.length);

    for (const wand of waende) {
      const lage = wand.userData.lage;
      if (!lage || Math.hypot(mitte.x - lage.mitte.x, mitte.z - lage.mitte.z) > lage.laenge / 2 + 2) continue;
      const r = { u0: Infinity, u1: -Infinity, v0: Infinity, v1: -Infinity, w0: Infinity, w1: -Infinity };
      for (const p of punkte) {
        const { u, v, w } = inWand(lage, p);
        r.u0 = Math.min(r.u0, u); r.u1 = Math.max(r.u1, u);
        r.v0 = Math.min(r.v0, v); r.v1 = Math.max(r.v1, v);
        r.w0 = Math.min(r.w0, w); r.w1 = Math.max(r.w1, w);
      }
      const halb = lage.dicke / 2;
      const uMitte = (r.u0 + r.u1) / 2, vMitte = (r.v0 + r.v1) / 2;
      const steckt = r.w1 > -halb - 0.02 && r.w0 < halb + 0.02           // reicht in die Wand hinein
        && Math.abs(uMitte) < lage.laenge / 2 && vMitte > lage.yMin && vMitte < lage.yMax
        && r.u1 - r.u0 > r.w1 - r.w0;                                      // liegt längs zur Wand, nicht quer
      if (!steckt) continue;
      oe.userData.waende.push(wand);
      oe.userData.rechteck.set(wand, r);
      wand.userData.oeffnungen.push(oe);
    }
    if (oe.userData.art === 'tuer') oe.userData.glastuer = istGlastuer(oe);
  }
  return oeffnungen;
}

// Glastür = in der Ansicht ist mindestens die Hälfte der Türöffnung durchsichtig (Glas laut IFC).
// Glasfläche = durchsichtige Flächen auf die Wand projiziert, halbiert (Glas hat Vorder- und Rückseite).
function istGlastuer(oe) {
  const wand = oe.userData.waende[0];
  if (!wand) return false;
  const { quer } = wand.userData.lage;
  const r = oe.userData.rechteck.get(wand);
  const n = new THREE.Vector3();
  let glas = 0;
  for (const [a, b, c] of weltDreiecke(oe, (netz) => netz.userData.durchsichtig)) {
    n.crossVectors(b.clone().sub(a), c.clone().sub(a));
    glas += Math.abs(n.dot(quer)) / 2;
  }
  return glas / 2 >= 0.5 * (r.u1 - r.u0) * (r.v1 - r.v0);
}

// Fenster nach Himmelsrichtung vergrößern/verkleinern und die betroffenen Wände mit neuen Löchern bauen.
// groesseJeRichtung: z. B. { N: { breite: 100, hoehe: 100 }, … } in Prozent der Größe aus der IFC.
// Breite wächst von der Fenstermitte aus, der Sturz bleibt, die Brüstung wandert. 0 % = Fenster zu.
// Alle Fenster in Außenwänden werden neu gezeichnet (Rahmen + Glas, ohne Sprossen), auch bei 100 %.
// massJeFenster: Fenster-Nummer aus der IFC (expressID) → { breite, hoehe } in cm (Schalter „Einzelne Fenster“);
// ein eigenes Maß gilt vor dem Prozentwert der Seite.
export function fensterAnpassen(waende, oeffnungen, groesseJeRichtung, massJeFenster = new Map()) {
  const neu = new Map(); // Öffnung → { wand, r } oder null (= zu). Nicht enthalten = unverändert.
  for (const oe of oeffnungen) {
    einfachesFensterEntfernen(oe);
    oe.visible = true;
    oe.userData.himmelsrichtung = undefined;
    oe.userData.aktuell = undefined; // aktuelles Rechteck für die Kennwerte (null = zu)
    oe.userData.soll = undefined; // gewünschte Größe in Metern, bevor Wandrand und Nachbarn sie begrenzen
    if (oe.userData.art !== 'fenster') continue;

    // Maßgebend ist die Außenwand, in der das Fenster sitzt
    const wand = oe.userData.waende.find((w) => w.userData.aussen);
    if (!wand?.userData.umriss) continue;
    oe.userData.himmelsrichtung = wand.userData.himmelsrichtung;
    const r0 = oe.userData.rechteck.get(wand);
    const breite0 = r0.u1 - r0.u0, hoehe0 = r0.v1 - r0.v0;
    // Faktor gegenüber der Größe aus der IFC: aus dem eigenen Maß (cm) oder aus dem Prozentwert der Seite
    const eigenes = massJeFenster.get(oe.userData.expressID);
    const seite = groesseJeRichtung[wand.userData.himmelsrichtung];
    let faktorBreite = eigenes ? eigenes.breite / 100 / breite0 : seite.breite / 100;
    let faktorHoehe = eigenes ? eigenes.hoehe / 100 / hoehe0 : seite.hoehe / 100;
    // Weniger als 5 mm Unterschied zur IFC: unverändert lassen (Rundung auf ganze cm)
    if (Math.abs(faktorBreite - 1) * breite0 < 0.005) faktorBreite = 1;
    if (Math.abs(faktorHoehe - 1) * hoehe0 < 0.005) faktorHoehe = 1;
    oe.userData.soll = { breite: breite0 * faktorBreite, hoehe: hoehe0 * faktorHoehe };
    const r = faktorBreite === 1 && faktorHoehe === 1 ? r0 : neuesRechteck(oe, wand, faktorBreite, faktorHoehe);
    oe.userData.aktuell = r;
    if (r !== r0) neu.set(oe, r ? { wand, r } : null);
    if (r) einfachesFensterBauen(oe, wand, r);
    else oe.visible = false;
  }

  for (const wand of waende) {
    scheibeEntfernen(wand);
    const betroffen = wand.userData.umriss && wand.userData.oeffnungen?.some((oe) => neu.has(oe));
    if (!betroffen) continue;
    const loecher = [];
    for (const oe of wand.userData.oeffnungen) {
      let r = oe.userData.rechteck.get(wand);
      if (neu.has(oe)) {
        const n = neu.get(oe);
        if (!n) continue; // Fenster zu: kein Loch
        r = n.wand === wand ? n.r : umrechnen(n.r, n.wand.userData.lage, wand.userData.lage);
      }
      r = lochEinpassen(r, wand.userData.umriss);
      if (r) lochHinzufuegen(loecher, r);
    }
    scheibeBauen(wand, loecher);
  }
}

// Neue Größe eines Fensters in seiner Außenwand ausrechnen (Wand-Koordinaten).
// Beim Vergrößern bleiben 10 cm zum Wandrand und zu Nachbaröffnungen.
// Wachsen zwei Nachbarfenster, bekommt jedes die Hälfte der Lücke.
function neuesRechteck(oe, wand, faktorBreite, faktorHoehe) {
  if (faktorBreite === 0 || faktorHoehe === 0) return null;
  const { umriss } = wand.userData;
  const r0 = oe.userData.rechteck.get(wand);
  const uMitte = (r0.u0 + r0.u1) / 2;
  const breite0 = r0.u1 - r0.u0, hoehe0 = r0.v1 - r0.v0;
  const alleEcken = [...umriss.minus, ...umriss.plus];
  const uMin = Math.min(...alleEcken.map((e) => e[0])), uMax = Math.max(...alleEcken.map((e) => e[0]));
  const vMin = Math.min(...alleEcken.map((e) => e[1]));
  const nachbarn = wand.userData.oeffnungen.filter((n) => n !== oe).map((n) => ({ n, r: n.userData.rechteck.get(wand) }));
  const ueberlappt = (a0, a1, b0, b1) => a0 < b1 - 0.01 && b0 < a1 - 0.01;

  // Höhe: Sturz bleibt, Brüstung wandert – nicht tiefer als Wandunterkante bzw. Öffnung darunter
  let grenzeUnten = vMin + ABSTAND;
  for (const { r } of nachbarn) {
    if (ueberlappt(r.u0, r.u1, r0.u0, r0.u1) && r.v1 <= r0.v0 + 0.01) grenzeUnten = Math.max(grenzeUnten, r.v1 + ABSTAND);
  }
  let unten = Math.max(r0.v1 - hoehe0 * faktorHoehe, Math.min(grenzeUnten, r0.v0));

  // Breite: von der Mitte aus, links und rechts gleich viel
  let platz = Math.min(uMitte - (uMin + ABSTAND), uMax - ABSTAND - uMitte);
  for (const { n, r } of nachbarn) {
    if (!ueberlappt(r.v0, r.v1, unten, r0.v1)) continue;
    const luecke = r.u1 <= r0.u0 + 0.01 ? r0.u0 - r.u1 : r.u0 >= r0.u1 - 0.01 ? r.u0 - r0.u1 : null;
    if (luecke === null) continue;
    const zusatz = n.userData.art === 'fenster' ? (luecke - ABSTAND) / 2 : luecke - ABSTAND;
    platz = Math.min(platz, breite0 / 2 + zusatz);
  }
  let halb = Math.min(breite0 * faktorBreite / 2, Math.max(platz, breite0 / 2));

  // Giebel und schräge Wandkanten: so lange verkleinern, bis das Fenster mit Abstand in die Wand passt
  // (aber nie kleiner als in der IFC, wenn größer gewünscht war).
  // Sitzt das Fenster schon in der IFC näher am Rand (z. B. Sturz direkt unter der Decke), gilt dieser Abstand.
  let rand = ABSTAND;
  while (rand > -0.3 && !rechteckImUmriss(umriss, r0, rand)) rand -= 0.01;
  const rechteck = () => ({ u0: uMitte - halb, u1: uMitte + halb, v0: unten, v1: r0.v1 });
  for (let i = 0; i < 500 && !rechteckImUmriss(umriss, rechteck(), rand); i++) {
    const breiter = halb > breite0 / 2 + 0.005, hoeher = unten < r0.v0 - 0.005;
    if (!breiter && !hoeher) break;
    if (breiter) halb = Math.max(breite0 / 2, halb - 0.01);
    if (hoeher) unten = Math.min(r0.v0, unten + 0.01);
  }
  return rechteck();
}

// Rechteck aus den Koordinaten einer Wand in die einer anderen (parallelen) Wand umrechnen
function umrechnen(r, lageVon, lageNach) {
  const a = inWand(lageNach, inWelt(lageVon, r.u0, r.v0));
  const b = inWand(lageNach, inWelt(lageVon, r.u1, r.v1));
  return { u0: Math.min(a.u, b.u), u1: Math.max(a.u, b.u), v0: Math.min(a.v, b.v), v1: Math.max(a.v, b.v) };
}

// Loch so weit verkleinern, dass es ganz in der Wand liegt (5 mm Rand, damit die Wand ein Stück bleibt).
// Türen und raumhohe Fenster behalten so unten bzw. oben einen hauchdünnen Streifen.
function lochEinpassen(r, umriss) {
  r = { ...r };
  for (let i = 0; i < 200; i++) {
    if (rechteckImUmriss(umriss, r, 0.005)) return r.u1 - r.u0 > 0.02 && r.v1 - r.v0 > 0.02 ? r : null;
    r.u0 += 0.01; r.u1 -= 0.01; r.v0 += 0.01; r.v1 -= 0.01;
    if (r.u1 <= r.u0 || r.v1 <= r.v0) return null;
  }
  return null;
}

// Überlappende Löcher zu einem zusammenfassen (sonst kann die Wandfläche nicht berechnet werden)
function lochHinzufuegen(loecher, r) {
  for (let i = 0; i < loecher.length; i++) {
    const l = loecher[i];
    if (l.u0 < r.u1 && r.u0 < l.u1 && l.v0 < r.v1 && r.v0 < l.v1) {
      loecher.splice(i, 1);
      lochHinzufuegen(loecher, {
        u0: Math.min(l.u0, r.u0), u1: Math.max(l.u1, r.u1), v0: Math.min(l.v0, r.v0), v1: Math.max(l.v1, r.v1),
      });
      return;
    }
  }
  loecher.push(r);
}

// Fenster ohne Sprossen zeichnen: schmaler Rahmen und Glas im Rechteck r (Wand-Koordinaten).
// Es sitzt so tief in der Wand wie das Original-Fenster, das so lange ausgeblendet wird.
function einfachesFensterBauen(oe, wand, r) {
  const { lage } = wand.userData;
  const r0 = oe.userData.rechteck.get(wand);
  const halb = lage.dicke / 2;
  const tiefe = Math.min(RAHMEN_TIEFE, lage.dicke);
  const wMitte = THREE.MathUtils.clamp((r0.w0 + r0.w1) / 2, -halb + tiefe / 2, halb - tiefe / 2);

  // Eigene Gruppe in Wand-Koordinaten: x = entlang der Wand, y = Höhe, z = quer
  const fenster = new THREE.Group();
  fenster.matrixAutoUpdate = false;
  fenster.matrix.makeBasis(lage.laengs, new THREE.Vector3(0, 1, 0), lage.quer).setPosition(lage.mitte);

  const breite = r.u1 - r.u0, hoehe = r.v1 - r.v0;
  const uMitte = (r.u0 + r.u1) / 2, vMitte = (r.v0 + r.v1) / 2;
  const rahmen = Math.min(RAHMEN_BREITE, breite / 4, hoehe / 4);
  const teil = (geometrie, material, u, v) => {
    const netz = new THREE.Mesh(geometrie, material);
    netz.userData.rolle = material === MATERIAL.rahmen ? 'rahmen' : 'glas'; // für fensterFaerben()
    netz.position.set(u, v, wMitte);
    kantenlinienHinzufuegen(netz);
    fenster.add(netz);
  };
  teil(new THREE.BoxGeometry(breite, rahmen, tiefe), MATERIAL.rahmen, uMitte, r.v1 - rahmen / 2);  // oben
  teil(new THREE.BoxGeometry(breite, rahmen, tiefe), MATERIAL.rahmen, uMitte, r.v0 + rahmen / 2);  // unten
  teil(new THREE.BoxGeometry(rahmen, hoehe - 2 * rahmen, tiefe), MATERIAL.rahmen, r.u0 + rahmen / 2, vMitte); // links
  teil(new THREE.BoxGeometry(rahmen, hoehe - 2 * rahmen, tiefe), MATERIAL.rahmen, r.u1 - rahmen / 2, vMitte); // rechts
  teil(new THREE.PlaneGeometry(breite - 2 * rahmen, hoehe - 2 * rahmen), MATERIAL.fenster, uMitte, vMitte);  // Glas

  for (const netz of oe.children) netz.visible = false;
  oe.add(fenster);
  oe.userData.einfach = fenster;
}

// Neu gezeichnetes Fenster einfärben: zustand = 'auswahl' (ausgewählt, Schalter „Einzelne Fenster“),
// true (Maus darüber) oder false (normal)
export function fensterFaerben(oe, zustand = false) {
  const fenster = oe.userData.einfach;
  if (!fenster) return;
  const zusatz = zustand === 'auswahl' ? 'Auswahl' : zustand ? 'Hover' : '';
  for (const netz of fenster.children) {
    if (netz.userData.rolle) netz.material = MATERIAL[netz.userData.rolle === 'rahmen' ? `rahmen${zusatz}` : `fenster${zusatz}`];
  }
}

// Neu gezeichnetes Fenster entfernen und wieder das Original aus der IFC zeigen
function einfachesFensterEntfernen(oe) {
  const fenster = oe.userData.einfach;
  if (fenster) {
    oe.remove(fenster);
    fenster.traverse((teil) => teil.geometry?.dispose());
    oe.userData.einfach = null;
  }
  for (const netz of oe.children) netz.visible = true;
}

// Wand als eigene Scheibe neu bauen: beide Seitenflächen mit Löchern, Ränder und Laibungen.
// Die Original-Wand aus der IFC wird so lange ausgeblendet.
function scheibeBauen(wand, loecher) {
  const { lage, umriss } = wand.userData;
  const halb = lage.dicke / 2;
  const punkte = [];
  const dreieck = (a, b, c) => punkte.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  const viereck = (a, b, c, d) => { dreieck(a, b, c); dreieck(a, c, d); };

  // Beide Seitenflächen
  const lochPfade = loecher.map((r) => [
    new THREE.Vector2(r.u0, r.v0), new THREE.Vector2(r.u1, r.v0),
    new THREE.Vector2(r.u1, r.v1), new THREE.Vector2(r.u0, r.v1),
  ]);
  for (const [seite, w] of [[umriss.minus, -halb], [umriss.plus, halb]]) {
    const kontur = seite.map(([u, v]) => new THREE.Vector2(u, v));
    const alle = kontur.concat(...lochPfade);
    for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(kontur, lochPfade.map((p) => [...p]))) {
      dreieck(inWelt(lage, alle[a].x, alle[a].y, w), inWelt(lage, alle[b].x, alle[b].y, w), inWelt(lage, alle[c].x, alle[c].y, w));
    }
  }
  // Außenränder (Stirnseiten, Oberkante, Unterkante)
  const n = umriss.minus.length;
  for (let i = 0; i < n; i++) {
    const a = umriss.minus[i], b = umriss.minus[(i + 1) % n];
    const c = umriss.plus[(i + 1) % n], d = umriss.plus[i];
    viereck(inWelt(lage, a[0], a[1], -halb), inWelt(lage, b[0], b[1], -halb), inWelt(lage, c[0], c[1], halb), inWelt(lage, d[0], d[1], halb));
  }
  // Laibungen der Löcher
  for (const r of loecher) {
    const ecken = [[r.u0, r.v0], [r.u1, r.v0], [r.u1, r.v1], [r.u0, r.v1]];
    for (let i = 0; i < 4; i++) {
      const [au, av] = ecken[i], [bu, bv] = ecken[(i + 1) % 4];
      viereck(inWelt(lage, au, av, -halb), inWelt(lage, bu, bv, -halb), inWelt(lage, bu, bv, halb), inWelt(lage, au, av, halb));
    }
  }

  const geometrie = new THREE.BufferGeometry();
  geometrie.setAttribute('position', new THREE.BufferAttribute(new Float32Array(punkte), 3));
  geometrie.computeVertexNormals();
  const scheibe = new THREE.Mesh(geometrie, wand.children[0]?.material ?? MATERIAL.wand);
  texturKoordinatenSetzen([scheibe], lage);
  kantenlinienHinzufuegen(scheibe);
  for (const netz of wand.children) netz.visible = false;
  wand.add(scheibe);
  wand.userData.scheibe = scheibe;
}

// Nachgebaute Scheibe wieder entfernen und die Original-Wand aus der IFC zeigen
function scheibeEntfernen(wand) {
  const scheibe = wand.userData.scheibe;
  if (scheibe) {
    wand.remove(scheibe);
    scheibe.traverse((teil) => teil.geometry?.dispose());
    wand.userData.scheibe = null;
  }
  for (const netz of wand.children) netz.visible = true;
}


// ---------- Kennwerte ----------

// Fassadenfläche und Fensterfläche je Himmelsrichtung in m² (Rohbaumaße).
// Fassade = Außenseite der Außenwände, Öffnungen mitgezählt. Fenster = Fensteröffnungen und Glastüren,
// jede Öffnung nur einmal (in der Außenwand, in der sie sitzt), mit der aktuell eingestellten Größe.
export function kennwerteBerechnen(waende, oeffnungen) {
  const kennwerte = {};
  for (const richtung of RICHTUNGEN) kennwerte[richtung] = { fassade: 0, fenster: 0 };

  for (const wand of waende) {
    const richtung = wand.userData.himmelsrichtung;
    if (!wand.userData.aussen || !richtung) continue;
    const { lage, umriss, aussenSeite } = wand.userData;
    // Gebogene oder L-förmige Wände (ohne Umriss): Länge × Höhe als Näherung
    kennwerte[richtung].fassade += umriss
      ? vieleckFlaeche(aussenSeite < 0 ? umriss.minus : umriss.plus)
      : lage.laenge * (lage.yMax - lage.yMin);
  }

  for (const oe of oeffnungen) {
    const istFenster = oe.userData.art === 'fenster';
    if (!istFenster && !oe.userData.glastuer) continue;
    const wand = oe.userData.waende.find((w) => w.userData.aussen);
    const richtung = wand?.userData.himmelsrichtung;
    if (!richtung) continue;
    const r = istFenster && oe.userData.aktuell !== undefined ? oe.userData.aktuell : oe.userData.rechteck.get(wand);
    if (r) kennwerte[richtung].fenster += (r.u1 - r.u0) * (r.v1 - r.v0);
  }
  return kennwerte;
}

// Flächeninhalt eines Vielecks [[u, v], …] (Gaußsche Trapezformel)
function vieleckFlaeche(ecken) {
  let summe = 0;
  for (let i = 0; i < ecken.length; i++) {
    const [au, av] = ecken[i];
    const [bu, bv] = ecken[(i + 1) % ecken.length];
    summe += au * bv - bu * av;
  }
  return Math.abs(summe) / 2;
}
