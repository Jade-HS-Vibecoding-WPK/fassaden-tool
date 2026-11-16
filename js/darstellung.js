// Darstellung im Zeichenstil: Farben der Bauteile und dunkle Kantenlinien
import * as THREE from 'three';

// Flächenmaterial. polygonOffset schiebt die Fläche minimal nach hinten,
// damit die Kantenlinien davor sauber sichtbar bleiben.
export function flaeche(farbe, extra = {}) {
  return new THREE.MeshLambertMaterial({
    color: farbe,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    ...extra,
  });
}

// Rohmodell hellgrau-weiß wie ein Arbeitsmodell, Dach ruhiges Dunkelgrau.
// Die Außenwände bekommen ihre Fassadenmaterialien aus materialien.js.
export const MATERIAL = {
  rest: flaeche(0xeeeeec),
  wand: flaeche(0xeeeeec),
  wandHover: flaeche(0xc9d3e4),
  fenster: flaeche(0xa9b8c8, { transparent: true, opacity: 0.55, depthWrite: false }),
  rahmen: flaeche(0x5f6266), // neu gezeichnete Fensterrahmen, deckend im Grau des Dachs
  tuer: flaeche(0xd6d6d3),
  stuetze: flaeche(0xeeeeec), // bis das Material aus materialien.js gesetzt ist
  dach: flaeche(0x5f6266),
  gelaende: flaeche(0xf1efea),
};

// Grau, die Deckkraft kommt je Linie aus handgezeichnet() (mal kräftiger, mal blasser)
const LINIE = new THREE.LineBasicMaterial({ color: 0x727272, vertexColors: true, transparent: true });

// Nur echte Kanten zeichnen: Flächen, die weniger als 30° gegeneinander geknickt sind,
// gelten als eine Fläche (sonst sähe man jedes Rechen-Dreieck)
const KNICKWINKEL = 30;

// Hängt an ein 3D-Netz Kantenlinien im Skizzenstil an
export function kantenlinienHinzufuegen(netz) {
  const kanten = new THREE.EdgesGeometry(netz.geometry, KNICKWINKEL);
  const linien = new THREE.LineSegments(handgezeichnet(kanten), LINIE);
  kanten.dispose();
  linien.raycast = () => {}; // Linien sollen beim Anklicken nicht stören
  netz.add(linien);
}

// Macht aus exakten Kanten lockere Striche wie in einer Handskizze:
// Jede Linie steht an den Enden ein wenig über, und jede ist unterschiedlich kräftig,
// an einem Ende oft etwas blasser als am anderen.
function handgezeichnet(kanten) {
  const alt = kanten.attributes.position;
  const punkte = new Float32Array(alt.count * 3);
  const farben = new Float32Array(alt.count * 4);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), richtung = new THREE.Vector3();
  for (let i = 0; i < alt.count; i += 2) {
    a.fromBufferAttribute(alt, i);
    b.fromBufferAttribute(alt, i + 1);
    const laenge = a.distanceTo(b);
    // Zufallswerte aus der Lage der Linie: bei jedem Öffnen gleich
    const z1 = zufallAus(a.x + b.x, a.y + b.y, a.z + b.z);
    const z2 = zufallAus(a.x * 3.1, b.y * 1.7, a.z + b.x);
    const z3 = zufallAus(b.z * 2.3, a.y * 0.9, b.x - a.z);
    richtung.subVectors(b, a).normalize();
    const ueberstand = Math.min(0.15, laenge * 0.05); // höchstens 15 cm
    a.addScaledVector(richtung, -ueberstand * z2);
    b.addScaledVector(richtung, ueberstand * z3);
    a.toArray(punkte, i * 3);
    b.toArray(punkte, (i + 1) * 3);
    const kraft = 0.3 + 0.6 * z1;
    farben.set([1, 1, 1, kraft * (0.75 + 0.25 * z2)], i * 4);
    farben.set([1, 1, 1, kraft * (0.75 + 0.25 * z3)], (i + 1) * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(punkte, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(farben, 4));
  return geo;
}

// Zahl zwischen 0 und 1, die nur von den drei Eingaben abhängt
function zufallAus(x, y, z) {
  const w = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return w - Math.floor(w);
}
