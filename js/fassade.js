// Außenwände erkennen, Himmelsrichtung bestimmen und einfärben
import * as THREE from 'three';
import { MATERIAL } from './darstellung.js';
import { fassadenMaterial } from './materialien.js';

// Reihenfolge im Uhrzeigersinn, Norden = Plan-oben = -Z in der 3D-Szene
const RICHTUNGEN = ['N', 'O', 'S', 'W'];

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

    // Außenseite = die Seite, auf der öfter keine andere Wand kam.
    // Unentschieden: die Seite, die von der Gebäudemitte wegzeigt.
    let seite = pruefung.seite;
    if (seite === 0) seite = lage.mitte.clone().sub(gebaeudeMitte).dot(lage.quer) >= 0 ? 1 : -1;
    wand.userData.himmelsrichtung = himmelsrichtung(lage.quer.clone().multiplyScalar(seite));
    texturKoordinatenSetzen(wand, lage);
  }
  return waende;
}

// Mitte, Längsrichtung, Dicke und Höhe einer Wand aus ihren Eckpunkten bestimmen
function wandLage(wand) {
  const punkte = [];
  const p = new THREE.Vector3();
  for (const netz of wand.children) {
    const pos = netz.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      punkte.push(p.fromBufferAttribute(pos, i).applyMatrix4(netz.matrixWorld).clone());
    }
  }
  if (punkte.length < 4) return null;

  // Grundriss (x, z): Hauptrichtung über die Streuung der Punkte
  let mx = 0, mz = 0, yMin = Infinity, yMax = -Infinity;
  for (const q of punkte) { mx += q.x; mz += q.z; yMin = Math.min(yMin, q.y); yMax = Math.max(yMax, q.y); }
  mx /= punkte.length; mz /= punkte.length;
  let sxx = 0, szz = 0, sxz = 0;
  for (const q of punkte) {
    const dx = q.x - mx, dz = q.z - mz;
    sxx += dx * dx; szz += dz * dz; sxz += dx * dz;
  }
  const winkel = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  const laengs = new THREE.Vector3(Math.cos(winkel), 0, Math.sin(winkel));
  const quer = new THREE.Vector3(-laengs.z, 0, laengs.x);

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

// Texturkoordinaten in Metern: waagerecht entlang der Wand, senkrecht die Höhe.
// Stirnseiten und Oberkanten der Wand bekommen passende Koordinaten, damit das Muster dort nicht verzerrt.
function texturKoordinatenSetzen(wand, lage) {
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (const netz of wand.children) {
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
export function wandFaerben(wand, materialJeRichtung, hover = false) {
  const material = wand.userData.aussen
    ? fassadenMaterial(materialJeRichtung[wand.userData.himmelsrichtung ?? 'S'], hover)
    : MATERIAL[hover ? 'wandHover' : 'wand'];
  for (const netz of wand.children) netz.material = material;
}
