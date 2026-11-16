// Darstellung im Zeichenstil: Farben der Bauteile und dunkle Kantenlinien
import * as THREE from 'three';

// Flächenmaterial. polygonOffset schiebt die Fläche minimal nach hinten,
// damit die Kantenlinien davor sauber sichtbar bleiben.
function flaeche(farbe, extra = {}) {
  return new THREE.MeshLambertMaterial({
    color: farbe,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    ...extra,
  });
}

// Rohmodell hellgrau-weiß wie ein Arbeitsmodell, Dach ruhiges Dunkelgrau
export const MATERIAL = {
  rest: flaeche(0xeeeeec),
  wand: flaeche(0xeeeeec),
  wandHover: flaeche(0xc9d3e4),
  aussen: flaeche(0x5b7db3), // vorläufige Markierung, bis in Sitzung 5 die Materialien kommen
  aussenHover: flaeche(0x87a3cf),
  fenster: flaeche(0xa9b8c8, { transparent: true, opacity: 0.55, depthWrite: false }),
  tuer: flaeche(0xd6d6d3),
  dach: flaeche(0x5f6266),
  gelaende: flaeche(0xf1efea),
};

// Grau und leicht durchscheinend: gut sichtbar, aber nicht hart
const LINIE = new THREE.LineBasicMaterial({ color: 0x727272, transparent: true, opacity: 0.8 });

// Nur echte Kanten zeichnen: Flächen, die weniger als 30° gegeneinander geknickt sind,
// gelten als eine Fläche (sonst sähe man jedes Rechen-Dreieck)
const KNICKWINKEL = 30;

// Hängt an ein 3D-Netz dunkle Kantenlinien an
export function kantenlinienHinzufuegen(netz) {
  const linien = new THREE.LineSegments(new THREE.EdgesGeometry(netz.geometry, KNICKWINKEL), LINIE);
  linien.raycast = () => {}; // Linien sollen beim Anklicken nicht stören
  netz.add(linien);
}
