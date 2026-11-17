// Darstellung „realistisch“ (Umschalter im 3D-Fenster, Sitzung 17):
// gleiche Bauteile, aber andere Materialien – feinere Texturen mit Relief, echtes Licht, Glas spiegelt den Himmel,
// heller Himmelsverlauf als Hintergrund, keine Kantenlinien.
// Gilt nur fürs Anschauen im 3D-Fenster. Bilder, Vergleich und PDF bleiben im Zeichenstil.
import * as THREE from 'three';
import { MATERIAL } from './darstellung.js?v=19';
import { realistischesFassadenMaterial } from './materialien.js?v=19e';

const HIMMEL_OBEN = new THREE.Color('#7fa8d4');
const HORIZONT = new THREE.Color('#eef3f8');
const BODEN = new THREE.Color('#8a8b80');

// Gegenstück eines Materials aus dem Zeichenstil, einmal je Material angelegt
const gegenstuecke = new WeakMap();
export function realistischesMaterial(original) {
  let echt = gegenstuecke.get(original);
  if (!echt) {
    echt = original.userData.materialID ? realistischesFassadenMaterial(original) : allgemein(original);
    gegenstuecke.set(original, echt);
  }
  return echt;
}

// Glas der Fenster (auch Pfosten-Riegel): dunkler, spiegelt kräftig
const GLAS = new THREE.MeshStandardMaterial({
  color: 0x4a5c6b, roughness: 0.04, metalness: 0.7, envMapIntensity: 1.5,
  transparent: true, opacity: 0.85, side: THREE.DoubleSide,
});
// Fensterrahmen, Pfosten/Riegel: Aluminium anthrazit, leicht glänzend
const PROFIL = { roughness: 0.45, metalness: 0.5 };

// Rohmodell, Dach, Türen …: gleiche Farbe, matte Oberfläche
function allgemein(original) {
  if (original === MATERIAL.fenster) return GLAS;
  const echt = new THREE.MeshStandardMaterial({
    color: original.color,
    emissive: original.emissive,
    emissiveIntensity: original.emissiveIntensity,
    map: original.map,
    side: original.side,
    transparent: original.transparent,
    opacity: original.opacity,
    depthWrite: original.depthWrite,
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.6,
    ...(original === MATERIAL.rahmen || original === MATERIAL.rahmenHover || original === MATERIAL.rahmenAuswahl ? PROFIL : {}),
    ...(original === MATERIAL.dach ? { roughness: 0.7, metalness: 0.2 } : {}),
  });
  // ausgewählte/überfahrene Fenster bleiben blau getönt, spiegeln aber etwas
  if ([MATERIAL.fensterHover, MATERIAL.fensterAuswahl].includes(original)) Object.assign(echt, { roughness: 0.1, metalness: 0.3 });
  return echt;
}

// Hintergrund: senkrechter Verlauf Hellblau → fast Weiß
export function himmelHintergrund() {
  const leinwand = document.createElement('canvas');
  leinwand.width = 2; leinwand.height = 256;
  const g = leinwand.getContext('2d');
  const verlauf = g.createLinearGradient(0, 0, 0, 256);
  verlauf.addColorStop(0, '#a9c6e6');
  verlauf.addColorStop(0.7, '#e6eef7');
  verlauf.addColorStop(1, '#f6f8fb');
  g.fillStyle = verlauf;
  g.fillRect(0, 0, 2, 256);
  const t = new THREE.CanvasTexture(leinwand);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Umgebung für Spiegelungen: Himmelskugel (oben blau, am Horizont hell, unten Boden), einmal vorberechnet
export function himmelUmgebung(renderer) {
  const kugel = new THREE.SphereGeometry(1, 64, 32);
  const farben = [];
  const lage = kugel.attributes.position;
  const f = new THREE.Color();
  for (let i = 0; i < lage.count; i++) {
    const y = lage.getY(i);
    if (y >= 0) f.copy(HORIZONT).lerp(HIMMEL_OBEN, Math.pow(y, 0.6));
    else f.copy(HORIZONT).lerp(BODEN, Math.min(1, -y * 6));
    farben.push(f.r, f.g, f.b);
  }
  kugel.setAttribute('color', new THREE.Float32BufferAttribute(farben, 3));
  const umgebung = new THREE.Scene();
  umgebung.add(new THREE.Mesh(kugel, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const textur = pmrem.fromScene(umgebung, 0.02).texture;
  pmrem.dispose();
  kugel.dispose();
  return textur;
}
