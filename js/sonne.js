// Sonnenstand (Sitzung 15): Wo steht die Sonne an einem Datum, zu einer deutschen Uhrzeit, an einem Ort?
// Rechnung nach der vereinfachten Formel des US-Wetterdienstes (genau auf ca. 1°, für Schattenstudien reicht das).
// Ergebnis: azimut = Himmelsrichtung in Grad (0 = Nord, 90 = Ost, 180 = Süd, im Uhrzeigersinn),
//           hoehe   = Grad über dem Horizont (unter 0 = Sonne untergegangen).

export const START_SONNE = { datum: '2026-03-21', minuten: 12 * 60, breite: 53.14, laenge: 8.21 }; // Oldenburg

const GRAD = Math.PI / 180;

// Unterschied der deutschen Uhrzeit zur Weltzeit (UTC) in Minuten: 60 im Winter (MEZ), 120 im Sommer (MESZ)
function deutscherVersatz(utcMs) {
  const teile = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin', hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
  }).formatToParts(new Date(utcMs)).map((t) => [t.type, Number(t.value)]));
  const alsOrtszeit = Date.UTC(teile.year, teile.month - 1, teile.day, teile.hour, teile.minute);
  return Math.round((alsOrtszeit - Math.floor(utcMs / 60000) * 60000) / 60000);
}

// Deutsche Uhrzeit („2026-06-21“, 900 Minuten = 15:00) → Weltzeit in Millisekunden und MEZ/MESZ
export function weltzeit(datum, minuten) {
  const [j, m, t] = datum.split('-').map(Number);
  const ortszeit = Date.UTC(j, m - 1, t, 0, minuten);
  let versatz = deutscherVersatz(ortszeit - 60 * 60000);
  versatz = deutscherVersatz(ortszeit - versatz * 60000);
  return { ms: ortszeit - versatz * 60000, zone: versatz === 120 ? 'MESZ' : 'MEZ' };
}

export function sonnenstand({ datum, minuten, breite, laenge }) {
  const n = weltzeit(datum, minuten).ms / 86400000 + 2440587.5 - 2451545.0; // Tage seit dem 1.1.2000, 12 Uhr
  const mittlereLaenge = 280.460 + 0.9856474 * n;
  const anomalie = (357.528 + 0.9856003 * n) * GRAD;
  const ekliptik = (mittlereLaenge + 1.915 * Math.sin(anomalie) + 0.020 * Math.sin(2 * anomalie)) * GRAD;
  const neigung = (23.439 - 0.0000004 * n) * GRAD;
  const rektaszension = Math.atan2(Math.cos(neigung) * Math.sin(ekliptik), Math.cos(ekliptik));
  const deklination = Math.asin(Math.sin(neigung) * Math.sin(ekliptik));
  const sternzeit = ((18.697374558 + 24.06570982441908 * n) % 24) * 15 * GRAD + laenge * GRAD;
  const stundenwinkel = sternzeit - rektaszension;
  const phi = breite * GRAD;
  const hoehe = Math.asin(Math.sin(phi) * Math.sin(deklination) + Math.cos(phi) * Math.cos(deklination) * Math.cos(stundenwinkel));
  const azimut = Math.atan2(
    -Math.sin(stundenwinkel) * Math.cos(deklination),
    Math.sin(deklination) * Math.cos(phi) - Math.cos(deklination) * Math.sin(phi) * Math.cos(stundenwinkel),
  );
  return { azimut: ((azimut / GRAD) + 360) % 360, hoehe: hoehe / GRAD };
}

const HIMMELSRICHTUNGEN = ['Norden', 'Nordnordosten', 'Nordosten', 'Ostnordosten', 'Osten', 'Ostsüdosten', 'Südosten', 'Südsüdosten',
  'Süden', 'Südsüdwesten', 'Südwesten', 'Westsüdwesten', 'Westen', 'Westnordwesten', 'Nordwesten', 'Nordnordwesten'];
export const himmelsrichtung = (azimut) => HIMMELSRICHTUNGEN[Math.round(azimut / 22.5) % 16];

export const uhrzeitText = (minuten) =>
  `${String(Math.floor(minuten / 60)).padStart(2, '0')}:${String(minuten % 60).padStart(2, '0')}`;

const zahl = (wert) => wert.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const ortText = ({ breite, laenge }) =>
  `${zahl(Math.abs(breite))}° ${breite >= 0 ? 'N' : 'S'}, ${zahl(Math.abs(laenge))}° ${laenge >= 0 ? 'O' : 'W'}`;

// „21.6.2026, 15:00 Uhr (MESZ)“
export function zeitText({ datum, minuten }) {
  const [j, m, t] = datum.split('-').map(Number);
  return `${t}.${m}.${j}, ${uhrzeitText(minuten)} Uhr (${weltzeit(datum, minuten).zone})`;
}
