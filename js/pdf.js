// PDF-Übersichtsseite: 1 bis 4 Varianten nebeneinander, Blatt immer quer (A4 bis A0, Sitzung 23f; vorher fest A3), wird direkt als Datei gespeichert.
// Auf Wunsch folgt danach je Variante eine eigene Seite (Sitzung 19).
// Seit Sitzung 23i wählbar: Seiten (je Variante / Vergleich / beides) und Bilder (alle / nur Ansichten / nur Perspektive).
// Seit Sitzung 20c: Ansichten maßstäblich, keine Schrift außer Kennzeichen, Maßstab und (auf Wunsch) Kennwerte.
// Seit Sitzung 20g: Schriftart Source Sans 3 (Light, für Hervorhebungen Semibold) statt Helvetica.
// Die Bibliothek jsPDF wird erst beim ersten Klick aus dem Internet geladen (die App startet dadurch nicht langsamer).
const JSPDF_ADRESSE = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js';

// Blattgrößen quer in Millimetern (Sitzung 23f), kleinste zuerst; Abstände ebenfalls in Millimetern
export const BLATTGROESSEN = {
  a4: { name: 'A4', b: 297, h: 210 },
  a3: { name: 'A3', b: 420, h: 297 },
  a2: { name: 'A2', b: 594, h: 420 },
  a1: { name: 'A1', b: 841, h: 594 },
  a0: { name: 'A0', b: 1189, h: 841 },
};
const RAND = 15;
const SPALTENABSTAND = 10;
const ZEILE = 5.2; // Höhe einer Tabellenzeile

// Farben wie in der App (style.css)
const TEXT = [17, 17, 17];
const LEISE = [107, 107, 107];
const LINIE = [226, 226, 226];
const AKZENT = [31, 58, 104];

const RICHTUNGSNAMEN = { N: 'Nord', O: 'Ost', S: 'Süd', W: 'West' };

// ---------- Schrift (Sitzung 20g): Source Sans 3, frei unter SIL Open Font License (siehe schriften/LICENSE.md) ----------
// jsPDF kennt nur Helvetica & Co. Eigene Schriften müssen als TTF ins PDF eingebettet werden (dann klappen auch Umlaute).
// Die Dateien werden erst beim ersten PDF geladen. Klappt das nicht, nimmt das PDF Helvetica.
const SCHRIFTDATEIEN = {
  normal: new URL('../schriften/SourceSans3-Light.ttf', import.meta.url),
  bold: new URL('../schriften/SourceSans3-Semibold.ttf', import.meta.url),
};
let schriftDaten = null; // Promise → { normal: base64, bold: base64 } oder null
function schriftLaden() {
  schriftDaten ??= Promise.all(Object.entries(SCHRIFTDATEIEN).map(async ([stil, adresse]) => {
    const antwort = await fetch(adresse);
    if (!antwort.ok) throw new Error(`Schrift fehlt: ${adresse}`);
    const bytes = new Uint8Array(await antwort.arrayBuffer());
    let text = '';
    for (let i = 0; i < bytes.length; i += 0x8000) text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return [stil, btoa(text)];
  })).then(Object.fromEntries).catch((fehler) => {
    console.warn('PDF-Schrift nicht geladen, nehme Helvetica.', fehler);
    schriftDaten = null; // beim nächsten Mal neu versuchen
    return null;
  });
  return schriftDaten;
}

let SCHRIFT = 'helvetica'; // wird zu 'SourceSans3', sobald die Schrift im Dokument steckt
function schriftEinbetten(doc, daten) {
  if (!daten) { SCHRIFT = 'helvetica'; return; }
  for (const [stil, base64] of Object.entries(daten)) {
    const datei = `SourceSans3-${stil}.ttf`;
    doc.addFileToVFS(datei, base64);
    doc.addFont(datei, 'SourceSans3', stil);
  }
  SCHRIFT = 'SourceSans3';
}

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

// Eine Tabelle zeichnen: Zwischentitel und Zeilen; gibt die Unterkante zurück
function abschnitt(doc, titel, x, y, breite, zeilen) {
  doc.setFont(SCHRIFT, 'bold').setFontSize(7.5).setTextColor(...AKZENT);
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
  doc.setFont(SCHRIFT, kraeftig ? 'bold' : 'normal').setFontSize(8).setTextColor(...(kraeftig ? TEXT : LEISE));
  doc.text(beschriftung, x, y + 3.7);
}

const LABEL = 14; // Breite der Beschriftungsspalte in den Tabellen

function tabelleKennwerte(doc, v, x, y, breite) {
  const spalte = (breite - LABEL) / 3;
  const rechts = (i) => x + LABEL + (i + 1) * spalte;
  const zeilen = [(zy) => {
    doc.setFont(SCHRIFT, 'normal').setFontSize(7).setTextColor(...LEISE);
    ['Fassade m²', 'Fenster m²', 'Anteil'].forEach((t, i) => doc.text(t, rechts(i), zy + 3.4, { align: 'right' }));
  }];
  for (const [schluessel, name] of [...Object.entries(RICHTUNGSNAMEN), ['gesamt', 'Gesamt']]) {
    const gesamt = schluessel === 'gesamt';
    zeilen.push((zy) => {
      zeilenkopf(doc, x, zy, breite, name, gesamt);
      const k = v.kennwerte[schluessel];
      doc.setFont(SCHRIFT, gesamt ? 'bold' : 'normal').setFontSize(8.5).setTextColor(...TEXT);
      [quadratmeter(k.fassade), quadratmeter(k.fenster), anteilText(k)].forEach((t, i) => doc.text(t, rechts(i), zy + 3.7, { align: 'right' }));
    });
  }
  return abschnitt(doc, 'Kennwerte', x, y, breite, zeilen);
}

// Höhe der Kennwerte-Tabelle (Spaltenköpfe + N/O/S/W + Gesamt, so wie abschnitt() sie zeichnet)
const KENNWERTE_HOEHE = 5.5 + 6 * ZEILE;

// ---------- Maßstäbliche Ansichten (Sitzung 20c) ----------
const MASSSTAEBE = [50, 100, 200, 500];
const ANSICHTSABSTAND = 8; // waagerecht zwischen zwei Ansichten, mm
const REIHENABSTAND = 6; // senkrecht zwischen zwei Reihen (unter dem Kennzeichen der oberen), mm
const KENNZEICHEN_H = 5; // Platz für das Kennzeichen unter einem Bild, mm
const PERSPEKTIVE_MIN = 40; // schmaler wird die Perspektive nicht, sonst „passt nicht“
const FUSS = 10; // unten frei für Maßstab und Erklärung der Kennwerte, mm

// Eine Ansicht aufs Gebäude zuschneiden (der weiße Bildrand würde sonst Platz kosten) und ihre Größe in mm berechnen.
// m: Maße aus szene.bilderAufnehmen (Meter). Liefert { daten, b, h, sockel } – sockel = mm vom unteren Bildrand bis zur Gebäudeunterkante.
async function ansichtZuschneiden(blob, m, massstab) {
  const bitmap = await createImageBitmap(blob);
  const pxProM = bitmap.width / m.breite; // waagerecht und senkrecht gleich (Parallelprojektion, Seitenverhältnis passt)
  const R = 4; // ein paar Pixel Luft, damit die Kantenlinien ganz bleiben
  const x0 = Math.max(0, Math.floor(m.links * pxProM) - R);
  const x1 = Math.min(bitmap.width, Math.ceil(m.rechts * pxProM) + R);
  const y0 = Math.max(0, Math.floor((m.hoehe - m.oben) * pxProM) - R);
  const unterkante = (m.hoehe - m.unten) * pxProM; // Gebäudeunterkante, Pixel von oben
  const y1 = Math.min(bitmap.height, Math.ceil(unterkante) + R);
  const leinwand = document.createElement('canvas');
  leinwand.width = x1 - x0; leinwand.height = y1 - y0;
  const ctx = leinwand.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, leinwand.width, leinwand.height);
  ctx.drawImage(bitmap, x0, y0, leinwand.width, leinwand.height, 0, 0, leinwand.width, leinwand.height);
  bitmap.close();
  const mm = (px) => (px / pxProM) * 1000 / massstab;
  return { daten: leinwand.toDataURL('image/jpeg', 0.92), b: mm(leinwand.width), h: mm(leinwand.height), sockel: mm(y1 - unterkante) };
}

// Platzbedarf einer Reihe von Ansichten auf gemeinsamer Unterkante (wie in einer Bauzeichnung)
function reihe(ansichten) {
  const ueber = Math.max(...ansichten.map((a) => a.h - a.sockel));
  const unter = Math.max(...ansichten.map((a) => a.sockel));
  return { ansichten, ueber, breite: ansichten.reduce((s, a) => s + a.b, 0) + (ansichten.length - 1) * ANSICHTSABSTAND, hoehe: ueber + unter + KENNZEICHEN_H };
}

// Mögliche Anordnungen der 4 Ansichten: alle in einer Reihe oder 2 × 2
function ansichtenAnordnungen(groessen) {
  const [n, o, s, w] = Object.keys(RICHTUNGSNAMEN).map((r) => ({ richtung: r, ...groessen[r] }));
  const eine = reihe([n, o, s, w]);
  const zwei = [reihe([n, o]), reihe([s, w])];
  return [
    { reihen: [eine], breite: eine.breite, hoehe: eine.hoehe },
    { reihen: zwei, breite: Math.max(zwei[0].breite, zwei[1].breite), hoehe: zwei[0].hoehe + REIHENABSTAND + zwei[1].hoehe },
  ];
}

// Beste Lage in einer Spalte (breite × hoehe): Perspektive (3:2) oben oder links, Ansichten maßstäblich.
// Gewinnt die Lage mit der größten Perspektive; null, wenn die Ansichten nicht hineinpassen.
// neben: so viel mm rechts neben der Perspektive frei lassen (für die Kennwerte-Tabelle), dann nur „Perspektive oben“.
// bildwahl (Sitzung 23i): 'alle' = Perspektive + Ansichten, 'ansichten' = nur Ansichten, 'perspektive' = nur Perspektive.
// wert: danach werden mögliche Seiten-Lagen verglichen (Perspektivbreite; bei nur Ansichten der freie Platz).
function spalteAnordnen(groessen, breite, hoehe, linksErlaubt, neben = 0, bildwahl = 'alle') {
  if (bildwahl === 'perspektive') {
    const p = Math.min(breite - neben, (hoehe - KENNZEICHEN_H) * 1.5);
    if (p < PERSPEKTIVE_MIN) return null;
    const ph = (p * 2) / 3;
    return { p, ph, oben: true, ansichten: null, neben, breite: p + neben, hoehe: ph + KENNZEICHEN_H, wert: p };
  }
  if (bildwahl === 'ansichten') {
    // Ansichten haben eine feste Größe (Maßstab); genommen wird die Anordnung, die am wenigsten knapp passt
    let beste = null;
    for (const a of ansichtenAnordnungen(groessen)) {
      if (a.breite > breite || a.hoehe > hoehe) continue;
      const wert = Math.min(breite - a.breite, hoehe - a.hoehe);
      if (!beste || wert > beste.wert) beste = { p: 0, ph: 0, oben: true, ansichten: a, neben: 0, breite: a.breite, hoehe: a.hoehe, wert };
    }
    return beste;
  }
  let beste = null;
  for (const a of ansichtenAnordnungen(groessen)) {
    if (a.breite > breite || a.hoehe > hoehe) continue;
    const moeglich = [{ oben: true, p: Math.min(breite - neben, (hoehe - a.hoehe - REIHENABSTAND - KENNZEICHEN_H) * 1.5) }];
    if (linksErlaubt && !neben) moeglich.push({ oben: false, p: Math.min(breite - a.breite - 2 * ANSICHTSABSTAND, (hoehe - KENNZEICHEN_H) * 1.5) });
    for (const m of moeglich) {
      if (m.p >= PERSPEKTIVE_MIN && (!beste || m.p > beste.p)) beste = { ...m, ansichten: a };
    }
  }
  if (!beste) return null;
  const { p, oben, ansichten } = beste;
  const ph = (p * 2) / 3;
  const gesamtB = oben ? Math.max(p + neben, ansichten.breite) : p + 2 * ANSICHTSABSTAND + ansichten.breite;
  const gesamtH = oben ? ph + KENNZEICHEN_H + REIHENABSTAND + ansichten.hoehe : Math.max(ph + KENNZEICHEN_H, ansichten.hoehe);
  return { p, ph, oben, ansichten, neben, breite: gesamtB, hoehe: gesamtH, wert: p };
}

// Kennzeichen klein unter ein Bild schreiben
function kennzeichenSchreiben(doc, text, x, y) {
  doc.setFont(SCHRIFT, 'normal').setFontSize(7).setTextColor(...TEXT);
  doc.text(text, x, y + 3.4);
}

// Eine Spalte zeichnen (Perspektive + Ansichten einer Variante), lage aus spalteAnordnen, oben links bei x/y
function spalteZeichnen(doc, v, bilder, lage, x, y, kennzeichen, blickText) {
  const { p, ph, oben, ansichten } = lage;
  // Perspektive (ohne Maßstab), mittig über den Ansichten bzw. links daneben; mit Tabelle daneben bündig links
  if (p > 0) {
    const px = lage.neben ? x : oben ? x + (lage.breite - p) / 2 : x;
    const py = oben ? y : y + (lage.hoehe - ph - KENNZEICHEN_H) / 2;
    doc.addImage(bilder.perspektive, 'JPEG', px, py, p, ph, `v${v.id}-p`);
    kennzeichenSchreiben(doc, blickText(v), px, py + ph + 0.8);
  }
  if (!ansichten) return; // nur Perspektive (Sitzung 23i)

  // Ansichten, Reihe für Reihe auf gemeinsamer Unterkante mit Geländelinie
  const ax0 = oben ? x + (lage.breite - ansichten.breite) / 2 : x + p + 2 * ANSICHTSABSTAND;
  let ry = p === 0 ? y : oben ? y + ph + KENNZEICHEN_H + REIHENABSTAND : y + (lage.hoehe - ansichten.hoehe) / 2;
  for (const r of ansichten.reihen) {
    const grundlinie = ry + r.ueber;
    let ax = ax0 + (ansichten.breite - r.breite) / 2;
    for (const a of r.ansichten) {
      const bild = bilder[a.richtung];
      doc.addImage(bild.daten, 'JPEG', ax, grundlinie - (bild.h - bild.sockel), bild.b, bild.h, `v${v.id}-${a.richtung}-z`);
      doc.setDrawColor(...TEXT).setLineWidth(0.35).line(ax - 2, grundlinie, ax + bild.b + 2, grundlinie);
      kennzeichenSchreiben(doc, kennzeichen(v, a.richtung), ax, grundlinie + r.hoehe - r.ueber - KENNZEICHEN_H + 0.8);
      ax += a.b + ANSICHTSABSTAND;
    }
    ry += r.hoehe + REIHENABSTAND;
  }
}

/**
 * Baut die Übersichtsseite (auf Wunsch + Einzelseiten) und liefert das fertige PDF-Dokument (zum Speichern: doc.save(name)).
 * Seit Sitzung 20c ohne Schrift: nur Kennzeichen der Bilder und der Maßstab; Kennwerte-Tabelle nur, wenn gewünscht.
 * varianten: 1–4 gespeicherte Varianten (älteste zuerst); modellName: Dateiname der IFC (nur für die Datei-Eigenschaften);
 * massstab: 50, 100, 200 oder 500 (gilt für alle Ansichten); blattgroesse: 'a4' … 'a0' (immer quer); mitKennwerte: Tabelle „Kennwerte“ zeigen;
 * seiten (Sitzung 23i, nur ab 2 Varianten): 'einzeln' = je Variante eine Seite, 'vergleich' = alle auf einer Seite,
 *   'beides' = Vergleichsseite und danach je Variante eine Seite (Kennwerte dann nur auf der Vergleichsseite);
 * bildwahl (Sitzung 23i): 'alle' = Perspektive + Ansichten, 'ansichten' = nur Ansichten, 'perspektive' = nur Perspektive;
 * kennzeichen(variante, richtung): Beschriftung einer Ansicht, z. B. „Ansicht Nord“ oder „Ansicht Nordost“;
 * blickText(variante): Beschriftung der Perspektive, z. B. „Perspektive aus Südosten, 15°“
 */
export async function pdfErstellen({ varianten, modellName, kennzeichen, blickText, massstab = 100, blattgroesse = 'a3', mitKennwerte = true, seiten = 'einzeln', bildwahl = 'alle' }) {
  const mitAnsichten = bildwahl !== 'perspektive';
  const alt = mitAnsichten && varianten.find((v) => !v.masse);
  if (alt) throw new Error(`„${alt.name}“ wurde vor dem Update gespeichert und kennt ihre Maße nicht. Bitte die Variante laden und neu speichern.`);
  const [JsPdf, schrift] = await Promise.all([bibliothekLaden(), schriftLaden()]);

  // Bilder vorbereiten: Perspektive unverändert, Ansichten zugeschnitten und in mm umgerechnet
  const bilder = new Map();
  for (const v of varianten) {
    const b = { perspektive: new Uint8Array(await v.bilder.perspektive.arrayBuffer()) };
    if (mitAnsichten) for (const r of Object.keys(RICHTUNGSNAMEN)) b[r] = await ansichtZuschneiden(v.bilder[r], v.masse[r], massstab);
    bilder.set(v, b);
  }

  // Welche Seiten ins PDF kommen: [{ varianten, mitKennwerte }]
  const liste = [];
  if (varianten.length === 1 || seiten !== 'einzeln') liste.push({ varianten, mitKennwerte });
  if (varianten.length > 1 && seiten !== 'vergleich') {
    for (const v of varianten) liste.push({ varianten: [v], mitKennwerte: mitKennwerte && seiten === 'einzeln' });
  }

  // Vorher prüfen, ob alle Seiten aufs Blatt passen, sonst gröberen Maßstab oder größeres Blatt vorschlagen
  const blatt = BLATTGROESSEN[blattgroesse] ?? BLATTGROESSEN.a3;
  const passt = (b) => liste.every((s) => seitenLage(s.varianten, bilder, s.mitKennwerte, b, bildwahl));
  if (!passt(blatt)) {
    const groeber = mitAnsichten && MASSSTAEBE.find((m) => m > massstab);
    const groesser = Object.values(BLATTGROESSEN).find((b) => b.b > blatt.b && passt(b));
    const vorschlaege = [groeber && `1:${groeber}`, groesser && `das Blatt ${groesser.name}`].filter(Boolean);
    throw new Error((mitAnsichten ? `Die Ansichten passen in 1:${massstab} nicht auf ${blatt.name}. ` : `Das passt nicht auf ${blatt.name}. `)
      + (vorschlaege.length ? `Bitte ${vorschlaege.join(' oder ')} wählen.` : 'Bitte weniger Varianten ankreuzen.'));
  }

  const doc = new JsPdf({ orientation: 'landscape', unit: 'mm', format: blattgroesse in BLATTGROESSEN ? blattgroesse : 'a3' });
  schriftEinbetten(doc, schrift);
  doc.setProperties({ title: `${pdfArt(varianten.length, seiten)} – ${modellName}`, creator: 'Fassaden-Tool' });
  const angaben = { bilder, kennzeichen, blickText, massstab, blatt, bildwahl };
  liste.forEach((s, i) => {
    if (i > 0) doc.addPage([blatt.b, blatt.h], 'landscape');
    seiteZeichnen(doc, s.varianten, { ...angaben, mitKennwerte: s.mitKennwerte });
  });
  return doc;
}

// Art des PDFs für Titel und Dateiname
const pdfArt = (anzahl, seiten) => (anzahl === 1 ? 'Fassadenvariante' : seiten === 'einzeln' ? 'Fassadenvarianten' : 'Variantenvergleich');

// Lage aller Spalten einer Seite; null, wenn es nicht passt.
// Alle Spalten bekommen dieselbe Lage (größte Ansicht je Richtung über alle Varianten), damit sie auf einer Höhe stehen.
// Größte Ansicht je Richtung über alle Varianten: alle bekommen dieselbe Lage, damit sie auf einer Höhe stehen
function groessteAnsichten(varianten, bilder) {
  const groessen = {};
  if (!bilder.get(varianten[0]).N) return groessen; // nur Perspektive: keine Ansichten vorbereitet
  for (const r of Object.keys(RICHTUNGSNAMEN)) {
    const alle = varianten.map((v) => bilder.get(v)[r]);
    groessen[r] = { b: Math.max(...alle.map((a) => a.b)), h: Math.max(...alle.map((a) => a.h)), sockel: Math.max(...alle.map((a) => a.sockel)) };
  }
  return groessen;
}

// Lage einer ganzen Seite; null, wenn es nicht passt. Probiert mehrere Anordnungen und nimmt die mit der größten Perspektive:
// - Spalten: eine Spalte je Variante nebeneinander, Kennwerte darunter (bei 1 Variante auch rechts oder neben der Perspektive)
// - Zeilen (ab 2 Varianten): je Variante ein Streifen über die ganze Breite, Kennwerte rechts im Streifen
// Liefert { lage, plaetze: [{ x, y, tabelle: [x, y] | null }], tabelleB }
function seitenLage(varianten, bilder, mitKennwerte, blatt, bildwahl = 'alle') {
  const n = varianten.length;
  const groessen = groessteAnsichten(varianten, bilder);
  const gesamtB = blatt.b - 2 * RAND;
  const gesamtH = blatt.h - 2 * RAND - FUSS;
  const moeglich = [];

  // Spalten
  const spaltenB = (gesamtB - (n - 1) * SPALTENABSTAND) / n;
  const tabelleS = Math.min(spaltenB, 110);
  const spalten = (wo) => {
    const rechts = mitKennwerte && wo === 'rechts', neben = mitKennwerte && wo === 'neben', unten = mitKennwerte && wo === 'unten';
    const breite = rechts ? spaltenB - tabelleS - 12 : spaltenB;
    const hoehe = gesamtH - (unten ? 8 + KENNWERTE_HOEHE : 0);
    const lage = spalteAnordnen(groessen, breite, hoehe, n === 1, neben ? tabelleS + 12 : 0, bildwahl);
    if (!lage) return;
    const y = RAND + (hoehe - lage.hoehe) / 2;
    const plaetze = varianten.map((_, i) => {
      const sx = RAND + i * (spaltenB + SPALTENABSTAND);
      const x = sx + (breite - lage.breite) / 2;
      const tabelle = neben ? [x + lage.breite - tabelleS, y] : rechts ? [sx + spaltenB - tabelleS, y] : unten ? [sx, y + lage.hoehe + 8] : null;
      return { x, y, tabelle };
    });
    moeglich.push({ lage, plaetze, tabelleB: tabelleS });
  };
  spalten('unten');
  if (mitKennwerte && n === 1) { spalten('rechts'); if (bildwahl !== 'ansichten') spalten('neben'); }

  // Zeilen
  if (n > 1) {
    const streifenH = (gesamtH - (n - 1) * SPALTENABSTAND) / n;
    const tabelleZ = 110;
    const breite = gesamtB - (mitKennwerte ? tabelleZ + 12 : 0);
    const lage = spalteAnordnen(groessen, breite, streifenH, true, 0, bildwahl);
    if (lage && (!mitKennwerte || streifenH >= KENNWERTE_HOEHE)) {
      const plaetze = varianten.map((_, i) => {
        const sy = RAND + i * (streifenH + SPALTENABSTAND);
        return { x: RAND + (breite - lage.breite) / 2, y: sy + (streifenH - lage.hoehe) / 2,
          tabelle: mitKennwerte ? [RAND + gesamtB - tabelleZ, sy + (streifenH - KENNWERTE_HOEHE) / 2] : null };
      });
      moeglich.push({ lage, plaetze, tabelleB: tabelleZ });
    }
  }
  return moeglich.sort((a, b) => b.lage.wert - a.lage.wert)[0] ?? null;
}

// Eine Seite (quer, Größe aus blatt) ohne Kopf und Namen: Bilder je Variante, auf Wunsch Kennwerte.
// Unten rechts der Maßstab (nur wenn Ansichten drauf sind), mit Kennwerten unten links deren kurze Erklärung.
function seiteZeichnen(doc, varianten, { bilder, kennzeichen, blickText, massstab, blatt, mitKennwerte, bildwahl }) {
  const { lage, plaetze, tabelleB } = seitenLage(varianten, bilder, mitKennwerte, blatt, bildwahl);
  for (const [i, v] of varianten.entries()) {
    const { x, y, tabelle } = plaetze[i];
    spalteZeichnen(doc, v, bilder.get(v), lage, x, y, kennzeichen, blickText);
    if (tabelle) tabelleKennwerte(doc, v, tabelle[0], tabelle[1], tabelleB);
  }

  const fussY = blatt.h - RAND + 2;
  doc.setFont(SCHRIFT, 'normal').setFontSize(9).setTextColor(...TEXT);
  const massstabText = bildwahl === 'perspektive' ? '' : `Ansichten M 1:${massstab}`;
  if (massstabText) doc.text(massstabText, blatt.b - RAND, fussY, { align: 'right' });
  // Umgebung aus OpenStreetMap (Sitzung 23): Namensnennung ist Pflicht – einzige Schrift-Ausnahme, winzig, links vom Maßstab.
  // Vorlagen (Sitzung 23b) sind frei erfunden und brauchen keinen Vermerk; Varianten ohne „art“ stammen aus Sitzung 23 = OSM.
  // Die Umgebung steht nur in der Perspektive – bei „nur Ansichten“ also kein Vermerk.
  if (bildwahl !== 'ansichten' && varianten.some((v) => v.umgebung && (v.umgebung.art ?? 'osm') === 'osm')) {
    const abstand = massstabText ? doc.getTextWidth(massstabText) + 8 : 0;
    doc.setFontSize(6).setTextColor(...LEISE);
    doc.text('Umgebung © OpenStreetMap-Mitwirkende', blatt.b - RAND - abstand, fussY, { align: 'right' });
  }
  if (mitKennwerte) {
    doc.setFontSize(7).setTextColor(...LEISE);
    doc.text('Flächen in m², Rohbaumaße. Fassade = Außenseite der Außenwände mit allen Öffnungen. '
      + 'Fenster = Fensteröffnungen und Glastüren. Anteil = Fenster ÷ Fassade.', RAND, fussY);
  }
}

// Dateiname wie „Variantenvergleich_Entwurf_2026-11-17.pdf“ (ohne Zeichen, die Windows nicht mag)
export function pdfDateiname(modellName, anzahl, seiten = 'vergleich') {
  const basis = modellName.replace(/\.ifc$/i, '').replace(/[\\/:*?"<>|]+/g, '').trim() || 'Modell';
  const datum = new Date().toLocaleDateString('sv-SE'); // ergibt 2026-11-17
  return `${pdfArt(anzahl, seiten)}_${basis}_${datum}.pdf`;
}
