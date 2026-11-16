// Außenwände erkennen und markieren
import * as THREE from 'three';

// Farben zum Markieren (der eigentliche Zeichenstil kommt in Sitzung 4)
const MATERIAL = {
  innen: new THREE.MeshLambertMaterial({ color: 0xd9d9d9, side: THREE.DoubleSide }),
  innenHover: new THREE.MeshLambertMaterial({ color: 0xb9c6dc, side: THREE.DoubleSide }),
  aussen: new THREE.MeshLambertMaterial({ color: 0x2c4f8a, side: THREE.DoubleSide }),
  aussenHover: new THREE.MeshLambertMaterial({ color: 0x5579b5, side: THREE.DoubleSide }),
};

// Für jede Wand entscheiden, ob sie eine Außenwand ist (userData.aussenAuto).
// Zwei Prüfungen müssen zusammenpassen:
// 1. Die IFC-Eigenschaft „IsExternal“ sagt nicht „nein“ (viele Programme setzen sie bei allen Wänden auf „ja“).
// 2. Die Lage: Von der Wand aus waagerecht nach außen geschaut, kommt auf einer Seite keine andere Wand mehr.
export function aussenwaendeErkennen(gruppe) {
  gruppe.updateMatrixWorld(true);
  const waende = gruppe.children.filter((b) => b.userData.art === 'wand');
  const alleNetze = waende.flatMap((w) => w.children);
  const strahl = new THREE.Raycaster();
  strahl.far = 100; // Meter

  for (const wand of waende) {
    const lage = wandLage(wand);
    const istAmRand = lage && wandIstAmRand(wand, lage, alleNetze, strahl);
    wand.userData.aussenAuto = wand.userData.istExternIfc !== false && istAmRand;
    wand.userData.aussen = wand.userData.aussenAuto;
    wandFaerben(wand);
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
function wandIstAmRand(wand, lage, alleNetze, strahl) {
  const eigeneNetze = new Set(wand.children);
  let frei = 0, gesamt = 0;
  for (const anteilLaenge of [0.2, 0.5, 0.8]) {
    for (const anteilHoehe of [0.3, 0.6]) {
      const punkt = lage.mitte.clone().addScaledVector(lage.laengs, (anteilLaenge - 0.5) * lage.laenge);
      punkt.y = lage.yMin + anteilHoehe * (lage.yMax - lage.yMin);
      gesamt++;
      for (const seite of [1, -1]) {
        const richtung = lage.quer.clone().multiplyScalar(seite);
        strahl.set(punkt.clone().addScaledVector(richtung, lage.dicke / 2 + 0.02), richtung);
        const treffer = strahl.intersectObjects(alleNetze, false).filter((t) => !eigeneNetze.has(t.object));
        if (treffer.length === 0) { frei++; break; }
      }
    }
  }
  return frei >= gesamt / 2;
}

// Wand je nach Zustand einfärben (außen/innen, Maus darüber ja/nein)
export function wandFaerben(wand, hover = false) {
  const name = (wand.userData.aussen ? 'aussen' : 'innen') + (hover ? 'Hover' : '');
  for (const netz of wand.children) netz.material = MATERIAL[name];
}
