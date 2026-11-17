// Bedienoberfläche: Datei wählen oder hineinziehen, Modell anzeigen, Fassade gestalten
import { Szene } from './szene.js';
import { ifcLaden } from './ifc.js';
import { aussenwaendeErkennen, wandFaerben, oeffnungenZuordnen, fensterAnpassen, stuetzenVorbereiten, stuetzeFaerben, kennwerteBerechnen } from './fassade.js';
import { MATERIALIEN, START_MATERIAL, musterBild } from './materialien.js';
import { variantenLesen, varianteSpeichern, varianteLoeschen } from './varianten.js';

const $ = (id) => document.getElementById(id);
const ansicht = $('ansicht');
const szene = new Szene(ansicht);

let waende = []; // alle Wände des geladenen Modells
let oeffnungen = []; // alle Fenster und Türen
let stuetzen = []; // alle Stützen
let modellKennung = null; // Dateiname + Anzahl Wände: zu welchem Modell eine Variante gehört

// Gewähltes Fassadenmaterial je Himmelsrichtung
const RICHTUNGSNAMEN = { N: 'Nord', O: 'Ost', S: 'Süd', W: 'West' };
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

function allesFaerben() {
  const materialien = geltendeMaterialien();
  for (const wand of waende) wandFaerben(wand, materialien, wand === szene.hoverBauteil);
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

// Wände anfahren (hervorheben) und anklicken (außen ↔ innen umschalten)
szene.istAnklickbar = (bauteil) => bauteil.userData.art === 'wand';
szene.beiHover = () => allesFaerben();
szene.beiKlick = (wand) => {
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
});
materialwahlAufbauen();

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

// ---------- Varianten: speichern, auflisten, laden, löschen ----------

// Alle Einstellungen als reine Daten (Kopien, damit spätere Änderungen die Variante nicht verstellen)
function einstellungenSammeln() {
  return structuredClone({
    materialJeRichtung, materialStuetzen, materialAlleGleich, materialAlle,
    fensterJeRichtung, fensterAlleGleich, fensterAlle,
    // nur die Wände, die per Klick anders sind als die automatische Erkennung
    wandUmgeschaltet: waende.filter((w) => w.userData.aussen !== w.userData.aussenAuto).map((w) => w.userData.expressID),
  });
}

$('varianteSpeichern').addEventListener('click', async () => {
  const knopf = $('varianteSpeichern');
  const name = $('variantenName').value.trim() || $('variantenName').placeholder || 'Variante';
  knopf.disabled = true;
  variantenStatus('Bilder werden aufgenommen …');
  try {
    // Ohne blauen Hover-Schimmer fotografieren
    szene.hoverBauteil = null;
    allesFaerben();
    const bilder = await szene.bilderAufnehmen();
    await varianteSpeichern({
      modell: modellKennung, name, datum: Date.now(),
      einstellungen: einstellungenSammeln(), kennwerte: kennwerteMitGesamt(), bilder,
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

  $('materialAlleGleich').checked = materialAlleGleich;
  $('fensterAlleGleich').checked = fensterAlleGleich;
  for (const { anzeigen } of Object.values(materialZeilen)) anzeigen();
  for (const { anzeigen } of Object.values(fensterZeilen)) anzeigen();
  materialwahlUmschalten();
  fensterwahlUmschalten();
  fensterAktualisieren();
  aussenwaendeAnzeigen();
  variantenStatus(`„${variante.name}“ ist geladen.`);
}

let bildAdressen = []; // Vorschaubilder der Liste, werden beim Neuzeichnen freigegeben
async function variantenAnzeigen() {
  $('bereichVarianten').hidden = waende.length === 0;
  const varianten = await variantenLesen(modellKennung);
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

    text.append(name, angaben, knoepfe);
    eintrag.append(bild, text);
    liste.append(eintrag);
  }
}

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
  try {
    const { gruppe, anzahl } = await ifcLaden(datei);
    waende = aussenwaendeErkennen(gruppe);
    oeffnungen = oeffnungenZuordnen(gruppe, waende);
    stuetzen = stuetzenVorbereiten(gruppe);
    szene.zeigeModell(gruppe);
    fensterAktualisieren();
    aussenwaendeAnzeigen();
    modellKennung = `${datei.name} · ${anzahl.wand} Wände`;
    variantenAnzeigen();
    $('leerHinweis').hidden = true;
    $('legende').hidden = false;
    statusZeigen(
      `${datei.name}\n` +
      `${anzahl.wand} Wände · ${anzahl.fenster} Fenster · ${anzahl.tuer} Türen · ${anzahl.stuetze ? `${anzahl.stuetze} Stützen · ` : ''}${anzahl.dach} Dachteile · ${anzahl.rest} weitere Bauteile`
    );
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
