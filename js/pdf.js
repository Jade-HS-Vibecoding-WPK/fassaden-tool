// PDF-Übersichtsseite: 1 bis 4 Varianten nebeneinander auf A3 quer, wird direkt als Datei gespeichert.
// Die Bibliothek jsPDF wird erst beim ersten Klick aus dem Internet geladen (die App startet dadurch nicht langsamer).
const JSPDF_ADRESSE = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';

// Blatt und Abstände in Millimetern
const BLATT_B = 420;
const BLATT_H = 297;
const RAND = 15;
const SPALTENABSTAND = 10;
const BILDABSTAND = 2;
const ZEILE = 5.2; // Höhe einer Tabellenzeile

// Farben wie in der App (style.css)
const TEXT = [17, 17, 17];
const LEISE = [107, 107, 107];
const LINIE = [226, 226, 226];
const AKZENT = [31, 58, 104];

const RICHTUNGSNAMEN = { N: 'Nord', O: 'Ost', S: 'Süd', W: 'West' };

let bibliothek = null;
function bibliothekLaden() {
  if (window.jspdf) return Promise.resolve(window.jspdf.jsPDF);
  bibliothek ??= new Promise((fertig, fehler) => {
    const skript = document.createElement('script');
    skript.src = JSPDF_ADRESSE;
    skript.onload = () => fertig(window.jspdf.jsPDF);
    skript.onerror = () => {
      bibliothek = null;
      skript.remove();
      fehler(new Error('Die PDF-Bibliothek konnte nicht geladen werden. Besteht eine Internetverbindung?'));
    };
    document.head.append(skript);
  });
  return bibliothek;
}

const quadratmeter = (wert) => wert.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const anteilText = ({ fassade, fenster }) => (fassade > 0 ? `${Math.round((fenster / fassade) * 100)} %` : '–');

// Text auf eine Breite kürzen (mit „…“), damit nichts in die Nachbarspalte läuft
function gekuerzt(doc, text, breite) {
  if (doc.getTextWidth(text) <= breite) return text;
  while (text.length > 1 && doc.getTextWidth(`${text}…`) > breite) text = text.slice(0, -1);
  return `${text.trimEnd()}…`;
}

// Die drei möglichen Anordnungen der 5 Bilder in einer Spalte. p = Breite der Perspektive.
// Liefert Lage aller Bilder (relativ zur Spalte) und den Platzbedarf.
const g = BILDABSTAND;
const ANORDNUNGEN = {
  // Perspektive links, Ansichten 2 × 2 rechts daneben (bei 1 Variante)
  daneben(p) {
    const h = (p * 2) / 3;
    const ah = (h - g) / 2, ab = ah * 1.5;
    const x0 = p + g;
    return {
      breite: x0 + 2 * ab + g, hoehe: h, perspektive: [0, 0, p, h],
      ansichten: [[x0, 0], [x0 + ab + g, 0], [x0, ah + g], [x0 + ab + g, ah + g]].map(([x, y]) => [x, y, ab, ah]),
    };
  },
  // Perspektive oben, Ansichten in einer Reihe darunter
  reihe(p) {
    const h = (p * 2) / 3;
    const ab = (p - 3 * g) / 4, ah = (ab * 2) / 3;
    return {
      breite: p, hoehe: h + g + ah, perspektive: [0, 0, p, h],
      ansichten: [0, 1, 2, 3].map((i) => [i * (ab + g), h + g, ab, ah]),
    };
  },
  // Perspektive oben, Ansichten 2 × 2 darunter
  raster(p) {
    const h = (p * 2) / 3;
    const ab = (p - g) / 2, ah = (ab * 2) / 3;
    return {
      breite: p, hoehe: h + g + 2 * ah + g, perspektive: [0, 0, p, h],
      ansichten: [[0, 0], [ab + g, 0], [0, ah + g], [ab + g, ah + g]].map(([x, y]) => [x, y + h + g, ab, ah]),
    };
  },
};

// Die Anordnung wählen, bei der die Bilder zusammen am meisten Fläche bekommen (Ansichten zählen doppelt)
function bilderAnordnen(spaltenBreite, hoeheFrei) {
  let beste = null;
  for (const anordnen of Object.values(ANORDNUNGEN)) {
    let p = spaltenBreite;
    let lage = anordnen(p);
    while (p > 20 && (lage.breite > spaltenBreite || lage.hoehe > hoeheFrei)) lage = anordnen((p -= 0.5));
    const [, , ab, ah] = lage.ansichten[0];
    const flaeche = p * ((p * 2) / 3) + 2 * 4 * ab * ah;
    if (!beste || flaeche > beste.flaeche) beste = { ...lage, flaeche };
  }
  return beste;
}

// Eine Tabelle zeichnen: Zwischentitel und Zeilen; gibt die Unterkante zurück
function abschnitt(doc, titel, x, y, breite, zeilen) {
  doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...AKZENT);
  doc.text(titel.toUpperCase(), x, y + 3, { charSpace: 0.35 });
  y += 5.5;
  for (const zeichnen of zeilen) {
    zeichnen(y);
    y += ZEILE;
  }
  return y;
}

// Eine Zeile mit dünner Linie oben und Beschriftung links
function zeilenkopf(doc, x, y, breite, beschriftung, kraeftig = false) {
  doc.setDrawColor(...(kraeftig ? TEXT : LINIE)).setLineWidth(kraeftig ? 0.25 : 0.2);
  doc.line(x, y, x + breite, y);
  doc.setFont('helvetica', kraeftig ? 'bold' : 'normal').setFontSize(8).setTextColor(...(kraeftig ? TEXT : LEISE));
  doc.text(beschriftung, x, y + 3.7);
}

const LABEL = 14; // Breite der Beschriftungsspalte in den Tabellen

function tabelleKennwerte(doc, v, x, y, breite) {
  const spalte = (breite - LABEL) / 3;
  const rechts = (i) => x + LABEL + (i + 1) * spalte;
  const zeilen = [(zy) => {
    doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(...LEISE);
    ['Fassade m²', 'Fenster m²', 'Anteil'].forEach((t, i) => doc.text(t, rechts(i), zy + 3.4, { align: 'right' }));
  }];
  for (const [schluessel, name] of [...Object.entries(RICHTUNGSNAMEN), ['gesamt', 'Gesamt']]) {
    const gesamt = schluessel === 'gesamt';
    zeilen.push((zy) => {
      zeilenkopf(doc, x, zy, breite, name, gesamt);
      const k = v.kennwerte[schluessel];
      doc.setFont('helvetica', gesamt ? 'bold' : 'normal').setFontSize(8.5).setTextColor(...TEXT);
      [quadratmeter(k.fassade), quadratmeter(k.fenster), anteilText(k)].forEach((t, i) => doc.text(t, rechts(i), zy + 3.7, { align: 'right' }));
    });
  }
  return abschnitt(doc, 'Kennwerte', x, y, breite, zeilen);
}

// Höhe der Kennwerte-Tabelle (Spaltenköpfe + N/O/S/W + Gesamt, so wie abschnitt() sie zeichnet)
const KENNWERTE_HOEHE = 5.5 + 6 * ZEILE;

// Ein Bild (JPEG aus der Variante) mit dünnem Rahmen und kleinem Kennzeichen oben links
function bild(doc, daten, alias, [x, y, b, h], kennzeichen) {
  doc.addImage(daten, 'JPEG', x, y, b, h, alias);
  doc.setDrawColor(...LINIE).setLineWidth(0.2).rect(x, y, b, h);
  if (!kennzeichen) return;
  doc.setFont('helvetica', 'bold').setFontSize(6.5);
  const tb = doc.getTextWidth(kennzeichen) + 2.4;
  doc.setFillColor(255, 255, 255).rect(x + 0.2, y + 0.2, tb, 3.8, 'F');
  doc.setTextColor(...TEXT).text(kennzeichen, x + 1.4, y + 3);
}

/**
 * Baut die Übersichtsseite und liefert das fertige PDF-Dokument (zum Speichern: doc.save(name)).
 * varianten: 1–4 gespeicherte Varianten (älteste zuerst); modellName: Dateiname der IFC;
 * standort: Text oder leer; mitKennwerte: Tabelle „Kennwerte“ zeigen (sonst nur Bilder);
 * kennzeichen(variante, richtung): Beschriftung einer Ansicht, z. B. „N“ oder „N (NNW)“;
 * blickText(variante): Beschriftung der Perspektive, z. B. „Perspektive aus Südosten, 15°“
 */
export async function pdfErstellen({ varianten, modellName, standort, kennzeichen, blickText, sonnenText = () => null, mitKennwerte = true }) {
  // Sonne (Sitzung 15): Hat eine Variante Schatten, bekommt jede Spalte eine Zeile „Schatten: …“ unter dem Datum
  const mitSonne = varianten.some((v) => sonnenText(v));
  const JsPdf = await bibliothekLaden();
  const doc = new JsPdf({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const heute = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setProperties({ title: `Variantenvergleich – ${modellName}`, creator: 'Fassaden-Tool' });

  // ---------- Kopf ----------
  const titel = varianten.length === 1 ? 'Fassadenvariante' : 'Variantenvergleich';
  doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(...TEXT);
  doc.text(titel, RAND, RAND + 7);
  const angaben = [`Modell: ${modellName}`, standort ? `Standort: ${standort}` : null, `Stand: ${heute}`].filter(Boolean);
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...LEISE);
  doc.text(gekuerzt(doc, angaben.join('   ·   '), BLATT_B - 2 * RAND - 40), RAND, RAND + 14);
  doc.setFontSize(8).text('Fassaden-Tool', BLATT_B - RAND, RAND + 14, { align: 'right' });
  doc.setDrawColor(...TEXT).setLineWidth(0.35).line(RAND, RAND + 20, BLATT_B - RAND, RAND + 20);

  // ---------- Fuß ----------
  const fussY = BLATT_H - 9;
  doc.setDrawColor(...LINIE).setLineWidth(0.2).line(RAND, fussY - 4, BLATT_B - RAND, fussY - 4);
  doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(...LEISE);
  doc.text((mitKennwerte ? 'Flächen in m², Rohbaumaße. Fassade = Außenseite der Außenwände mit allen Öffnungen. '
    + 'Fenster = Fensteröffnungen und Glastüren. Anteil = Fenster ÷ Fassade. ' : '')
    + 'Ansichten als Parallelprojektion. Blickhöhe der Perspektive in Grad über der Waagerechten. Norden ist im Plan oben.', RAND, fussY);
  if (mitSonne) doc.text('Schatten: Sonnenstand zu Datum und deutscher Uhrzeit am angegebenen Ort (Breite/Länge).', RAND, fussY + 3.3);

  // ---------- Spalten, eine je Variante ----------
  const n = varianten.length;
  const spaltenBreite = (BLATT_B - 2 * RAND - (n - 1) * SPALTENABSTAND) / n;
  const oben = RAND + 27;
  const unten = fussY - 9;
  const kopfHoehe = mitSonne ? 19.5 : 15;

  // Kennwerte: bei 1 Variante rechts neben den Bildern, sonst unter den Bildern
  // (Material und Fenstergrößen stehen bewusst nicht auf dem Blatt, die Bilder zeigen sie)
  const tabelleRechts = mitKennwerte && n === 1;
  const TABELLE_B = Math.min(spaltenBreite, 110); // Breite der Kennwerte-Tabelle
  const lage = bilderAnordnen(tabelleRechts ? spaltenBreite - TABELLE_B - 12 : spaltenBreite,
    unten - oben - kopfHoehe - (tabelleRechts || !mitKennwerte ? 0 : 7 + KENNWERTE_HOEHE));

  for (const [i, v] of varianten.entries()) {
    const x = RAND + i * (spaltenBreite + SPALTENABSTAND);
    let y = oben;

    // Name und Datum
    doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...TEXT);
    doc.text(gekuerzt(doc, v.name, spaltenBreite), x, y + 4.5);
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(...LEISE);
    doc.text(new Date(v.datum).toLocaleString('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }), x, y + 9.5);
    if (mitSonne) doc.text(gekuerzt(doc, `Schatten: ${sonnenText(v) ?? 'ohne'}`, spaltenBreite), x, y + 14);
    const linieY = y + kopfHoehe - 3;
    doc.setDrawColor(...TEXT).setLineWidth(0.25).line(x, linieY, x + spaltenBreite, linieY);
    y += kopfHoehe;

    // Bilder
    const verschoben = ([bx, by, b, h]) => [x + bx, y + by, b, h];
    bild(doc, new Uint8Array(await v.bilder.perspektive.arrayBuffer()), `v${v.id}-p`, verschoben(lage.perspektive), blickText(v));
    for (const [j, richtung] of Object.keys(RICHTUNGSNAMEN).entries()) {
      bild(doc, new Uint8Array(await v.bilder[richtung].arrayBuffer()), `v${v.id}-${richtung}`, verschoben(lage.ansichten[j]), kennzeichen(v, richtung));
    }
    y += lage.hoehe + 7;

    // Kennwerte
    if (!mitKennwerte) continue;
    if (tabelleRechts) tabelleKennwerte(doc, v, x + spaltenBreite - TABELLE_B, oben + kopfHoehe, TABELLE_B);
    else tabelleKennwerte(doc, v, x, y, TABELLE_B);
  }
  return doc;
}

// Dateiname wie „Variantenvergleich_Entwurf_2026-11-17.pdf“ (ohne Zeichen, die Windows nicht mag)
export function pdfDateiname(modellName, anzahl) {
  const basis = modellName.replace(/\.ifc$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim() || 'Modell';
  const datum = new Date().toLocaleDateString('sv-SE'); // ergibt 2026-11-17
  return `${anzahl === 1 ? 'Fassadenvariante' : 'Variantenvergleich'}_${basis}_${datum}.pdf`;
}
