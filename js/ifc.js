// IFC-Datei lesen und in 3D-Bauteile umwandeln
import * as THREE from 'three';
import * as WebIFC from 'web-ifc';
import { MATERIAL, kantenlinienHinzufuegen } from './darstellung.js?v=16';

// Bauteil-Arten, die die App unterscheidet
const ARTEN = {
  [WebIFC.IFCWALL]: 'wand',
  [WebIFC.IFCWALLSTANDARDCASE]: 'wand',
  [WebIFC.IFCWINDOW]: 'fenster',
  [WebIFC.IFCDOOR]: 'tuer',
  [WebIFC.IFCCOLUMN]: 'stuetze',
  [WebIFC.IFCCOLUMNSTANDARDCASE]: 'stuetze',
  [WebIFC.IFCROOF]: 'dach',
  [WebIFC.IFCSITE]: 'gelaende',
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
  const anzahl = { wand: 0, fenster: 0, tuer: 0, stuetze: 0, dach: 0, gelaende: 0, rest: 0 };
  const waende = new Map(); // expressID → Bauteil, für die Eigenschaft „IsExternal“

  try {
    const dachTeile = dachTeileFinden(api, modellID);
    const teilVon = schichtenFinden(api, modellID);
    const bauteile = new Map(); // expressID → Bauteil (Schichten landen im Bauteil, zu dem sie gehören)
    api.StreamAllMeshes(modellID, (ifcTeil) => {
      // Schicht einer Wand (ArchiCAD „Komplexe Elemente aufteilen“): gehört zur Wand
      const id = teilVon.get(ifcTeil.expressID) ?? ifcTeil.expressID;
      let bauteil = bauteile.get(id);
      if (!bauteil) {
        const art = dachTeile.has(id) ? 'dach' : ARTEN[api.GetLineType(modellID, id)] ?? 'rest';
        anzahl[art]++;
        // Ein Bauteil kann aus mehreren Stücken bestehen
        bauteil = new THREE.Group();
        bauteil.userData = { expressID: id, art };
        if (art === 'wand') waende.set(id, bauteil);
        bauteile.set(id, bauteil);
        gruppe.add(bauteil);
      }
      const art = bauteil.userData.art;

      const stuecke = ifcTeil.geometries;
      for (let i = 0; i < stuecke.size(); i++) {
        const stueck = stuecke.get(i);
        const geo = api.GetGeometry(modellID, stueck.geometryExpressID);
        const punkte = api.GetVertexArray(geo.GetVertexData(), geo.GetVertexDataSize());
        const dreiecke = api.GetIndexArray(geo.GetIndexData(), geo.GetIndexDataSize());
        geo.delete();
        if (punkte.length === 0 || dreiecke.length === 0) continue; // leere Form (z. B. Wand, deren Form in den Schichten steckt)

        // web-ifc liefert pro Punkt 6 Zahlen: x, y, z und die Richtung der Fläche
        const verschraenkt = new THREE.InterleavedBuffer(punkte, 6);
        const geometrie = new THREE.BufferGeometry();
        geometrie.setAttribute('position', new THREE.InterleavedBufferAttribute(verschraenkt, 3, 0));
        geometrie.setAttribute('normal', new THREE.InterleavedBufferAttribute(verschraenkt, 3, 3));
        geometrie.setIndex(new THREE.BufferAttribute(dreiecke, 1));

        const netz = new THREE.Mesh(geometrie, MATERIAL[art]);
        netz.matrixAutoUpdate = false;
        netz.matrix.fromArray(stueck.flatTransformation);
        netz.userData.durchsichtig = stueck.color.w < 0.99; // Glas (für Glastüren bei den Kennwerten)
        if (art !== 'gelaende') kantenlinienHinzufuegen(netz); // Gelände ohne Linien, sonst zu unruhig
        bauteil.add(netz);
      }
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

// Dächer kommen in der IFC auf zwei Wegen vor:
// als Decke mit dem Typ „Dach“ (IfcSlab ROOF) oder als Decken, die zu einem Dach (IfcRoof) gehören.
function dachTeileFinden(api, modellID) {
  const dachTeile = new Set();
  const decken = api.GetLineIDsWithType(modellID, WebIFC.IFCSLAB);
  for (let i = 0; i < decken.size(); i++) {
    const decke = api.GetLine(modellID, decken.get(i));
    if (decke?.PredefinedType?.value === 'ROOF') dachTeile.add(decke.expressID);
  }
  const zugehoerig = api.GetLineIDsWithType(modellID, WebIFC.IFCRELAGGREGATES);
  for (let i = 0; i < zugehoerig.size(); i++) {
    const rel = api.GetLine(modellID, zugehoerig.get(i));
    const ganzes = rel.RelatingObject?.value;
    if (ganzes === undefined || api.GetLineType(modellID, ganzes) !== WebIFC.IFCROOF) continue;
    for (const teil of rel.RelatedObjects ?? []) dachTeile.add(teil.value);
  }
  return dachTeile;
}

// ArchiCAD kann mehrschichtige Wände beim Export in ihre Schichten zerlegen („Komplexe Elemente aufteilen“).
// Die Wand selbst hat dann keine Form, die steckt in den Schichten (IfcBuildingElementPart).
// Ergebnis: Schicht-Nummer → Nummer der Wand, zu der sie gehört.
function schichtenFinden(api, modellID) {
  const teilVon = new Map();
  const zugehoerig = api.GetLineIDsWithType(modellID, WebIFC.IFCRELAGGREGATES);
  for (let i = 0; i < zugehoerig.size(); i++) {
    const rel = api.GetLine(modellID, zugehoerig.get(i));
    const ganzes = rel.RelatingObject?.value;
    if (ganzes === undefined || ARTEN[api.GetLineType(modellID, ganzes)] !== 'wand') continue;
    for (const teil of rel.RelatedObjects ?? []) {
      if (api.GetLineType(modellID, teil.value) === WebIFC.IFCBUILDINGELEMENTPART) teilVon.set(teil.value, ganzes);
    }
  }
  return teilVon;
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
