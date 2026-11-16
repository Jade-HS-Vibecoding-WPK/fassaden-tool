// IFC-Datei lesen und in 3D-Bauteile umwandeln
import * as THREE from 'three';
import * as WebIFC from 'web-ifc';

// Bauteil-Arten, die die App unterscheidet
const ARTEN = {
  [WebIFC.IFCWALL]: 'wand',
  [WebIFC.IFCWALLSTANDARDCASE]: 'wand',
  [WebIFC.IFCWINDOW]: 'fenster',
  [WebIFC.IFCDOOR]: 'tuer',
};

// Vorläufige Farben (die eigentliche Darstellung kommt später)
const FARBEN = {
  wand: 0xd9d9d9,
  fenster: 0x9aa7b8,
  tuer: 0xb5b5b5,
  rest: 0xeeeeee,
};

let ifcApi = null;

// web-ifc nur einmal starten (lädt ein kleines Rechenprogramm aus dem Internet)
async function ifcStarten() {
  if (ifcApi) return ifcApi;
  ifcApi = new WebIFC.IfcAPI();
  ifcApi.SetWasmPath('https://cdn.jsdelivr.net/npm/web-ifc@0.0.57/', true);
  await ifcApi.Init();
  return ifcApi;
}

// Liest die Datei und liefert { gruppe, anzahl } zurück
export async function ifcLaden(datei) {
  const api = await ifcStarten();
  const daten = new Uint8Array(await datei.arrayBuffer());
  // COORDINATE_TO_ORIGIN: Modell an den Nullpunkt holen (sonst flackert es bei großen Koordinaten)
  const modellID = api.OpenModel(daten, { COORDINATE_TO_ORIGIN: true });
  if (modellID < 0) throw new Error('Die Datei konnte nicht als IFC gelesen werden.');

  const gruppe = new THREE.Group();
  const anzahl = { wand: 0, fenster: 0, tuer: 0, rest: 0 };
  const materialien = {};
  for (const [art, farbe] of Object.entries(FARBEN)) {
    materialien[art] = new THREE.MeshLambertMaterial({ color: farbe, side: THREE.DoubleSide });
  }

  const waende = new Map(); // expressID → Bauteil, für die Eigenschaft „IsExternal“

  try {
    api.StreamAllMeshes(modellID, (ifcTeil) => {
      const art = ARTEN[api.GetLineType(modellID, ifcTeil.expressID)] ?? 'rest';
      anzahl[art]++;

      // Ein Bauteil kann aus mehreren Stücken bestehen
      const bauteil = new THREE.Group();
      bauteil.userData = { expressID: ifcTeil.expressID, art };
      if (art === 'wand') waende.set(ifcTeil.expressID, bauteil);

      const stuecke = ifcTeil.geometries;
      for (let i = 0; i < stuecke.size(); i++) {
        const stueck = stuecke.get(i);
        const geo = api.GetGeometry(modellID, stueck.geometryExpressID);
        const punkte = api.GetVertexArray(geo.GetVertexData(), geo.GetVertexDataSize());
        const dreiecke = api.GetIndexArray(geo.GetIndexData(), geo.GetIndexDataSize());
        geo.delete();

        // web-ifc liefert pro Punkt 6 Zahlen: x, y, z und die Richtung der Fläche
        const verschraenkt = new THREE.InterleavedBuffer(punkte, 6);
        const geometrie = new THREE.BufferGeometry();
        geometrie.setAttribute('position', new THREE.InterleavedBufferAttribute(verschraenkt, 3, 0));
        geometrie.setAttribute('normal', new THREE.InterleavedBufferAttribute(verschraenkt, 3, 3));
        geometrie.setIndex(new THREE.BufferAttribute(dreiecke, 1));

        const netz = new THREE.Mesh(geometrie, materialien[art]);
        netz.matrixAutoUpdate = false;
        netz.matrix.fromArray(stueck.flatTransformation);
        bauteil.add(netz);
      }
      gruppe.add(bauteil);
    });
    istExternLesen(api, modellID, waende);
  } finally {
    api.CloseModel(modellID);
  }

  if (gruppe.children.length === 0) {
    throw new Error('In der Datei wurden keine 3D-Bauteile gefunden.');
  }
  return { gruppe, anzahl };
}

// Liest für jede Wand die Eigenschaft „IsExternal“ (Außenbauteil ja/nein) aus Pset_WallCommon.
// Ergebnis steht in bauteil.userData.istExternIfc: true, false oder undefined (nicht angegeben).
function istExternLesen(api, modellID, waende) {
  const psetWerte = new Map(); // gleiche Eigenschaftsgruppe nur einmal lesen
  const zuordnungen = api.GetLineIDsWithType(modellID, WebIFC.IFCRELDEFINESBYPROPERTIES);
  for (let i = 0; i < zuordnungen.size(); i++) {
    const zuordnung = api.GetLine(modellID, zuordnungen.get(i));
    const betroffen = (zuordnung.RelatedObjects ?? []).filter((o) => waende.has(o.value));
    if (betroffen.length === 0) continue;

    const psetID = zuordnung.RelatingPropertyDefinition?.value;
    if (!psetWerte.has(psetID)) psetWerte.set(psetID, istExternImPset(api, modellID, psetID));
    const wert = psetWerte.get(psetID);
    if (wert === undefined) continue;
    for (const o of betroffen) waende.get(o.value).userData.istExternIfc = wert;
  }
}

function istExternImPset(api, modellID, psetID) {
  const pset = api.GetLine(modellID, psetID);
  for (const verweis of pset?.HasProperties ?? []) {
    const eigenschaft = api.GetLine(modellID, verweis.value);
    if (eigenschaft?.Name?.value !== 'IsExternal') continue;
    const wert = eigenschaft.NominalValue?.value;
    return wert === true || wert === 'T' || wert === '.T.';
  }
  return undefined;
}
