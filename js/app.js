// Bedienoberfläche: Datei wählen oder hineinziehen, Modell anzeigen, Fassade gestalten
import { Szene } from './szene.js?v=20b';
import { ifcLaden } from './ifc.js?v=19';
import { aussenwaendeErkennen, wandFaerben, oeffnungenZuordnen, fensterAnpassen, stuetzenVorbereiten, stuetzeFaerben, dachVorbereiten, dachFaerben, kennwerteBerechnen, hauptrichtungBestimmen, fensterFaerben, anbauteileZuordnen } from './fassade.js?v=20b';
import {
  MATERIALIEN, DACHMATERIALIEN, START_MATERIAL, START_DACH, PFOSTEN_RIEGEL, ALTE_KENNUNGEN, musterBild,
  farbtoeneVon, farbtonVon, farbtonSetzen, farbtoeneSammeln, farbtoeneUebernehmen, materialText,
} from './materialien.js?v=20b';
import { variantenLesen, varianteSpeichern, varianteLoeschen } from './varianten.js';
import { pdfErstellen, pdfDateiname } from './pdf.js?v=11';

const $ = (id) => document.getElementById(id);
const ansicht = $('ansicht');
const szene = new Szene(ansicht);

let waende = []; // alle Wände des geladenen Modells
let oeffnungen = []; // alle Fenster und Türen
let stuetzen = []; // alle Stützen
let dachteile = []; // alle Dachteile (IfcRoof bzw. Decken mit Typ „Dach“)
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

// Ein Material für alle Dachteile (Sitzung 17b)
let materialDach = START_DACH;

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

// Pfosten-Riegel-Fassade: Anzahl der Felder je Wand (breit × hoch), einstellbar je Seite, für „Alle“
// und für einzelne Wände mit eigenem Material Pfosten-Riegel
const START_FELDER = { breit: 8, hoch: 3 };
const felderJeRichtung = {};
for (const richtung of Object.keys(RICHTUNGSNAMEN)) felderJeRichtung[richtung] = { ...START_FELDER };
let felderAlle = null; // wird beim ersten Einschalten von „Alle Seiten gleich“ mit den Feldern der Nordseite belegt
const felderJeWand = new Map(); // Wand-Nummer → { breit, hoch }

function geltendeFelder() {
  if (!materialAlleGleich) return felderJeRichtung;
  const alle = felderAlle ?? felderJeRichtung.N;
  return { N: alle, O: alle, S: alle, W: alle };
}

// Material, das eine Wand gerade wirklich hat (eigenes oder das ihrer Seite)
function materialDerWand(wand) {
  return materialJeWand.get(wand.userData.expressID) ?? geltendeMaterialien()[wand.userData.himmelsrichtung ?? 'S'];
}

// Jeder Außenwand mit Pfosten-Riegel ihre Felder mitgeben (userData.pfostenRiegel), alle anderen: null
function pfostenRiegelSetzen() {
  const felder = geltendeFelder();
  for (const wand of waende) {
    const id = wand.userData.expressID;
    wand.userData.pfostenRiegel = wand.userData.aussen && materialDerWand(wand) === PFOSTEN_RIEGEL
      ? (materialJeWand.has(id) ? felderJeWand.get(id) ?? START_FELDER : felder[wand.userData.himmelsrichtung ?? 'S'])
      : null;
  }
}

// Schalter „Einzelne Fenster“: einzelnen Fenstern ein eigenes Maß in cm geben (gilt vor dem Prozentwert der Seite)
let einzelneFenster = false;
const massJeFenster = new Map(); // Fenster-Nummer aus der IFC (expressID) → { breite, hoehe } in cm
const fensterAuswahl = new Set(); // gerade ausgewählte Fenster (nur bei eingeschaltetem Schalter)

function allesFaerben() {
  const materialien = geltendeMaterialien();
  for (const wand of waende) {
    const schimmer = auswahl.has(wand) ? 'auswahl' : wand === szene.hoverBauteil;
    wandFaerben(wand, materialien, schimmer, materialJeWand.get(wand.userData.expressID));
  }
  for (const stuetze of stuetzen) stuetzeFaerben(stuetze, materialStuetzen);
  for (const teil of dachteile) dachFaerben(teil, materialDach);
  for (const oe of oeffnungen) {
    fensterFaerben(oe, fensterAuswahl.has(oe) ? 'auswahl' : einzelneFenster && oe === szene.hoverBauteil);
  }
}

// Fenster neu einpassen (z. B. nach Reglerbewegung oder wenn eine Wand umgeschaltet wurde)
function fensterAktualisieren() {
  pfostenRiegelSetzen();
  fensterAnpassen(waende, oeffnungen, geltendeFenster(), massJeFenster);
  // Fenster, die nicht mehr verstellbar sind (z. B. Wand auf „innen“ geschaltet), fallen aus der Auswahl
  for (const oe of [...fensterAuswahl]) if (!oe.userData.himmelsrichtung) fensterAuswahl.delete(oe);
  allesFaerben();
  fensterAnzeigen();
  fensterEinzelwahlAnzeigen();
  kennwerteAnzeigen();
  farbtoeneAnzeigen();
}

// ---------- Farbtöne (Sitzung 18): je benutztem Material eine Zeile mit Farbpunkten ----------
// Ein Farbton gilt für das Material überall (alle Seiten, einzelne Wände, Stützen), deshalb steht
// jedes Material nur einmal da, egal wie oft es vorkommt.
function benutzteMaterialien() {
  const ids = new Set(Object.values(geltendeMaterialien()));
  for (const id of materialJeWand.values()) ids.add(id);
  if (stuetzen.length > 0) ids.add(materialStuetzen);
  const reihenfolge = MATERIALIEN.map((m) => m.id).filter((id) => ids.has(id));
  if (dachteile.length > 0) reihenfolge.push(materialDach);
  return reihenfolge.filter((id) => farbtoeneVon(id).length > 0);
}

// Wahrgenommene Helligkeit einer Farbe wie „#92564b“ (0 = schwarz … 255 = weiß)
function helligkeit(hex) {
  const zahl = parseInt(hex.slice(1), 16);
  return 0.299 * ((zahl >> 16) & 255) + 0.587 * ((zahl >> 8) & 255) + 0.114 * (zahl & 255);
}

function farbtoeneAnzeigen() {
  const block = $('farbtoene');
  if (block.contains(document.activeElement)) block.dataset.fokus = document.activeElement.dataset.schluessel ?? '';
  block.replaceChildren(textElement('h3', 'Farbtöne'));
  const ids = waende.length ? benutzteMaterialien() : [];
  block.hidden = ids.length === 0;
  for (const id of ids) {
    const ton = farbtonVon(id);
    const zeile = document.createElement('div');
    zeile.className = 'farbtonzeile';
    const titel = textElement('span', DACHMATERIALIEN.some((m) => m.id === id) ? `Dach: ${materialName(id)}` : materialName(id));
    titel.append(textElement('small', ton.name));
    const punkte = document.createElement('div');
    punkte.className = 'farbpunkte';
    // Punkte nach Helligkeit sortiert, hell links → dunkel rechts (Wunsch der Nutzerin)
    for (const t of [...farbtoeneVon(id)].sort((a, b) => helligkeit(b.farbe) - helligkeit(a.farbe))) {
      const punkt = document.createElement('button');
      punkt.type = 'button';
      punkt.className = 'farbpunkt';
      punkt.style.background = t.farbe;
      punkt.title = t.name;
      punkt.dataset.schluessel = `${id}|${t.id}`;
      punkt.setAttribute('aria-label', `${materialName(id)}: ${t.name}`);
      punkt.setAttribute('aria-pressed', String(t.id === ton.id));
      punkt.addEventListener('click', () => {
        farbtonSetzen(id, t.id);
        for (const { anzeigen } of Object.values(materialZeilen)) anzeigen(); // Musterbilder neu
        einzelwahlAnzeigen();
        farbtoeneAnzeigen();
      });
      punkte.append(punkt);
    }
    zeile.append(titel, punkte);
    block.append(zeile);
  }
  // Tastatur: nach dem Neuzeichnen bleibt der Fokus auf demselben Punkt
  if (block.dataset.fokus) {
    block.querySelector(`[data-schluessel="${CSS.escape(block.dataset.fokus)}"]`)?.focus();
    delete block.dataset.fokus;
  }
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

// Klick bei „Einzelne Wände“ bzw. „Einzelne Fenster“: einfacher Klick wählt nur dieses Bauteil
// (Klick auf das einzige gewählte oder ins Leere hebt die Auswahl auf), Umschalt + Klick nimmt es dazu oder heraus
function auswahlKlick(menge, bauteil, ereignis) {
  if (!ereignis.shiftKey) {
    const nurDieses = bauteil && menge.size === 1 && menge.has(bauteil);
    menge.clear();
    if (bauteil && !nurDieses) menge.add(bauteil);
  } else if (bauteil) {
    if (menge.has(bauteil)) menge.delete(bauteil);
    else menge.add(bauteil);
  }
}

// Wände anfahren (hervorheben) und anklicken:
// normal schaltet ein Klick außen ↔ innen um; mit Schalter „Einzelne Wände“ wählt er Außenwände aus,
// mit Schalter „Einzelne Fenster“ verstellbare Fenster (in nachbaubaren Außenwänden)
szene.istAnklickbar = (bauteil) => {
  if (einzelneFenster) return bauteil.userData.art === 'fenster' && !!bauteil.userData.himmelsrichtung;
  return bauteil.userData.art === 'wand' && (!einzelneWaende || bauteil.userData.aussen);
};
szene.beiHover = () => allesFaerben();
szene.beiKlick = (bauteil, ereignis) => {
  if (einzelneFenster) {
    auswahlKlick(fensterAuswahl, bauteil, ereignis);
    fensterEinzelwahlAnzeigen();
    allesFaerben();
    return;
  }
  const wand = bauteil;
  if (einzelneWaende) {
    auswahlKlick(auswahl, wand, ereignis);
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
  // Zeile „Dach“ nur, wenn die IFC ein Dach hat
  materialZeilen.Dach.zeile.hidden = dachteile.length === 0;
  $('anzahlDach').textContent = dachteile.length === 1 ? '1 Dachteil' : `${dachteile.length} Dachteile`;
}

// Zwei Zahlenfelder „Felder … breit × … hoch“ für die Pfosten-Riegel-Fassade.
// lesen(): Liste der Felder-Objekte, die verstellt werden (bei mehreren gewählten Wänden mehrere);
// bei verschiedenen Werten bleibt das Feld leer („versch.“). Übernommen wird beim Bestätigen.
function felderzeileAufbauen(lesen) {
  const zeile = document.createElement('div');
  zeile.className = 'felderzeile';
  zeile.append(textElement('span', 'Felder'));
  const anzeigen = [];
  for (const [mass, beschriftung, hoechstens] of [['breit', 'breit', 40], ['hoch', 'hoch', 20]]) {
    const label = document.createElement('label');
    const feld = document.createElement('input');
    Object.assign(feld, { type: 'number', min: 1, max: hoechstens, step: 1, className: 'eingabe', autocomplete: 'off' });
    feld.setAttribute('aria-label', `Anzahl der Felder ${beschriftung}`);
    anzeigen.push(() => {
      if (document.activeElement === feld) return; // beim Tippen nicht dazwischenfunken
      const werte = new Set(lesen().map((f) => f[mass]));
      feld.value = werte.size === 1 ? [...werte][0] : '';
      feld.placeholder = werte.size > 1 ? 'versch.' : '';
    });
    feld.addEventListener('change', () => {
      const wert = Math.round(Number(feld.value));
      if (feld.value.trim() !== '' && Number.isFinite(wert)) {
        for (const felder of lesen()) felder[mass] = Math.min(hoechstens, Math.max(1, wert));
      }
      feld.blur();
      zeile.anzeigen();
      fensterAktualisieren();
    });
    feld.addEventListener('keydown', (ereignis) => { if (ereignis.key === 'Enter') feld.blur(); });
    label.append(feld, ` ${beschriftung}`);
    zeile.append(label);
  }
  zeile.anzeigen = () => anzeigen.forEach((f) => f());
  return zeile;
}

// Eine Zeile der Materialwahl: Name, Musterbild, Auswahlliste; bei Pfosten-Riegel darunter die Felder
// schluessel: N/O/S/W, 'Alle', 'Stuetzen' oder 'Dach'; lesen/schreiben: woher das Material kommt und wohin es geht;
// felder(): die Felder dieser Zeile (nicht bei Stützen und Dach); angebot: welche Materialien zur Wahl stehen
const materialZeilen = {};
function materialzeileAufbauen(schluessel, name, lesen, schreiben, felder = null, angebot = MATERIALIEN) {
  const block = document.createElement('div');
  const zeile = document.createElement('label');
  zeile.className = schluessel === 'Stuetzen' || schluessel === 'Dach' ? `materialzeile ${schluessel.toLowerCase()}` : 'materialzeile';

  const titel = document.createElement('span');
  titel.textContent = name;
  const anzahl = document.createElement('small');
  anzahl.id = `anzahl${schluessel}`;
  titel.append(anzahl);

  const muster = document.createElement('span');
  muster.className = 'muster';

  const liste = document.createElement('select');
  for (const m of angebot) if (felder || !m.pfostenRiegel) liste.add(new Option(m.name, m.id));
  const felderzeile = felder ? felderzeileAufbauen(() => [felder()]) : null;

  // Liste und Musterbild auf den gespeicherten Wert setzen
  const anzeigen = () => {
    liste.value = lesen();
    muster.style.backgroundImage = `url(${musterBild(liste.value)})`;
    if (felderzeile) {
      felderzeile.hidden = liste.value !== PFOSTEN_RIEGEL;
      felderzeile.anzeigen();
    }
  };
  liste.addEventListener('change', () => {
    schreiben(liste.value);
    anzeigen();
    fensterAktualisieren(); // Pfosten-Riegel baut die Wände neu, sonst nur neu einfärben
    einzelwahlAnzeigen(); // Musterbild der Auswahl kann sich mitändern („wie die Seite“)
  });

  zeile.append(titel, muster, liste);
  block.append(zeile);
  if (felderzeile) block.append(felderzeile);
  $('materialwahl').append(block);
  materialZeilen[schluessel] = { zeile: block, anzeigen };
  anzeigen();
}

function materialwahlAufbauen() {
  materialzeileAufbauen('Alle', 'Alle', () => materialAlle ?? materialJeRichtung.N, (wert) => { materialAlle = wert; },
    () => felderAlle ?? felderJeRichtung.N);
  for (const [richtung, name] of Object.entries(RICHTUNGSNAMEN)) {
    materialzeileAufbauen(richtung, name, () => materialJeRichtung[richtung], (wert) => { materialJeRichtung[richtung] = wert; },
      () => felderJeRichtung[richtung]);
  }
  materialzeileAufbauen('Stuetzen', 'Stützen', () => materialStuetzen, (wert) => { materialStuetzen = wert; });
  materialZeilen.Stuetzen.zeile.hidden = true; // erscheint erst, wenn ein Modell mit Stützen geladen ist
  materialzeileAufbauen('Dach', 'Dach', () => materialDach, (wert) => { materialDach = wert; }, null, DACHMATERIALIEN);
  materialZeilen.Dach.zeile.hidden = true; // erscheint erst, wenn ein Modell mit Dach geladen ist
  materialwahlUmschalten();
}

// Je nach Schalter nur die Zeile „Alle“ oder die vier Zeilen je Seite zeigen (die Zeilen „Stützen“ und „Dach“ bleiben)
function materialwahlUmschalten() {
  for (const [schluessel, { zeile }] of Object.entries(materialZeilen)) {
    if (schluessel === 'Stuetzen' || schluessel === 'Dach') continue;
    zeile.hidden = (schluessel === 'Alle') !== materialAlleGleich;
  }
}

$('materialAlleGleich').addEventListener('change', (ereignis) => {
  materialAlleGleich = ereignis.target.checked;
  if (materialAlleGleich && materialAlle === null) materialAlle = materialJeRichtung.N;
  if (materialAlleGleich && felderAlle === null) felderAlle = { ...felderJeRichtung.N }; // Kopie, sonst verstellt „Alle“ die Nordseite mit
  materialZeilen.Alle.anzeigen();
  materialwahlUmschalten();
  fensterAktualisieren();
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

// Felder der gewählten Wände (nur sichtbar, wenn alle gewählten Wände eigenes Material Pfosten-Riegel haben)
const einzelFelder = felderzeileAufbauen(() =>
  [...auswahl].map((w) => felderJeWand.get(w.userData.expressID)).filter(Boolean));
$('einzelZeile').after(einzelFelder);

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
  // Felder nur, wenn alle gewählten Wände selbst Pfosten-Riegel haben
  einzelFelder.hidden = auswahl.size === 0 || eintraege.size !== 1 || [...eintraege][0] !== PFOSTEN_RIEGEL;
  einzelFelder.anzeigen();

  const anzahlEigene = waende.filter((w) => materialJeWand.has(w.userData.expressID)).length;
  $('einzelZuruecksetzen').hidden = anzahlEigene === 0;
  $('einzelZuruecksetzen').textContent = `Einzelne Wände zurücksetzen (${wandText(anzahlEigene)})`;
}

$('einzelMaterial').addEventListener('change', () => {
  const wert = $('einzelMaterial').value;
  for (const wand of auswahl) {
    const id = wand.userData.expressID;
    // Pfosten-Riegel: die Wand startet mit den Feldern ihrer Seite (Kopie), sonst braucht sie keine eigenen
    if (wert === PFOSTEN_RIEGEL && !felderJeWand.has(id)) {
      felderJeWand.set(id, { ...geltendeFelder()[wand.userData.himmelsrichtung ?? 'S'] });
    } else if (wert !== PFOSTEN_RIEGEL) felderJeWand.delete(id);
    if (wert === WIE_DIE_SEITE) materialJeWand.delete(id);
    else materialJeWand.set(id, wert);
  }
  einzelwahlAnzeigen();
  fensterAktualisieren();
});

$('einzelneWaende').addEventListener('change', (ereignis) => {
  einzelneWaende = ereignis.target.checked;
  if (einzelneWaende) einzelneFensterSchalten(false); // nie beide Schalter gleichzeitig
  auswahl.clear();
  szene.hoverBauteil = null;
  einzelwahlAnzeigen();
  allesFaerben();
});

$('einzelZuruecksetzen').addEventListener('click', () => {
  materialJeWand.clear();
  felderJeWand.clear();
  einzelwahlAnzeigen();
  fensterAktualisieren();
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
  // Gesperrt (Seite hat Pfosten-Riegel): Regler grau und nicht bedienbar
  const sperren = (gesperrt) => {
    zeile.classList.toggle('gesperrt', gesperrt);
    for (const schieber of regler.querySelectorAll('input')) schieber.disabled = gesperrt;
  };
  fensterZeilen[schluessel] = { zeile, anzeigen: () => anzeigen.forEach((f) => f()), sperren };
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
  // Seiten mit Pfosten-Riegel sind ganz verglast: dort gibt es keine Fenster zum Verstellen
  const materialien = geltendeMaterialien();
  const glasseite = (richtung) => materialien[richtung] === PFOSTEN_RIEGEL;
  for (const richtung of Object.keys(RICHTUNGSNAMEN)) {
    const anzahl = oeffnungen.filter((oe) => oe.userData.himmelsrichtung === richtung).length;
    $(`fensterAnzahl${richtung}`).textContent = glasseite(richtung) ? 'Pfosten-Riegel' : `${anzahl} Fenster`;
    fensterZeilen[richtung].sperren(glasseite(richtung));
  }
  const alle = oeffnungen.filter((oe) => oe.userData.himmelsrichtung in RICHTUNGSNAMEN).length;
  const alleGlas = Object.keys(RICHTUNGSNAMEN).every(glasseite);
  $('fensterAnzahlAlle').textContent = alleGlas ? 'Pfosten-Riegel' : `${alle} Fenster`;
  fensterZeilen.Alle.sperren(alleGlas);
  // Knopf nur zeigen, wenn irgendwo (auch im Hintergrund) nicht 100 % eingestellt ist
  const groessen = [...Object.values(fensterJeRichtung), ...(fensterAlle ? [fensterAlle] : [])];
  $('fensterZuruecksetzen').hidden = groessen.every((g) => g.breite === 100 && g.hoehe === 100);
}

// ---------- Einzelne Fenster: eigenes Maß in cm für ausgewählte Fenster ----------

const fensterText = (anzahl) => `${anzahl} Fenster`;
const zentimeter = (meter) => Math.round(meter * 100);

// Aktuelle Größe eines Fensters in cm, so wie es gerade gebaut ist.
// Ist es zu (0 %), zählt die gewünschte Größe (so bleibt z. B. die Höhe sichtbar, wenn nur die Breite 0 ist).
function fensterMass(oe) {
  const r = oe.userData.aktuell;
  if (r) return { breite: zentimeter(r.u1 - r.u0), hoehe: zentimeter(r.v1 - r.v0) };
  const soll = oe.userData.soll ?? { breite: 0, hoehe: 0 };
  return { breite: zentimeter(soll.breite), hoehe: zentimeter(soll.hoehe) };
}

function fensterEinzelwahlAnzeigen() {
  $('fensterEinzelwahl').hidden = !einzelneFenster;
  const anzahl = fensterAuswahl.size;
  $('fensterEinzelZaehler').hidden = anzahl === 0;
  $('fensterEinzelZaehler').textContent = `${fensterText(anzahl)} gewählt.`;
  $('fensterEinzelZeile').hidden = anzahl === 0;

  // Gleiche Maße bei allen gewählten Fenstern? Dann stehen sie im Feld, sonst bleibt es leer („verschieden“)
  const masse = [...fensterAuswahl].map(fensterMass);
  for (const [mass, feldId] of [['breite', 'fensterEinzelBreite'], ['hoehe', 'fensterEinzelHoehe']]) {
    const werte = new Set(masse.map((m) => m[mass]));
    const feld = $(feldId);
    if (document.activeElement === feld) continue; // beim Tippen nicht dazwischenfunken
    feld.value = werte.size === 1 ? [...werte][0] : '';
    feld.placeholder = werte.size > 1 ? 'verschieden' : '';
  }

  // Hinweis, wenn ein gewünschtes Maß nicht ganz in die Wand passt
  const begrenzt = [...fensterAuswahl].some((oe) => {
    const eigenes = massJeFenster.get(oe.userData.expressID);
    if (!eigenes || eigenes.breite === 0 || eigenes.hoehe === 0) return false;
    const ist = fensterMass(oe);
    return ist.breite < eigenes.breite - 1 || ist.hoehe < eigenes.hoehe - 1;
  });
  $('fensterEinzelGrenze').hidden = !begrenzt;
  $('fensterEinzelGrenze').textContent =
    'Größer passt hier nicht: 10 cm Abstand zum Wandrand und zu den Nachbaröffnungen bleiben frei.';

  $('fensterEinzelWieSeite').hidden = ![...fensterAuswahl].some((oe) => massJeFenster.has(oe.userData.expressID));

  const anzahlEigene = oeffnungen.filter((oe) => massJeFenster.has(oe.userData.expressID)).length;
  $('fensterEinzelZuruecksetzen').hidden = anzahlEigene === 0;
  $('fensterEinzelZuruecksetzen').textContent = `Einzelne Fenster zurücksetzen (${fensterText(anzahlEigene)})`;
}

// Eingabe in cm übernehmen (beim Bestätigen mit der Eingabetaste, beim Verlassen des Felds oder mit den Pfeilen)
for (const [mass, feldId] of [['breite', 'fensterEinzelBreite'], ['hoehe', 'fensterEinzelHoehe']]) {
  $(feldId).addEventListener('change', () => {
    const feld = $(feldId);
    const wert = Math.round(Number(feld.value));
    if (feld.value.trim() !== '' && Number.isFinite(wert)) {
      const begrenzt = Math.min(2000, Math.max(0, wert));
      for (const oe of fensterAuswahl) {
        // Das andere Maß bleibt, wie das Fenster gerade ist
        const neu = { ...(massJeFenster.get(oe.userData.expressID) ?? fensterMass(oe)) };
        neu[mass] = begrenzt;
        massJeFenster.set(oe.userData.expressID, neu);
      }
    }
    feld.blur(); // damit das Feld danach das tatsächliche Maß zeigt
    fensterAktualisieren();
  });
  $(feldId).addEventListener('keydown', (ereignis) => { if (ereignis.key === 'Enter') $(feldId).blur(); });
}

$('fensterEinzelWieSeite').addEventListener('click', () => {
  for (const oe of fensterAuswahl) massJeFenster.delete(oe.userData.expressID);
  fensterAktualisieren();
});

$('fensterEinzelZuruecksetzen').addEventListener('click', () => {
  massJeFenster.clear();
  fensterAktualisieren();
});

// Schalter ein- oder ausschalten (auch vom Schalter „Einzelne Wände“ aus: nie beide gleichzeitig an)
function einzelneFensterSchalten(an) {
  einzelneFenster = an;
  $('einzelneFenster').checked = an;
  if (an && einzelneWaende) {
    einzelneWaende = false;
    $('einzelneWaende').checked = false;
    auswahl.clear();
    einzelwahlAnzeigen();
  }
  fensterAuswahl.clear();
  szene.hoverBauteil = null;
  fensterEinzelwahlAnzeigen();
  allesFaerben();
}
$('einzelneFenster').addEventListener('change', (ereignis) => einzelneFensterSchalten(ereignis.target.checked));

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
    materialJeRichtung, materialStuetzen, materialDach, materialAlleGleich, materialAlle,
    fensterJeRichtung, fensterAlleGleich, fensterAlle,
    // nur die Wände, die per Klick anders sind als die automatische Erkennung
    wandUmgeschaltet: waende.filter((w) => w.userData.aussen !== w.userData.aussenAuto).map((w) => w.userData.expressID),
    // Wände mit eigenem Material: [Wand-Nummer, Material]
    materialJeWand: [...materialJeWand],
    // Fenster mit eigenem Maß: [Fenster-Nummer, { breite, hoehe } in cm]
    massJeFenster: [...massJeFenster],
    // Pfosten-Riegel: Felder je Seite, für „Alle“ und für einzelne Wände [Wand-Nummer, { breit, hoch }]
    felderJeRichtung, felderAlle, felderJeWand: [...felderJeWand],
    // Farbtöne je Material (nur die, die vom Startton abweichen), Sitzung 18
    farbtoene: farbtoeneSammeln(),
  });
}

// Ältere Varianten: „Klinker anthrazit“, „Holz vergraut“, „Putz sand“, „Fassadenplatten silbergrau“ gibt es nicht mehr
// als eigene Materialien (Sitzung 18).
// Sie werden zum zusammengelegten Material mit dem passenden Farbton (z. B. Klinker + anthrazit;
// der Ton gilt dann für das ganze Material der Variante).
function alteKennungenUmstellen(e) {
  const toene = { ...(e.farbtoene ?? {}) };
  const neu = (id) => {
    const alt = ALTE_KENNUNGEN[id];
    if (!alt) return id;
    toene[alt[0]] ??= alt[1];
    return alt[0];
  };
  const richtungen = Object.fromEntries(Object.entries(e.materialJeRichtung).map(([r, id]) => [r, neu(id)]));
  return {
    ...e,
    materialJeRichtung: richtungen,
    materialAlle: e.materialAlle && neu(e.materialAlle),
    materialStuetzen: neu(e.materialStuetzen),
    materialJeWand: (e.materialJeWand ?? []).map(([w, id]) => [w, neu(id)]),
    farbtoene: toene,
  };
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
    fensterAuswahl.clear();
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
  const e = alteKennungenUmstellen(variante.einstellungen);
  farbtoeneUebernehmen(e.farbtoene); // ältere Varianten: Starttöne
  Object.assign(materialJeRichtung, e.materialJeRichtung);
  materialStuetzen = e.materialStuetzen;
  materialDach = e.materialDach ?? START_DACH; // ältere Varianten: schlicht hell
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
  // Eigenes Maß einzelner Fenster (ältere Varianten haben keins)
  massJeFenster.clear();
  for (const [id, mass] of e.massJeFenster ?? []) massJeFenster.set(id, { ...mass });
  fensterAuswahl.clear();
  // Felder der Pfosten-Riegel-Fassade (ältere Varianten haben keine: Startwerte)
  for (const richtung of Object.keys(RICHTUNGSNAMEN)) {
    felderJeRichtung[richtung] = { ...(e.felderJeRichtung?.[richtung] ?? START_FELDER) };
  }
  felderAlle = e.felderAlle ? { ...e.felderAlle } : materialAlleGleich ? { ...felderJeRichtung.N } : null;
  felderJeWand.clear();
  for (const [id, felder] of e.felderJeWand ?? []) felderJeWand.set(id, { ...felder });

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

// Name des Materials ohne Farbton (alte Kennungen wie „klinker-anthrazit“ → „Klinker“)
function materialName(id) {
  const echteID = ALTE_KENNUNGEN[id]?.[0] ?? id;
  return [...MATERIALIEN, ...DACHMATERIALIEN].find((m) => m.id === echteID)?.name ?? id;
}
// Gespeicherte Farbtöne einer Variante (ältere Varianten: keine = Starttöne)
const toeneVon = (v) => v.einstellungen.farbtoene ?? {};
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
  // Felder der Pfosten-Riegel-Fassade einer Seite (ältere Varianten: Startwerte)
  const felderVon = (v, richtung) => {
    const e = v.einstellungen;
    return (e.materialAlleGleich ? e.felderAlle ?? e.felderJeRichtung?.N : e.felderJeRichtung?.[richtung]) ?? START_FELDER;
  };
  // Musterbild und Name im Farbton der Variante (z. B. „Klinker · anthrazit“)
  const materialFeld = (v, id, felder = null) => {
    const muster = document.createElement('span');
    muster.className = 'muster';
    muster.style.backgroundImage = `url(${musterBild(id, toeneVon(v))})`;
    const text = id === PFOSTEN_RIEGEL && felder ? `${materialName(id)} ${felder.breit} × ${felder.hoch} Felder` : materialText(id, toeneVon(v));
    return [muster, textElement('span', text)];
  };

  zwischentitel('Fassade');
  for (const [richtung, name] of Object.entries(RICHTUNGSNAMEN)) {
    zeile(name, (v) => materialFeld(v, materialVon(v, richtung), felderVon(v, richtung)), 'material');
  }
  if (stuetzen.length > 0) zeile('Stützen', (v) => materialFeld(v, v.einstellungen.materialStuetzen), 'material');
  if (dachteile.length > 0) zeile('Dach', (v) => materialFeld(v, v.einstellungen.materialDach ?? START_DACH), 'material');
  // Einzelne Wände mit eigenem Material: Anzahl je Material (nur, wenn eine der Varianten welche hat)
  if (varianten.some((v) => v.einstellungen.materialJeWand?.length)) {
    zeile('Einzelne Wände', (v) => {
      const anzahlJeMaterial = new Map();
      for (const [, material] of v.einstellungen.materialJeWand ?? []) {
        anzahlJeMaterial.set(material, (anzahlJeMaterial.get(material) ?? 0) + 1);
      }
      if (anzahlJeMaterial.size === 0) return textElement('span', '–');
      return [...anzahlJeMaterial].map(([material, anzahl]) =>
        textElement('span', `${wandText(anzahl)} ${materialText(material, toeneVon(v))}`));
    }, 'einzeln');
  }

  zwischentitel('Fenster');
  for (const [richtung, name] of Object.entries(RICHTUNGSNAMEN)) {
    zeile(name, (v) => {
      if (materialVon(v, richtung) === PFOSTEN_RIEGEL) return textElement('span', 'ganz verglast (Pfosten-Riegel)');
      const { breite, hoehe } = fensterVon(v, richtung);
      return textElement('span', breite === 0 || hoehe === 0 ? 'zu (0 %)' : `Breite ${breite} % · Höhe ${hoehe} %`);
    });
  }
  // Fenster mit eigenem Maß: Anzahl je Maß (nur, wenn eine der Varianten welche hat)
  if (varianten.some((v) => v.einstellungen.massJeFenster?.length)) {
    zeile('Einzelne Fenster', (v) => {
      const anzahlJeMass = new Map();
      for (const [, { breite, hoehe }] of v.einstellungen.massJeFenster ?? []) {
        const text = breite === 0 || hoehe === 0 ? 'zu' : `${breite} × ${hoehe} cm`;
        anzahlJeMass.set(text, (anzahlJeMass.get(text) ?? 0) + 1);
      }
      if (anzahlJeMass.size === 0) return textElement('span', '–');
      return [...anzahlJeMass].map(([text, anzahl]) => textElement('span', `${fensterText(anzahl)} ${text}`));
    }, 'einzeln');
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
    anbauteileZuordnen(gruppe, waende);
    stuetzen = stuetzenVorbereiten(gruppe);
    dachteile = dachVorbereiten(gruppe);
    // Eigenes Material einzelner Wände gehört zum alten Modell
    materialJeWand.clear();
    auswahl.clear();
    einzelwahlAnzeigen();
    felderJeWand.clear();
    // Ebenso das eigene Maß einzelner Fenster
    massJeFenster.clear();
    fensterAuswahl.clear();
    szene.zeigeModell(gruppe);
    fensterAktualisieren();
    aussenwaendeAnzeigen();
    modellKennung = `${datei.name} · ${anzahl.wand} Wände`;
    modellName = datei.name;
    variantenAnzeigen();
    anleitungZeigen(false);
    $('anleitungOeffnen').hidden = false;
    $('legende').hidden = false;
    $('stilwahl').hidden = false;
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

// ---------- Umschalter „Zeichnung | Realistisch“ im 3D-Fenster ----------
// Nur fürs Anschauen: Bilder, Vergleich und PDF bleiben immer im Zeichenstil, die Wahl wird nicht mit der Variante gespeichert.
for (const knopf of $('stilwahl').querySelectorAll('button')) {
  knopf.addEventListener('click', () => {
    szene.realistisch = knopf.dataset.stil === 'realistisch';
    for (const k of $('stilwahl').querySelectorAll('button')) k.setAttribute('aria-pressed', String(k === knopf));
  });
}

function statusZeigen(text, istFehler = false) {
  const status = $('status');
  status.textContent = text; // textContent: Dateinamen werden nie als HTML gelesen
  status.classList.toggle('fehler', istFehler);
}
