// Bedienoberfläche: Datei wählen oder hineinziehen, Modell anzeigen, Fassade gestalten
import { Szene } from './szene.js?v=14';
import { ifcLaden } from './ifc.js';
import { aussenwaendeErkennen, wandFaerben, oeffnungenZuordnen, fensterAnpassen, stuetzenVorbereiten, stuetzeFaerben, kennwerteBerechnen, hauptrichtungBestimmen } from './fassade.js?v=14b';
import { MATERIALIEN, START_MATERIAL, musterBild } from './materialien.js?v=14b';
import { variantenLesen, varianteSpeichern, varianteLoeschen } from './varianten.js';
import { pdfErstellen, pdfDateiname } from './pdf.js?v=11';

const $ = (id) => document.getElementById(id);
const ansicht = $('ansicht');
const szene = new Szene(ansicht);

let waende = []; // alle Wände des geladenen Modells
let oeffnungen = []; // alle Fenster und Türen
let stuetzen = []; // alle Stützen
let modellKennung = null; // Dateiname + Anzahl Wände: zu welchem Modell eine Variante gehört
let modellName = ''; // Dateiname der IFC (steht im Kopf des PDF)

// Gewähltes Fassadenmaterial je Himmelsrichtung
const RICHTUNGSNAMEN = { N: 'Nord', O: 'Ost', S: 'Süd', W: 'West' };

// Feinere Himmelsrichtungen (16 Stück, je 22,5°) für die Beschriftung der Ansichten
const KOMPASS = [
  ['N', 'Nord'], ['NNO', 'Nordnordost'], ['NO', 'Nordost'], ['ONO', 'Ostnordost'],
  ['O', 'Ost'], ['OSO', 'Ostsüdost'], ['SO', 'Südost'], ['SSO', 'Südsüdost'],
  ['S', 'Süd'], ['SSW', 'Südsüdwest'], ['SW', 'Südwest'], ['WSW', 'Westsüdwest'],
  ['W', 'West'], ['WNW', 'Westnordwest'], ['NW', 'Nordwest'], ['NNW', 'Nordnordwest'],
];
const RICHTUNG_GRAD = { N: 0, O: 90, S: 180, W: 270 };
// Wohin zeigt die Fassade einer Seite wirklich? (drehung = Drehung des Gebäudes in Grad)
// Gibt null zurück, wenn es dieselbe Richtung ist wie der Name der Seite (Gebäude kaum gedreht).
function genaueRichtung(richtung, drehung = 0) {
  const stufe = ((Math.round((RICHTUNG_GRAD[richtung] + drehung) / 22.5) % 16) + 16) % 16;
  const [kurz, lang] = KOMPASS[stufe];
  return kurz === richtung ? null : { kurz, lang };
}
const materialJeRichtung = { N: START_MATERIAL, O: START_MATERIAL, S: START_MATERIAL, W: START_MATERIAL };

// Ein Material für alle Stützen, unabhängig von den Himmelsrichtungen
let materialStuetzen = 'sichtbeton';

// Fenstergröße je Himmelsrichtung in % der Größe aus der IFC
const fensterJeRichtung = {};
for (const richtung of Object.keys(RICHTUNGSNAMEN)) fensterJeRichtung[richtung] = { breite: 100, hoehe: 100 };

// Schalter „Alle Seiten gleich“ (Material und Fenster getrennt): ein Wert für alle Seiten,
// die Einstellung je Seite bleibt im Hintergrund erhalten
let materialAlleGleich = false;
let materialAlle = null; // wird beim ersten Einschalten mit dem Material der Nordseite belegt
let fensterAlleGleich = false;
let fensterAlle = null; // wird beim ersten Einschalten mit den Werten der Nordseite belegt

// Das Material, das gerade wirklich je Seite gilt
function geltendeMaterialien() {
  if (!materialAlleGleich) return materialJeRichtung;
  return { N: materialAlle, O: materialAlle, S: materialAlle, W: materialAlle };
}

// Die Fenstergröße, die gerade wirklich je Seite gilt
function geltendeFenster() {
  if (!fensterAlleGleich) return fensterJeRichtung;
  return { N: fensterAlle, O: fensterAlle, S: fensterAlle, W: fensterAlle };
}

// Schalter „Einzelne Wände“: einzelnen Außenwänden ein eigenes Material geben
let einzelneWaende = false;
const materialJeWand = new Map(); // Wand-Nummer aus der IFC (expressID) → eigenes Material
const auswahl = new Set(); // gerade ausgewählte Wände (nur bei eingeschaltetem Schalter)

function allesFaerben() {
  const materialien = geltendeMaterialien();
  for (const wand of waende) {
    const schimmer = auswahl.has(wand) ? 'auswahl' : wand === szene.hoverBauteil;
    wandFaerben(wand, materialien, schimmer, materialJeWand.get(wand.userData.expressID));
  }
  for (const stuetze of stuetzen) stuetzeFaerben(stuetze, materialStuetzen);
}

// Fenster neu einpassen (z. B. nach Reglerbewegung oder wenn eine Wand umgeschaltet wurde)
function fensterAktualisieren() {
  fensterAnpassen(waende, oeffnungen, geltendeFenster());
  allesFaerben();
  fensterAnzeigen();
  kennwerteAnzeigen();
}

// Tabelle „Kennwerte“: Fassadenfläche, Fensterfläche und Fensterflächenanteil je Seite und gesamt
const quadratmeter = (wert) => wert.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
// Kennwerte je Seite (N/O/S/W) plus „gesamt“
function kennwerteMitGesamt() {
  const kennwerte = kennwerteBerechnen(waende, oeffnungen);
  kennwerte.gesamt = { fassade: 0, fenster: 0 };
  for (const richtung of Object.keys(RICHTUNGSNAMEN)) {
    kennwerte.gesamt.fassade += kennwerte[richtung].fassade;
    kennwerte.gesamt.fenster += kennwerte[richtung].fenster;
  }
  return kennwerte;
}

function kennwerteAnzeigen() {
  $('bereichKennwerte').hidden = waende.length === 0;
  const kennwerte = kennwerteMitGesamt();
  const zeilen = Object.entries(RICHTUNGSNAMEN).map(([richtung, name]) => [name, kennwerte[richtung]]);
  zeilen.push(['Gesamt', kennwerte.gesamt]);

  const tabelle = $('kennwerteTabelle');
  tabelle.replaceChildren();
  for (const [name, { fassade, fenster }] of zeilen) {
    const zeile = tabelle.insertRow();
    if (name === 'Gesamt') zeile.className = 'gesamt';
    const anteil = fassade > 0 ? `${Math.round((fenster / fassade) * 100)} %` : '–';
    for (const text of [name, quadratmeter(fassade), quadratmeter(fenster), anteil]) {
      zeile.insertCell().textContent = text;
    }
  }
}

// Wände anfahren (hervorheben) und anklicken:
// normal schaltet ein Klick außen ↔ innen um; mit Schalter „Einzelne Wände“ wählt er Außenwände aus
szene.istAnklickbar = (bauteil) => bauteil.userData.art === 'wand' && (!einzelneWaende || bauteil.userData.aussen);
szene.beiHover = () => allesFaerben();
szene.beiKlick = (wand, ereignis) => {
  if (einzelneWaende) {
    if (!ereignis.shiftKey) {
      // Einfacher Klick: nur diese Wand (Klick auf die einzige gewählte Wand oder ins Leere hebt die Auswahl auf)
      const nurDiese = wand && auswahl.size === 1 && auswahl.has(wand);
      auswahl.clear();
      if (wand && !nurDiese) auswahl.add(wand);
    } else if (wand) {
      // Umschalt + Klick: Wand dazunehmen oder wieder herausnehmen
      if (auswahl.has(wand)) auswahl.delete(wand);
      else auswahl.add(wand);
    }
    einzelwahlAnzeigen();
    allesFaerben();
    return;
  }
  if (!wand) return;
  wand.userData.aussen = !wand.userData.aussen;
  fensterAktualisieren();
  aussenwaendeAnzeigen();
};

$('erkennungZuruecksetzen').addEventListener('click', () => {
  for (const wand of waende) wand.userData.aussen = wand.userData.aussenAuto;
  fensterAktualisieren();
  aussenwaendeAnzeigen();
});

function aussenwaendeAnzeigen() {
  const aussen = waende.filter((w) => w.userData.aussen).length;
  $('aussenZaehler').textContent = `${aussen} von ${waende.length} Wänden sind Außenwände`;
  $('erkennungZuruecksetzen').hidden = waende.every((w) => w.userData.aussen === w.userData.aussenAuto);
  $('bereichAussenwaende').hidden = waende.length === 0;
  $('bereichFassade').hidden = waende.length === 0;

  // Anzahl der Außenwände je Himmelsrichtung und für „Alle“
  const wandText = (anzahl) => (anzahl === 1 ? '1 Wand' : `${anzahl} Wände`);
  for (const richtung of Object.keys(RICHTUNGSNAMEN)) {
    const anzahl = waende.filter((w) => w.userData.aussen && w.userData.himmelsrichtung === richtung).length;
    $(`anzahl${richtung}`).textContent = wandText(anzahl);
  }
  $('anzahlAlle').textContent = wandText(aussen);

  // Zeile „Stützen“ nur, wenn die IFC Stützen hat
  materialZeilen.Stuetzen.zeile.hidden = stuetzen.length === 0;
  $('anzahlStuetzen').textContent = stuetzen.length === 1 ? '1 Stütze' : `${stuetzen.length} Stützen`;
}

// Eine Zeile der Materialwahl: Name, Musterbild, Auswahlliste
// schluessel: N/O/S/W oder 'Alle'; lesen/schreiben: woher das Material kommt und wohin es geht
const materialZeilen = {};
function materialzeileAufbauen(schluessel, name, lesen, schreiben) {
  const zeile = document.createElement('label');
  zeile.className = schluessel === 'Stuetzen' ? 'materialzeile stuetzen' : 'materialzeile';

  const titel = document.createElement('span');
  titel.textContent = name;
  const anzahl = document.createElement('small');
  anzahl.id = `anzahl${schluessel}`;
  titel.append(anzahl);

  const muster = document.createElement('span');
  muster.className = 'muster';

  const liste = document.createElement('select');
  for (const m of MATERIALIEN) liste.add(new Option(m.name, m.id));

  // Liste und Musterbild auf den gespeicherten Wert setzen
  const anzeigen = () => {
    liste.value = lesen();
    muster.style.backgroundImage = `url(${musterBild(liste.value)})`;
  };
  liste.addEventListener('change', () => {
    schreiben(liste.value);
    anzeigen();
    allesFaerben();
    einzelwahlAnzeigen(); // Musterbild der Auswahl kann sich mitändern („wie die Seite“)
  });
  anzeigen();

  zeile.append(titel, muster, liste);
  $('materialwahl').append(zeile);
  materialZeilen[schluessel] = { zeile, anzeigen };
}

function materialwahlAufbauen() {
  materialzeileAufbauen('Alle', 'Alle', () => materialAlle ?? materialJeRichtung.N, (wert) => { materialAlle = wert; });
  for (const [richtung, name] of Object.entries(RICHTUNGSNAMEN)) {
    materialzeileAufbauen(richtung, name, () => materialJeRichtung[richtung], (wert) => { materialJeRichtung[richtung] = wert; });
  }
  materialzeileAufbauen('Stuetzen', 'Stützen', () => materialStuetzen, (wert) => { materialStuetzen = wert; });
  materialZeilen.Stuetzen.zeile.hidden = true; // erscheint erst, wenn ein Modell mit Stützen geladen ist
  materialwahlUmschalten();
}

// Je nach Schalter nur die Zeile „Alle“ oder die vier Zeilen je Seite zeigen (die Zeile „Stützen“ bleibt)
function materialwahlUmschalten() {
  for (const [schluessel, { zeile }] of Object.entries(materialZeilen)) {
    if (schluessel === 'Stuetzen') continue;
    zeile.hidden = (schluessel === 'Alle') !== materialAlleGleich;
  }
}

$('materialAlleGleich').addEventListener('change', (ereignis) => {
  materialAlleGleich = ereignis.target.checked;
  if (materialAlleGleich && materialAlle === null) materialAlle = materialJeRichtung.N;
  materialZeilen.Alle.anzeigen();
  materialwahlUmschalten();
  allesFaerben();
  einzelwahlAnzeigen();
});
materialwahlAufbauen();

// ---------- Einzelne Wände: eigenes Material für ausgewählte Außenwände ----------

const WIE_DIE_SEITE = ''; // Eintrag „wie die Seite“: Wand hat kein eigenes Material
const VERSCHIEDEN = '*'; // ausgewählte Wände haben unterschiedliche Materialien
$('einzelMaterial').add(new Option('wie die Seite', WIE_DIE_SEITE));
for (const m of MATERIALIEN) $('einzelMaterial').add(new Option(m.name, m.id));
const verschiedenEintrag = new Option('– verschieden –', VERSCHIEDEN);
verschiedenEintrag.disabled = true;
$('einzelMaterial').add(verschiedenEintrag);

const wandText = (anzahl) => (anzahl === 1 ? '1 Wand' : `${anzahl} Wände`);

function einzelwahlAnzeigen() {
  $('einzelwahl').hidden = !einzelneWaende;
  // Ohne Auswahl keine Zeile: wie es geht, steht in der ausklappbaren Erklärung
  $('einzelZaehler').hidden = auswahl.size === 0;
  $('einzelZaehler').textContent = `${wandText(auswahl.size)} gewählt.`;
  $('einzelZeile').hidden = auswahl.size === 0;
  $('einzelAnzahl').textContent = wandText(auswahl.size);

  // Gilt für alle gewählten Wände dasselbe? Dann zeigt die Liste es, sonst „verschieden“
  const seite = geltendeMaterialien();
  const eintraege = new Set([...auswahl].map((w) => materialJeWand.get(w.userData.expressID) ?? WIE_DIE_SEITE));
  const geltend = new Set([...auswahl].map((w) => materialJeWand.get(w.userData.expressID) ?? seite[w.userData.himmelsrichtung ?? 'S']));
  verschiedenEintrag.hidden = eintraege.size <= 1;
  $('einzelMaterial').value = eintraege.size === 1 ? [...eintraege][0] : VERSCHIEDEN;
  // Musterbild: das Material, das die Wände gerade wirklich haben (leer, wenn verschieden)
  $('einzelMuster').style.backgroundImage = geltend.size === 1 ? `url(${musterBild([...geltend][0])})` : 'none';

  const anzahlEigene = waende.filter((w) => materialJeWand.has(w.userData.expressID)).length;
  $('einzelZuruecksetzen').hidden = anzahlEigene === 0;
  $('einzelZuruecksetzen').textContent = `Einzelne Wände zurücksetzen (${wandText(anzahlEigene)})`;
}

$('einzelMaterial').addEventListener('change', () => {
  const wert = $('einzelMaterial').value;
  for (const wand of auswahl) {
    if (wert === WIE_DIE_SEITE) materialJeWand.delete(wand.userData.expressID);
    else materialJeWand.set(wand.userData.expressID, wert);
  }
  einzelwahlAnzeigen();
  allesFaerben();
});

$('einzelneWaende').addEventListener('change', (ereignis) => {
  einzelneWaende = ereignis.target.checked;
  auswahl.clear();
  szene.hoverBauteil = null;
  einzelwahlAnzeigen();
  allesFaerben();
});

$('einzelZuruecksetzen').addEventListener('click', () => {
  materialJeWand.clear();
  einzelwahlAnzeigen();
  allesFaerben();
});

// Eine Zeile der Fensterwahl: Name mit Anzahl der Fenster, Regler für Breite und Höhe
// schluessel: N/O/S/W oder 'Alle'; groesse(): das Objekt { breite, hoehe }, das die Regler verstellen
const fensterZeilen = {};
let fensterGeplant = false;
function fensterSpaeterAktualisieren() {
  // Beim Ziehen am Regler höchstens einmal pro Bild neu bauen
  if (fensterGeplant) return;
  fensterGeplant = true;
  requestAnimationFrame(() => { fensterGeplant = false; fensterAktualisieren(); });
}

function fensterzeileAufbauen(schluessel, name, groesse) {
  const zeile = document.createElement('div');
  zeile.className = 'fensterzeile';

  const titel = document.createElement('span');
  titel.textContent = name;
  const anzahl = document.createElement('small');
  anzahl.id = `fensterAnzahl${schluessel}`;
  titel.append(anzahl);

  const regler = document.createElement('div');
  regler.className = 'regler';
  const anzeigen = []; // Regler auf die gespeicherten Werte setzen
  for (const [mass, beschriftung] of [['breite', 'Breite'], ['hoehe', 'Höhe']]) {
    const zeileRegler = document.createElement('label');
    const schieber = document.createElement('input');
    Object.assign(schieber, { type: 'range', min: 0, max: 200, step: 5 });
    schieber.setAttribute('aria-label', `${beschriftung} der Fenster ${name}`);
    const wert = document.createElement('output');
    anzeigen.push(() => {
      schieber.value = groesse()[mass];
      wert.textContent = `${schieber.value} %`;
    });
    schieber.addEventListener('input', () => {
      groesse()[mass] = Number(schieber.value);
      wert.textContent = `${schieber.value} %`;
      fensterSpaeterAktualisieren();
    });
    zeileRegler.append(beschriftung, schieber, wert);
    regler.append(zeileRegler);
  }

  zeile.append(titel, regler);
  $('fensterwahl').append(zeile);
  fensterZeilen[schluessel] = { zeile, anzeigen: () => anzeigen.forEach((f) => f()) };
  fensterZeilen[schluessel].anzeigen();
}

function fensterwahlAufbauen() {
  fensterzeileAufbauen('Alle', 'Alle', () => fensterAlle ?? fensterJeRichtung.N);
  for (const [richtung, name] of Object.entries(RICHTUNGSNAMEN)) {
    fensterzeileAufbauen(richtung, name, () => fensterJeRichtung[richtung]);
  }
  fensterwahlUmschalten();
}

// Je nach Schalter nur die Zeile „Alle“ oder die vier Zeilen je Seite zeigen
function fensterwahlUmschalten() {
  for (const [schluessel, { zeile }] of Object.entries(fensterZeilen)) {
    zeile.hidden = (schluessel === 'Alle') !== fensterAlleGleich;
  }
}

$('fensterAlleGleich').addEventListener('change', (ereignis) => {
  fensterAlleGleich = ereignis.target.checked;
  if (fensterAlleGleich && fensterAlle === null) fensterAlle = { ...fensterJeRichtung.N }; // Kopie, sonst verstellt „Alle“ die Nordseite mit
  fensterZeilen.Alle.anzeigen();
  fensterwahlUmschalten();
  fensterAktualisieren();
});
fensterwahlAufbauen();

$('fensterZuruecksetzen').addEventListener('click', () => {
  for (const richtung of Object.keys(fensterJeRichtung)) fensterJeRichtung[richtung] = { breite: 100, hoehe: 100 };
  if (fensterAlle !== null) fensterAlle = { breite: 100, hoehe: 100 };
  for (const { anzeigen } of Object.values(fensterZeilen)) anzeigen();
  fensterAktualisieren();
});

function fensterAnzeigen() {
  $('bereichFenster').hidden = waende.length === 0;
  for (const richtung of Object.keys(RICHTUNGSNAMEN)) {
    const anzahl = oeffnungen.filter((oe) => oe.userData.himmelsrichtung === richtung).length;
    $(`fensterAnzahl${richtung}`).textContent = `${anzahl} Fenster`;
  }
  const alle = oeffnungen.filter((oe) => oe.userData.himmelsrichtung in RICHTUNGSNAMEN).length;
  $('fensterAnzahlAlle').textContent = `${alle} Fenster`;
  // Knopf nur zeigen, wenn irgendwo (auch im Hintergrund) nicht 100 % eingestellt ist
  const groessen = [...Object.values(fensterJeRichtung), ...(fensterAlle ? [fensterAlle] : [])];
  $('fensterZuruecksetzen').hidden = groessen.every((g) => g.breite === 100 && g.hoehe === 100);
}

// ---------- Perspektive: Blick aus einer Ecke, Blickhöhe in Grad ----------

const BLICK_NAMEN = { 45: 'Nordosten', 135: 'Südosten', 225: 'Südwesten', 315: 'Nordwesten' };
const BLICK_KURZ = { 45: 'NO', 135: 'SO', 225: 'SW', 315: 'NW' };
const blick = { aus: 135, hoehe: 15 }; // Start: aus Südosten, 15° von oben

// Blick einer Variante; ältere Varianten (vor Sitzung 10b) hatten fest Südost mit ca. 26°
const blickVon = (variante) => variante.blick ?? { aus: 135, hoehe: 26 };
const blickText = (variante) => {
  const b = blickVon(variante);
  return `Perspektive aus ${BLICK_NAMEN[b.aus]}, ${variante.blick ? '' : 'ca. '}${b.hoehe}°`;
};
const blickKurz = (variante) => {
  const b = blickVon(variante);
  return `${BLICK_KURZ[b.aus]} · ${b.hoehe}°`;
};

function blickAnzeigen() {
  $('blickAus').value = String(blick.aus);
  $('blickHoehe').value = String(blick.hoehe);
  $('blickHoeheWert').textContent = `${blick.hoehe}°`;
}

// Das 3D-Fenster springt auf den eingestellten Blick (beim Ziehen höchstens einmal pro Bild)
let blickGeplant = false;
function blickImFenster() {
  if (blickGeplant) return;
  blickGeplant = true;
  requestAnimationFrame(() => { blickGeplant = false; szene.blickZeigen(blick, hauptrichtungBestimmen(waende)); });
}

$('blickAus').addEventListener('change', () => { blick.aus = Number($('blickAus').value); blickImFenster(); });
$('blickHoehe').addEventListener('input', () => {
  blick.hoehe = Number($('blickHoehe').value);
  $('blickHoeheWert').textContent = `${blick.hoehe}°`;
  blickImFenster();
});

// ---------- Varianten: speichern, auflisten, laden, löschen ----------

// Alle Einstellungen als reine Daten (Kopien, damit spätere Änderungen die Variante nicht verstellen)
function einstellungenSammeln() {
  return structuredClone({
    materialJeRichtung, materialStuetzen, materialAlleGleich, materialAlle,
    fensterJeRichtung, fensterAlleGleich, fensterAlle,
    // nur die Wände, die per Klick anders sind als die automatische Erkennung
    wandUmgeschaltet: waende.filter((w) => w.userData.aussen !== w.userData.aussenAuto).map((w) => w.userData.expressID),
    // Wände mit eigenem Material: [Wand-Nummer, Material]
    materialJeWand: [...materialJeWand],
  });
}

$('varianteSpeichern').addEventListener('click', async () => {
  const knopf = $('varianteSpeichern');
  const name = $('variantenName').value.trim() || $('variantenName').placeholder || 'Variante';
  knopf.disabled = true;
  variantenStatus('Bilder werden aufgenommen …');
  try {
    // Ohne blauen Hover-Schimmer fotografieren; Fenster sicher auf dem neuesten Stand
    // (falls ein Regler gerade erst bewegt wurde und das Neubauen noch aussteht)
    // (auch ohne den Schimmer ausgewählter Wände: Auswahl aufheben)
    szene.hoverBauteil = null;
    auswahl.clear();
    einzelwahlAnzeigen();
    fensterAktualisieren();
    const drehung = hauptrichtungBestimmen(waende);
    const bilder = await szene.bilderAufnehmen(undefined, undefined, drehung, blick);
    await varianteSpeichern({
      modell: modellKennung, name, datum: Date.now(),
      einstellungen: einstellungenSammeln(), kennwerte: kennwerteMitGesamt(), bilder, drehung, blick: { ...blick },
    });
    $('variantenName').value = '';
    variantenStatus(`„${name}“ ist gespeichert.`);
    await variantenAnzeigen();
  } catch (fehler) {
    console.error(fehler);
    variantenStatus(`Die Variante konnte nicht gespeichert werden: ${fehler.message}`, true);
  } finally {
    knopf.disabled = false;
  }
});

// Gespeicherte Einstellungen wieder in die Bedienung und ins 3D-Modell übernehmen
function varianteLaden(variante) {
  const e = variante.einstellungen;
  Object.assign(materialJeRichtung, e.materialJeRichtung);
  materialStuetzen = e.materialStuetzen;
  materialAlleGleich = e.materialAlleGleich;
  materialAlle = e.materialAlle;
  for (const richtung of Object.keys(RICHTUNGSNAMEN)) fensterJeRichtung[richtung] = { ...e.fensterJeRichtung[richtung] };
  fensterAlleGleich = e.fensterAlleGleich;
  fensterAlle = e.fensterAlle ? { ...e.fensterAlle } : null;
  const umgeschaltet = new Set(e.wandUmgeschaltet);
  for (const wand of waende) {
    wand.userData.aussen = umgeschaltet.has(wand.userData.expressID) ? !wand.userData.aussenAuto : wand.userData.aussenAuto;
  }
  // Eigenes Material einzelner Wände (ältere Varianten haben keins)
  materialJeWand.clear();
  for (const [id, material] of e.materialJeWand ?? []) materialJeWand.set(id, material);
  auswahl.clear();
  einzelwahlAnzeigen();

  $('materialAlleGleich').checked = materialAlleGleich;
  $('fensterAlleGleich').checked = fensterAlleGleich;
  for (const { anzeigen } of Object.values(materialZeilen)) anzeigen();
  for (const { anzeigen } of Object.values(fensterZeilen)) anzeigen();
  materialwahlUmschalten();
  fensterwahlUmschalten();
  fensterAktualisieren();
  aussenwaendeAnzeigen();
  // Blick der Perspektive übernehmen (ältere Varianten ohne gespeicherten Blick: Einstellung bleibt)
  if (variante.blick) {
    Object.assign(blick, variante.blick);
    blickAnzeigen();
    blickImFenster();
  }
  variantenStatus(`„${variante.name}“ ist geladen.`);
}

let bildAdressen = []; // Vorschaubilder der Liste, werden beim Neuzeichnen freigegeben
let gespeicherteVarianten = []; // die Varianten des geladenen Modells, neueste zuerst
const zumVergleich = new Set(); // Nummern (id) der angekreuzten Varianten
const VERGLEICH_HOECHSTENS = 4; // so viele passen auch aufs PDF (A3 quer)

async function variantenAnzeigen() {
  $('bereichVarianten').hidden = waende.length === 0;
  const varianten = await variantenLesen(modellKennung);
  gespeicherteVarianten = varianten;
  // Gelöschte Varianten (oder die eines anderen Modells) aus der Auswahl nehmen
  for (const id of [...zumVergleich]) if (!varianten.some((v) => v.id === id)) zumVergleich.delete(id);
  $('variantenName').placeholder = `Variante ${varianten.length + 1}`;

  for (const adresse of bildAdressen) URL.revokeObjectURL(adresse);
  bildAdressen = [];
  const liste = $('variantenListe');
  liste.replaceChildren();
  for (const variante of varianten) {
    const eintrag = document.createElement('li');
    const bild = document.createElement('img');
    bild.src = URL.createObjectURL(variante.bilder.perspektive);
    bild.alt = '';
    bildAdressen.push(bild.src);

    const text = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = variante.name; // textContent: Namen werden nie als HTML gelesen
    const angaben = document.createElement('small');
    const { fassade, fenster } = variante.kennwerte.gesamt;
    const datum = new Date(variante.datum).toLocaleString('de-DE', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
    angaben.textContent = `${datum} · Fensteranteil ${fassade > 0 ? Math.round((fenster / fassade) * 100) : '–'} %`;

    const knoepfe = document.createElement('span');
    const laden = document.createElement('button');
    laden.className = 'textknopf';
    laden.textContent = 'Laden';
    laden.addEventListener('click', () => varianteLaden(variante));
    const loeschen = document.createElement('button');
    loeschen.className = 'textknopf';
    loeschen.textContent = 'Löschen';
    loeschen.addEventListener('click', async () => {
      if (!confirm(`Variante „${variante.name}“ wirklich löschen? Das lässt sich nicht rückgängig machen.`)) return;
      await varianteLoeschen(variante.id);
      variantenStatus(`„${variante.name}“ ist gelöscht.`);
      await variantenAnzeigen();
    });
    knoepfe.append(laden, loeschen);

    // Kästchen „zum Vergleich ankreuzen“
    const kaestchen = document.createElement('input');
    kaestchen.type = 'checkbox';
    kaestchen.className = 'ankreuzen';
    kaestchen.checked = zumVergleich.has(variante.id);
    kaestchen.setAttribute('aria-label', `„${variante.name}“ zum Vergleich auswählen`);
    kaestchen.addEventListener('change', () => {
      if (kaestchen.checked) zumVergleich.add(variante.id);
      else zumVergleich.delete(variante.id);
      vergleichswahlAnzeigen();
    });

    text.append(name, angaben, knoepfe);
    eintrag.append(kaestchen, bild, text);
    liste.append(eintrag);
  }
  vergleichswahlAnzeigen();
}

// Hinweis, Standortfeld und Knöpfe „Vergleichen“ / „Als PDF speichern“ unter der Liste;
// ab 4 Kreuzen sind die übrigen Kästchen gesperrt
function vergleichswahlAnzeigen() {
  $('vergleichswahl').hidden = gespeicherteVarianten.length < 1;
  const anzahl = zumVergleich.size;
  const voll = anzahl >= VERGLEICH_HOECHSTENS;
  for (const kaestchen of $('variantenListe').querySelectorAll('.ankreuzen')) {
    kaestchen.disabled = voll && !kaestchen.checked;
  }
  $('vergleichHinweis').textContent =
    anzahl === 0 ? `Zum Vergleichen oder fürs PDF 1 bis ${VERGLEICH_HOECHSTENS} Varianten ankreuzen.`
      : anzahl === 1 ? '1 Variante gewählt. Zum Vergleichen mindestens 2 ankreuzen.'
        : voll ? `${anzahl} Varianten gewählt (mehr passen nicht nebeneinander).`
          : `${anzahl} Varianten gewählt.`;
  $('vergleichOeffnen').hidden = anzahl < 2;
  $('vergleichOeffnen').textContent = `${anzahl} Varianten vergleichen`;
  $('pdfwahl').hidden = anzahl < 1;
  $('pdfSpeichern').hidden = anzahl < 1;
}

// Angekreuzte Varianten, älteste zuerst (so stehen sie im Vergleich und im PDF von links nach rechts)
const gewaehlteVarianten = () => gespeicherteVarianten.filter((v) => zumVergleich.has(v.id)).sort((a, b) => a.datum - b.datum);

// Beschriftung einer Ansicht: „N“, bei gedrehtem Gebäude „N (NNW)“
function ansichtKennzeichen(variante, richtung) {
  const genau = genaueRichtung(richtung, variante.drehung);
  return genau ? `${richtung} (${genau.kurz})` : richtung;
}

// PDF-Übersichtsseite A3 quer bauen und direkt als Datei speichern
async function pdfSpeichern(knopf) {
  const varianten = gewaehlteVarianten();
  if (varianten.length < 1) return;
  const text = knopf.textContent;
  knopf.disabled = true;
  knopf.textContent = 'PDF wird erstellt …';
  try {
    const doc = await pdfErstellen({
      varianten, modellName, standort: $('standort').value.trim(), kennzeichen: ansichtKennzeichen, blickText,
      mitKennwerte: $('pdfKennwerte').checked,
    });
    const dateiname = pdfDateiname(modellName, varianten.length);
    doc.save(dateiname);
    variantenStatus(`„${dateiname}“ ist im Download-Ordner gespeichert.`);
  } catch (fehler) {
    console.error(fehler);
    variantenStatus(`Das PDF konnte nicht erstellt werden: ${fehler.message}`, true);
    if (!$('vergleich').hidden) alert(`Das PDF konnte nicht erstellt werden: ${fehler.message}`);
  } finally {
    knopf.disabled = false;
    knopf.textContent = text;
  }
}
$('pdfSpeichern').addEventListener('click', () => pdfSpeichern($('pdfSpeichern')));
$('vergleichPdf').addEventListener('click', () => pdfSpeichern($('vergleichPdf')));

// ---------- Variantenvergleich: eine Spalte je Variante, gleiche Zeilen auf gleicher Höhe ----------

const materialName = (id) => MATERIALIEN.find((m) => m.id === id)?.name ?? id;
const anteilText = ({ fassade, fenster }) => (fassade > 0 ? `${Math.round((fenster / fassade) * 100)} %` : '–');
let vergleichAdressen = []; // Bildadressen des Vergleichs, werden beim Schließen freigegeben

// Ein Feld im Raster anlegen (klasse z. B. 'beschriftung' für die linke Spalte)
function feld(klasse, ...inhalt) {
  const element = document.createElement('div');
  element.className = klasse;
  element.append(...inhalt);
  $('vergleichRaster').append(element);
  return element;
}
function textElement(tag, text, klasse) {
  const element = document.createElement(tag);
  element.textContent = text; // textContent: Namen werden nie als HTML gelesen
  if (klasse) element.className = klasse;
  return element;
}

// Bild einer Variante als anklickbares Vorschaubild (Klick = groß zeigen)
function vergleichsbild(variante, schluessel, titel, kennzeichen = schluessel) {
  const knopf = document.createElement('button');
  knopf.className = 'vergleich-bild';
  knopf.setAttribute('aria-label', `${titel} von „${variante.name}“ groß zeigen`);
  const bild = document.createElement('img');
  bild.src = URL.createObjectURL(variante.bilder[schluessel]);
  bild.alt = '';
  vergleichAdressen.push(bild.src);
  knopf.append(bild);
  knopf.append(textElement('span', kennzeichen));
  knopf.addEventListener('click', () => grossbildZeigen(bild.src, `${variante.name} · ${titel}`));
  return knopf;
}

function vergleichOeffnen() {
  // Älteste links, neueste rechts
  const varianten = gewaehlteVarianten();
  if (varianten.length < 2) return;

  const raster = $('vergleichRaster');
  raster.replaceChildren();
  raster.style.setProperty('--spalten', varianten.length);
  $('vergleichModell').textContent = modellKennung;

  // Eine Zeile: Beschriftung links, dann ein Feld je Variante
  const zeile = (beschriftung, inhalt, klasse = '') => {
    feld(`beschriftung ${klasse}`, beschriftung);
    for (const variante of varianten) feld(`zelle ${klasse}`, ...[inhalt(variante)].flat());
  };
  const zwischentitel = (text) => feld('zwischentitel', textElement('h3', text));

  // Kopf: Name und Datum (bleibt beim Scrollen oben stehen)
  zeile('', (v) => [
    textElement('strong', v.name),
    textElement('small', new Date(v.datum).toLocaleString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })),
  ], 'kopf');

  zeile('Perspektive', (v) => vergleichsbild(v, 'perspektive', blickText(v), blickKurz(v)));
  zeile('Ansichten', (v) => {
    const ansichten = document.createElement('div');
    ansichten.className = 'ansichten';
    for (const [richtung, name] of Object.entries(RICHTUNGSNAMEN)) {
      // Ist das Gebäude gedreht, steht dabei, wohin die Fassade wirklich zeigt (ältere Varianten: ohne)
      const genau = genaueRichtung(richtung, v.drehung);
      ansichten.append(genau
        ? vergleichsbild(v, richtung, `Ansicht ${name} – zeigt nach ${genau.lang}`, ansichtKennzeichen(v, richtung))
        : vergleichsbild(v, richtung, `Ansicht ${name}`));
    }
    return ansichten;
  });

  // Material, das je Seite wirklich gilt (auch bei „Alle Seiten gleich“)
  const materialVon = (v, richtung) => {
    const e = v.einstellungen;
    return e.materialAlleGleich ? e.materialAlle : e.materialJeRichtung[richtung];
  };
  const fensterVon = (v, richtung) => {
    const e = v.einstellungen;
    return e.fensterAlleGleich ? e.fensterAlle : e.fensterJeRichtung[richtung];
  };
  const materialFeld = (id) => {
    const muster = document.createElement('span');
    muster.className = 'muster';
    muster.style.backgroundImage = `url(${musterBild(id)})`;
    return [muster, textElement('span', materialName(id))];
  };

  zwischentitel('Fassade');
  for (const [richtung, name] of Object.entries(RICHTUNGSNAMEN)) {
    zeile(name, (v) => materialFeld(materialVon(v, richtung)), 'material');
  }
  if (stuetzen.length > 0) zeile('Stützen', (v) => materialFeld(v.einstellungen.materialStuetzen), 'material');
  // Einzelne Wände mit eigenem Material: Anzahl je Material (nur, wenn eine der Varianten welche hat)
  if (varianten.some((v) => v.einstellungen.materialJeWand?.length)) {
    zeile('Einzelne Wände', (v) => {
      const anzahlJeMaterial = new Map();
      for (const [, material] of v.einstellungen.materialJeWand ?? []) {
        anzahlJeMaterial.set(material, (anzahlJeMaterial.get(material) ?? 0) + 1);
      }
      if (anzahlJeMaterial.size === 0) return textElement('span', '–');
      return [...anzahlJeMaterial].map(([material, anzahl]) =>
        textElement('span', `${wandText(anzahl)} ${materialName(material)}`));
    }, 'einzeln');
  }

  zwischentitel('Fenster');
  for (const [richtung, name] of Object.entries(RICHTUNGSNAMEN)) {
    zeile(name, (v) => {
      const { breite, hoehe } = fensterVon(v, richtung);
      return textElement('span', breite === 0 || hoehe === 0 ? 'zu (0 %)' : `Breite ${breite} % · Höhe ${hoehe} %`);
    });
  }

  zwischentitel('Kennwerte');
  const dreiWerte = (werte, klasse = 'werte') => {
    const reihe = document.createElement('div');
    reihe.className = klasse;
    for (const wert of werte) reihe.append(textElement('span', wert));
    return reihe;
  };
  zeile('', () => dreiWerte(['Fassade m²', 'Fenster m²', 'Anteil'], 'werte spaltenkopf'));
  for (const [schluessel, name] of [...Object.entries(RICHTUNGSNAMEN), ['gesamt', 'Gesamt']]) {
    zeile(name, (v) => {
      const k = v.kennwerte[schluessel];
      return dreiWerte([quadratmeter(k.fassade), quadratmeter(k.fenster), anteilText(k)]);
    }, schluessel === 'gesamt' ? 'gesamt' : '');
  }

  $('vergleich').hidden = false;
  raster.scrollTop = 0;
  $('vergleichSchliessen').focus();
}

function vergleichSchliessen() {
  grossbildSchliessen();
  $('vergleich').hidden = true;
  $('vergleichRaster').replaceChildren();
  for (const adresse of vergleichAdressen) URL.revokeObjectURL(adresse);
  vergleichAdressen = [];
  $('vergleichOeffnen').focus();
}

function grossbildZeigen(adresse, text) {
  $('grossbildBild').src = adresse;
  $('grossbildText').textContent = text;
  $('grossbild').hidden = false;
}
function grossbildSchliessen() {
  $('grossbild').hidden = true;
  $('grossbildBild').removeAttribute('src');
}

$('vergleichOeffnen').addEventListener('click', vergleichOeffnen);
$('vergleichSchliessen').addEventListener('click', vergleichSchliessen);
$('grossbild').addEventListener('click', grossbildSchliessen);
// Esc schließt zuerst das große Bild, dann den Vergleich, dann die Anleitung (nur wenn ein Modell da ist)
window.addEventListener('keydown', (ereignis) => {
  if (ereignis.key !== 'Escape') return;
  if (!$('grossbild').hidden) grossbildSchliessen();
  else if (!$('vergleich').hidden) vergleichSchliessen();
  else if (!$('anleitung').hidden && modellKennung) anleitungZeigen(false);
});

// Anleitung: ohne Modell die Startseite; mit Modell legt sie sich über das 3D-Fenster
function anleitungZeigen(sichtbar) {
  $('anleitung').hidden = !sichtbar;
  $('anleitungSchliessen').hidden = !modellKennung; // ohne Modell gibt es nichts, wohin man zurück kann
  $('anleitungOeffnen').textContent = sichtbar ? 'Anleitung schließen' : 'Anleitung';
}
$('anleitungOeffnen').addEventListener('click', () => anleitungZeigen($('anleitung').hidden));
$('anleitungSchliessen').addEventListener('click', () => anleitungZeigen(false));

function variantenStatus(text, istFehler = false) {
  const status = $('variantenStatus');
  status.textContent = text;
  status.classList.toggle('fehler', istFehler);
}

$('datei').addEventListener('change', (ereignis) => {
  const datei = ereignis.target.files[0];
  if (datei) dateiOeffnen(datei);
  ereignis.target.value = ''; // gleiche Datei darf nochmal gewählt werden
});

// Datei ins Fenster ziehen
let ziehZaehler = 0;
window.addEventListener('dragenter', (e) => { e.preventDefault(); ziehZaehler++; $('ablage').hidden = false; });
window.addEventListener('dragleave', () => { if (--ziehZaehler <= 0) { ziehZaehler = 0; $('ablage').hidden = true; } });
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  ziehZaehler = 0;
  $('ablage').hidden = true;
  const datei = e.dataTransfer.files[0];
  if (datei) dateiOeffnen(datei);
});

async function dateiOeffnen(datei) {
  if (!datei.name.toLowerCase().endsWith('.ifc')) {
    statusZeigen(`„${datei.name}“ ist keine IFC-Datei. Bitte eine Datei mit der Endung .ifc wählen.`, true);
    return;
  }
  $('laden').hidden = false;
  statusZeigen('');
  $('bauteile').hidden = true;
  try {
    const { gruppe, anzahl } = await ifcLaden(datei);
    waende = aussenwaendeErkennen(gruppe);
    oeffnungen = oeffnungenZuordnen(gruppe, waende);
    stuetzen = stuetzenVorbereiten(gruppe);
    // Eigenes Material einzelner Wände gehört zum alten Modell
    materialJeWand.clear();
    auswahl.clear();
    einzelwahlAnzeigen();
    szene.zeigeModell(gruppe);
    fensterAktualisieren();
    aussenwaendeAnzeigen();
    modellKennung = `${datei.name} · ${anzahl.wand} Wände`;
    modellName = datei.name;
    variantenAnzeigen();
    anleitungZeigen(false);
    $('anleitungOeffnen').hidden = false;
    $('legende').hidden = false;
    statusZeigen(datei.name);
    // Bauteil-Anzahlen: nebensächlich, deshalb zugeklappt unter „Bauteile“
    $('bauteileText').textContent =
      `${anzahl.wand} Wände · ${anzahl.fenster} Fenster · ${anzahl.tuer} Türen · ${anzahl.stuetze ? `${anzahl.stuetze} Stützen · ` : ''}${anzahl.dach} Dachteile · ${anzahl.rest} weitere Bauteile`;
    $('bauteile').hidden = false;
  } catch (fehler) {
    console.error(fehler);
    statusZeigen(`Die Datei konnte nicht geöffnet werden: ${fehler.message}`, true);
  } finally {
    $('laden').hidden = true;
  }
}

function statusZeigen(text, istFehler = false) {
  const status = $('status');
  status.textContent = text; // textContent: Dateinamen werden nie als HTML gelesen
  status.classList.toggle('fehler', istFehler);
}
