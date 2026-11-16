// Bedienoberfläche: Datei wählen oder hineinziehen, Modell anzeigen
import { Szene } from './szene.js';
import { ifcLaden } from './ifc.js';
import { aussenwaendeErkennen, wandFaerben } from './fassade.js';

const $ = (id) => document.getElementById(id);
const ansicht = $('ansicht');
const szene = new Szene(ansicht);

let waende = []; // alle Wände des geladenen Modells

// Wände anfahren (hervorheben) und anklicken (außen ↔ innen umschalten)
szene.istAnklickbar = (bauteil) => bauteil.userData.art === 'wand';
szene.beiHover = (bauteil) => {
  for (const wand of waende) wandFaerben(wand, wand === bauteil);
};
szene.beiKlick = (wand) => {
  wand.userData.aussen = !wand.userData.aussen;
  wandFaerben(wand, true);
  aussenwaendeAnzeigen();
};

$('erkennungZuruecksetzen').addEventListener('click', () => {
  for (const wand of waende) {
    wand.userData.aussen = wand.userData.aussenAuto;
    wandFaerben(wand);
  }
  aussenwaendeAnzeigen();
});

function aussenwaendeAnzeigen() {
  const aussen = waende.filter((w) => w.userData.aussen).length;
  $('aussenZaehler').textContent = `${aussen} von ${waende.length} Wänden sind Außenwände`;
  $('erkennungZuruecksetzen').hidden = waende.every((w) => w.userData.aussen === w.userData.aussenAuto);
  $('bereichAussenwaende').hidden = waende.length === 0;
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
    szene.zeigeModell(gruppe);
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
