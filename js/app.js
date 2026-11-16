// Bedienoberfläche: Datei wählen oder hineinziehen, Modell anzeigen, Fassade gestalten
import { Szene } from './szene.js';
import { ifcLaden } from './ifc.js';
import { aussenwaendeErkennen, wandFaerben, oeffnungenZuordnen, fensterAnpassen } from './fassade.js';
import { MATERIALIEN, START_MATERIAL, musterBild } from './materialien.js';

const $ = (id) => document.getElementById(id);
const ansicht = $('ansicht');
const szene = new Szene(ansicht);

let waende = []; // alle Wände des geladenen Modells
let oeffnungen = []; // alle Fenster und Türen

// Gewähltes Fassadenmaterial je Himmelsrichtung
const RICHTUNGSNAMEN = { N: 'Nord', O: 'Ost', S: 'Süd', W: 'West' };
const materialJeRichtung = { N: START_MATERIAL, O: START_MATERIAL, S: START_MATERIAL, W: START_MATERIAL };

// Fenstergröße je Himmelsrichtung in % der Größe aus der IFC
const fensterJeRichtung = {};
for (const richtung of Object.keys(RICHTUNGSNAMEN)) fensterJeRichtung[richtung] = { breite: 100, hoehe: 100 };

function alleWaendeFaerben() {
  for (const wand of waende) wandFaerben(wand, materialJeRichtung, wand === szene.hoverBauteil);
}

// Fenster neu einpassen (z. B. nach Reglerbewegung oder wenn eine Wand umgeschaltet wurde)
function fensterAktualisieren() {
  fensterAnpassen(waende, oeffnungen, fensterJeRichtung);
  alleWaendeFaerben();
  fensterAnzeigen();
}

// Wände anfahren (hervorheben) und anklicken (außen ↔ innen umschalten)
szene.istAnklickbar = (bauteil) => bauteil.userData.art === 'wand';
szene.beiHover = () => alleWaendeFaerben();
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

  // Anzahl der Außenwände je Himmelsrichtung
  for (const richtung of Object.keys(RICHTUNGSNAMEN)) {
    const anzahl = waende.filter((w) => w.userData.aussen && w.userData.himmelsrichtung === richtung).length;
    $(`anzahl${richtung}`).textContent = anzahl === 1 ? '1 Wand' : `${anzahl} Wände`;
  }
}

// Je Himmelsrichtung eine Zeile: Name, Musterbild, Auswahlliste
function materialwahlAufbauen() {
  for (const [richtung, name] of Object.entries(RICHTUNGSNAMEN)) {
    const zeile = document.createElement('label');
    zeile.className = 'materialzeile';

    const titel = document.createElement('span');
    titel.textContent = name;
    const anzahl = document.createElement('small');
    anzahl.id = `anzahl${richtung}`;
    titel.append(anzahl);

    const muster = document.createElement('span');
    muster.className = 'muster';

    const liste = document.createElement('select');
    for (const m of MATERIALIEN) liste.add(new Option(m.name, m.id));
    liste.value = materialJeRichtung[richtung];

    const musterZeigen = () => { muster.style.backgroundImage = `url(${musterBild(liste.value)})`; };
    liste.addEventListener('change', () => {
      materialJeRichtung[richtung] = liste.value;
      musterZeigen();
      alleWaendeFaerben();
    });
    musterZeigen();

    zeile.append(titel, muster, liste);
    $('materialwahl').append(zeile);
  }
}
materialwahlAufbauen();

// Je Himmelsrichtung eine Zeile: Name mit Anzahl der Fenster, Regler für Breite und Höhe
const fensterRegler = []; // zum Zurücksetzen
function fensterwahlAufbauen() {
  let geplant = false;
  const spaeterAktualisieren = () => {
    // Beim Ziehen am Regler höchstens einmal pro Bild neu bauen
    if (geplant) return;
    geplant = true;
    requestAnimationFrame(() => { geplant = false; fensterAktualisieren(); });
  };

  for (const [richtung, name] of Object.entries(RICHTUNGSNAMEN)) {
    const zeile = document.createElement('div');
    zeile.className = 'fensterzeile';

    const titel = document.createElement('span');
    titel.textContent = name;
    const anzahl = document.createElement('small');
    anzahl.id = `fensterAnzahl${richtung}`;
    titel.append(anzahl);

    const regler = document.createElement('div');
    regler.className = 'regler';
    for (const [mass, beschriftung] of [['breite', 'Breite'], ['hoehe', 'Höhe']]) {
      const zeileRegler = document.createElement('label');
      const schieber = document.createElement('input');
      Object.assign(schieber, { type: 'range', min: 0, max: 200, step: 5, value: fensterJeRichtung[richtung][mass] });
      schieber.setAttribute('aria-label', `${beschriftung} der Fenster ${name}`);
      const wert = document.createElement('output');
      const wertZeigen = () => { wert.textContent = `${schieber.value} %`; };
      schieber.addEventListener('input', () => {
        fensterJeRichtung[richtung][mass] = Number(schieber.value);
        wertZeigen();
        spaeterAktualisieren();
      });
      wertZeigen();
      fensterRegler.push({ schieber, wertZeigen });
      zeileRegler.append(beschriftung, schieber, wert);
      regler.append(zeileRegler);
    }

    zeile.append(titel, regler);
    $('fensterwahl').append(zeile);
  }
}
fensterwahlAufbauen();

$('fensterZuruecksetzen').addEventListener('click', () => {
  for (const richtung of Object.keys(fensterJeRichtung)) fensterJeRichtung[richtung] = { breite: 100, hoehe: 100 };
  for (const { schieber, wertZeigen } of fensterRegler) { schieber.value = 100; wertZeigen(); }
  fensterAktualisieren();
});

function fensterAnzeigen() {
  $('bereichFenster').hidden = waende.length === 0;
  for (const richtung of Object.keys(RICHTUNGSNAMEN)) {
    const anzahl = oeffnungen.filter((oe) => oe.userData.himmelsrichtung === richtung).length;
    $(`fensterAnzahl${richtung}`).textContent = `${anzahl} Fenster`;
  }
  $('fensterZuruecksetzen').hidden = Object.values(fensterJeRichtung).every((g) => g.breite === 100 && g.hoehe === 100);
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
    szene.zeigeModell(gruppe);
    fensterAktualisieren();
    aussenwaendeAnzeigen();
    $('leerHinweis').hidden = true;
    $('legende').hidden = false;
    statusZeigen(
      `${datei.name}\n` +
      `${anzahl.wand} Wände · ${anzahl.fenster} Fenster · ${anzahl.tuer} Türen · ${anzahl.dach} Dachteile · ${anzahl.rest} weitere Bauteile`
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
